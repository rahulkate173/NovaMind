// ─────────────────────────────────────────────────────────────
//  doubtSolverService.js  –  connects to NovaMind backend AI API
// ─────────────────────────────────────────────────────────────

const BASE = '/api/doubt';

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${res.status}`);
  }
  return res.json();
}

/**
 * POST /api/doubt/solve
 * Sends the question to the backend, gets AI answer + saves to DB.
 * @returns {Promise<{ id, answer, category, tag, createdAt }>}
 */
export async function getDoubtAnswer(question, category = 'General', userId) {
  const data = await handleResponse(
    await fetch(`${BASE}/solve`, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({ question, category, userId }),
    })
  );
  return data;   // { id, answer, category, tag, createdAt }
}

/**
 * GET /api/doubt/history
 * Fetches the 50 most recent doubts from MongoDB.
 * @returns {Promise<Array>}
 */
export async function fetchDoubtHistory(userId) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const data = await handleResponse(await fetch(`${BASE}/history${query}`));
  return data.doubts;   // array of { _id, question, category, tag, createdAt }
}

/**
 * GET /api/doubt/:id
 * Fetches a single doubt thread with full messages.
 * @returns {Promise<Object>}
 */
export async function fetchDoubtById(id) {
  const data = await handleResponse(await fetch(`${BASE}/${id}`));
  return data.doubt;
}
