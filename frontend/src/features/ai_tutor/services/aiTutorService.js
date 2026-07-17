// ─────────────────────────────────────────────────────────────
//  aiTutorService.js  –  connects to Express backend AI Tutor API
// ─────────────────────────────────────────────────────────────

const BASE = '/api/tutor';

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${res.status}`);
  }
  return res.json();
}

/**
 * POST /api/tutor/chat
 * Sends message to AI Tutor with chatId/userId context.
 * @returns {Promise<{ chatId, title, reply, messages }>}
 */
export async function sendTutorMessage({ chatId, userId, message }) {
  const data = await handleResponse(
    await fetch(`${BASE}/chat`, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({ chatId, userId, message }),
    })
  );
  return data;
}

/**
 * GET /api/tutor/history
 * Fetches user's previous AI Tutor sessions.
 * @returns {Promise<Array<{ _id, title, updatedAt }>>}
 */
export async function fetchTutorHistory(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const data = await handleResponse(await fetch(`${BASE}/history${query}`));
  return data.sessions || [];
}

/**
 * GET /api/tutor/history/:id
 * Fetches full conversation messages for a chat session.
 * @returns {Promise<Object>}
 */
export async function fetchTutorChatById(chatId) {
  const data = await handleResponse(await fetch(`${BASE}/history/${chatId}`));
  return data.chat;
}

/**
 * DELETE /api/tutor/history/:id
 * Deletes a chat session.
 */
export async function deleteTutorChat(chatId) {
  return handleResponse(
    await fetch(`${BASE}/history/${chatId}`, { method: 'DELETE' })
  );
}
