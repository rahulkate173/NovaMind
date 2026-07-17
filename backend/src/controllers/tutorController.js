// ─────────────────────────────────────────────────────────────
//  tutorController.js  –  handles AI Tutor session & chat endpoints
// ─────────────────────────────────────────────────────────────

import { getTutorReply } from '../services/AiTutor.service.js';
import { TutorChat }     from '../models/TutorChat.model.js';
import LearningTask      from '../models/LearningTask.model.js';

async function getTodayTasksForUser(userId) {
  if (!userId) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const pyRes = await fetch(`http://127.0.0.1:8000/api/tasks/daily/${encodeURIComponent(userId)}?sync=true`, {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeout);

    if (pyRes && pyRes.ok) {
      const pyData = await pyRes.json();
      if (pyData && Array.isArray(pyData.tasks)) {
        return pyData.tasks;
      }
    }
  } catch (e) {}

  try {
    const doc = await LearningTask.findOne({ userId }).lean();
    return doc && Array.isArray(doc.tasks) ? doc.tasks : [];
  } catch (e) {
    return [];
  }
}

// ── POST /api/tutor/chat ─────────────────────────────────────
// Body: { chatId?: string, userId?: string, message: string }
export async function chatHandler(req, res) {
  const { chatId, userId, message } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'message is required.' });
  }

  try {
    let chat = null;
    if (chatId) {
      chat = await TutorChat.findById(chatId);
    }

    const previousMsgs = chat ? chat.messages : [];
    let tasksContext = null;
    if (message.trim().toLowerCase().startsWith('/today')) {
      const tasks = await getTodayTasksForUser(userId);
      if (tasks && tasks.length > 0) {
        tasksContext = `Student's Assigned Tasks for Today (${tasks.length} tasks):\n` +
          tasks.map((t, i) => `Task #${i + 1}: ${t.title || t.text || t.task || 'Task'} (Status: ${t.done || t.completed ? 'Completed' : 'Pending'})\nDescription: ${t.description || 'N/A'}\nResources: ${Array.isArray(t.resources) ? t.resources.map(r => r.title || r.url).join(', ') : 'None'}`).join('\n\n');
      } else {
        tasksContext = "The student currently has no tasks assigned for today. Instruct them to start or resume a study plan from their Dashboard.";
      }
    }

    const reply = await getTutorReply(message, previousMsgs, tasksContext);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages = [
      { role: 'user', content: message.trim(), time: nowTime },
      { role: 'ai',   content: reply, time: nowTime },
    ];

    if (chat) {
      chat.messages.push(...newMessages);
      await chat.save();
    } else {
      const cleanTitle = message.trim().slice(0, 40) + (message.trim().length > 40 ? '...' : '');
      chat = await TutorChat.create({
        userId   : userId || null,
        title    : cleanTitle,
        messages : newMessages,
      });
    }

    return res.status(200).json({
      chatId  : chat._id,
      title   : chat.title,
      reply,
      messages: chat.messages,
    });
  } catch (err) {
    console.error('[tutorController] chatHandler:', err.message);
    return res.status(503).json({ error: err.message });
  }
}

// ── GET /api/tutor/history ─────────────────────────────────────
// Returns recent tutor sessions sorted by updatedAt descending
export async function getHistoryHandler(req, res) {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const sessions = await TutorChat.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('title updatedAt userId')
      .lean();

    return res.status(200).json({ sessions });
  } catch (err) {
    console.error('[tutorController] getHistory:', err.message);
    return res.status(500).json({ error: 'Could not fetch tutor sessions.' });
  }
}

// ── GET /api/tutor/history/:id ─────────────────────────────────
// Returns a single tutor conversation with all messages
export async function getChatByIdHandler(req, res) {
  try {
    const chat = await TutorChat.findById(req.params.id).lean();
    if (!chat) return res.status(404).json({ error: 'Conversation not found.' });
    return res.status(200).json({ chat });
  } catch (err) {
    console.error('[tutorController] getChatById:', err.message);
    return res.status(500).json({ error: 'Could not fetch conversation.' });
  }
}

// ── DELETE /api/tutor/history/:id ──────────────────────────────
export async function deleteChatHandler(req, res) {
  try {
    await TutorChat.findByIdAndDelete(req.params.id);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[tutorController] deleteChat:', err.message);
    return res.status(500).json({ error: 'Could not delete conversation.' });
  }
}
