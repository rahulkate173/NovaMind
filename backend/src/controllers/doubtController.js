// ─────────────────────────────────────────────────────────────
//  doubtController.js  –  handles doubt solver API endpoints
// ─────────────────────────────────────────────────────────────

import { solveDoubt }  from '../services/Ai.service.js';
import { Doubt }       from '../models/Doubt.model.js';

// ── POST /api/doubt/solve ─────────────────────────────────────
// Body: { question: string, category?: string }
export async function solveDoubtHandler(req, res) {
  const { question, category = 'General', userId } = req.body;

  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: 'question is required.' });
  }

  try {
    // 1. Get AI answer
    const answer = await solveDoubt(question, category);

    // 2. Persist to MongoDB
    const doubt = await Doubt.create({
      question : question.trim(),
      category,
      tag      : 'solved',
      messages : [
        { role: 'user', content: question.trim() },
        { role: 'ai',   content: answer },
      ],
      userId   : userId || null,
    });

    return res.status(200).json({
      id      : doubt._id,
      answer,
      category: doubt.category,
      tag     : doubt.tag,
      createdAt: doubt.createdAt,
    });
  } catch (err) {
    console.error('[doubtController] solveDoubt:', err.message);
    return res.status(503).json({ error: err.message });
  }
}

// ── GET /api/doubt/history ─────────────────────────────────────
// Returns recent doubt records (sorted newest first)
export async function getDoubtHistoryHandler(req, res) {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const doubts = await Doubt.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .select('question category tag createdAt userId')
      .lean();

    return res.status(200).json({ doubts });
  } catch (err) {
    console.error('[doubtController] getHistory:', err.message);
    return res.status(500).json({ error: 'Could not fetch history.' });
  }
}

// ── GET /api/doubt/:id ─────────────────────────────────────────
// Returns a single doubt thread (with messages)
export async function getDoubtByIdHandler(req, res) {
  try {
    const doubt = await Doubt.findById(req.params.id).lean();
    if (!doubt) return res.status(404).json({ error: 'Doubt not found.' });
    return res.status(200).json({ doubt });
  } catch (err) {
    console.error('[doubtController] getById:', err.message);
    return res.status(500).json({ error: 'Could not fetch doubt.' });
  }
}
