// ─────────────────────────────────────────────────────────────
//  AiTutor.service.js  –  AI Tutor service using LangChain & Groq
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

const model = new ChatGroq({
  apiKey     : process.env.GROQ_API_KEY,
  model      : 'llama-3.3-70b-versatile',
  temperature: 0.6,
  maxTokens  : 1024,
});

const tutorPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are NovaMind AI Tutor — a friendly, expert computer science tutor available 24/7.
Your goal is to guide the student clearly through programming and technical concepts.

Guidelines:
1. Always format your responses cleanly using Markdown with headings, bullet points, and clean spacing.
2. When giving code examples, wrap them in fenced code blocks with the exact programming language tag (e.g. \`\`\`javascript, \`\`\`python).
3. Be supportive and conversational.
4. Keep explanations concise, clear, and focused on deep understanding rather than memorization.
5. If the student typed "/today" or asks to explain today's tasks (see Assigned Tasks Context below), provide an encouraging introduction followed by a complete, step-by-step conceptual walkthrough and thorough explanation for EACH task listed. Explain the "why" and "how" behind every task so they feel confident tackling them.

Previous Conversation Context:
{chatHistory}

Assigned Tasks Context:
{tasksContext}`
  ],
  [
    'human',
    '{message}'
  ]
]);

const outputParser = new StringOutputParser();

const tutorChain = RunnableSequence.from([
  tutorPrompt,
  model,
  outputParser,
]);

/**
 * Solves or discusses a student tutor message with conversational history.
 *
 * @param {string} message     - Current user message
 * @param {Array}  previousMsgs - Previous messages [{ role: 'user' | 'ai', content: string }]
 * @param {string} tasksContext - Optional context describing today's tasks
 * @returns {Promise<string>}  - AI-generated markdown reply
 */
export async function getTutorReply(message, previousMsgs = [], tasksContext = null) {
  if (!message || !message.trim()) {
    throw new Error('Message must not be empty.');
  }

  // Format previous messages into text context (last 6 messages)
  const recentHistory = previousMsgs
    .slice(-6)
    .map(m => `${m.role === 'ai' ? 'AI Tutor' : 'Student'}: ${m.content}`)
    .join('\n\n');

  try {
    const reply = await tutorChain.invoke({
      message    : message.trim(),
      chatHistory: recentHistory || 'No previous context.',
      tasksContext: tasksContext || 'No specific task context provided.',
    });

    return reply;
  } catch (err) {
    console.error('[AiTutor.service] Error calling Groq:', err.message);
    throw new Error('AI Tutor service is temporarily unavailable. Please try again.');
  }
}
