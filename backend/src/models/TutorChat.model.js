// ─────────────────────────────────────────────────────────────
//  models/TutorChat.model.js  –  Mongoose schema for AI Tutor sessions
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const TutorMessageSchema = new Schema(
  {
    role    : { type: String, enum: ['user', 'ai'], required: true },
    content : { type: String, required: true },
    time    : { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  },
  { _id: false }
);

const TutorChatSchema = new Schema(
  {
    userId   : { type: String, required: false, index: true },
    title    : { type: String, default: 'New Conversation', trim: true },
    messages : { type: [TutorMessageSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const TutorChat = model('TutorChat', TutorChatSchema);
