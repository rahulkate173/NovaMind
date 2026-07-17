// ─────────────────────────────────────────────────────────────
//  Ai.service.js  –  Doubt Solver AI service
//  Uses: LangChain (@langchain/groq) + Groq Cloud LLM
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';

import { ChatGroq }           from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence }   from '@langchain/core/runnables';

// ── 1. Model initialisation ──────────────────────────────────
const model = new ChatGroq({
  apiKey     : process.env.GROQ_API_KEY,
  model      : 'llama-3.3-70b-versatile', // current recommended Groq model
  temperature: 0.6,
  maxTokens  : 1024,
});

// ── 2. Prompt template ───────────────────────────────────────
/**
 * System persona: expert tutor who gives clear, structured answers
 * with markdown-formatted code blocks when relevant.
 */
const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are NovaMind AI — an expert programming and computer-science tutor.
Your job is to answer student doubts clearly, concisely, and with examples.

Guidelines:
- Format code snippets inside markdown fenced code blocks with the language tag.
- Use bullet points or numbered steps for multi-part explanations.
- Keep the answer focused and educational; avoid unnecessary filler.
- If the category gives context (e.g. DSA, JavaScript, Python), tailor your answer accordingly.
- End with a short "Key Takeaway" sentence if appropriate.

Category: {category}`,
  ],
  [
    'human',
    'Student doubt: {question}',
  ],
]);

// ── 3. Output parser ─────────────────────────────────────────
const outputParser = new StringOutputParser();

// ── 4. Chain (Prompt → Model → Parser) ──────────────────────
const doubtChain = RunnableSequence.from([
  promptTemplate,
  model,
  outputParser,
]);

// ── 5. Exported service function ─────────────────────────────
/**
 * Solves a student doubt using Groq LLM via LangChain.
 *
 * @param {string} question  - The student's question / doubt
 * @param {string} category  - Subject area (e.g. "DSA", "JS", "Python", "General")
 * @returns {Promise<string>} - AI-generated markdown answer
 */
export async function solveDoubt(question, category = 'General') {
  if (!question || !question.trim()) {
    throw new Error('Question must not be empty.');
  }

  try {
    const answer = await doubtChain.invoke({
      question : question.trim(),
      category : category.trim() || 'General',
    });

    return answer;
  } catch (err) {
    console.error('[Ai.service] Error calling Groq:', err.message);
    throw new Error('AI service is temporarily unavailable. Please try again.');
  }
}
