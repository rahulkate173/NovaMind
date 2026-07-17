// ─────────────────────────────────────────────────────────────
//  models/QuizAttempt.model.js
//  Stores every quiz attempt a user submits – permanent record
//  in MongoDB, separate from the Python agent's state store.
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const AnswerSchema = new Schema(
  {
    questionId : { type: String, required: true },
    prompt     : { type: String, default: '' },
    answer     : { type: String, default: '' },  // user's response
    correct    : { type: Boolean, default: null }, // null = not auto-graded
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema(
  {
    userId      : { type: String, required: true, index: true },
    quizId      : { type: String, required: true },
    taskId      : { type: String, required: true },
    title       : { type: String, default: '' },
    topics      : { type: [String], default: [] },
    score       : { type: Number, required: true, min: 0, max: 100 },
    passed      : { type: Boolean, required: true },
    weakTopics  : { type: [String], default: [] },
    answers     : { type: [AnswerSchema], default: [] },
    week        : { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Compound index for quick lookups
QuizAttemptSchema.index({ userId: 1, quizId: 1 });

export const QuizAttempt = model('QuizAttempt', QuizAttemptSchema);
export default QuizAttempt;
