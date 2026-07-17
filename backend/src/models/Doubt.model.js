// ─────────────────────────────────────────────────────────────
//  models/Doubt.model.js  –  Mongoose schema for doubt messages
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// ── Sub-document: a single message (user or AI) ───────────────
const MessageSchema = new Schema(
  {
    role    : { type: String, enum: ['user', 'ai'], required: true },
    content : { type: String, required: true },
  },
  { _id: false }
);

// ── Root document: one doubt thread ──────────────────────────
const DoubtSchema = new Schema(
  {
    question : { type: String, required: true, trim: true },
    category : { type: String, default: 'General', trim: true },
    tag      : { type: String, enum: ['pending', 'solved'], default: 'pending' },
    messages : { type: [MessageSchema], default: [] },
    userId   : { type: String, required: false, index: true },
  },
  {
    timestamps: true,   // adds createdAt & updatedAt automatically
    versionKey: false,
  }
);

export const Doubt = model('Doubt', DoubtSchema);
