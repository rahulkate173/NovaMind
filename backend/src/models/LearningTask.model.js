// ─────────────────────────────────────────────────────────────
//  models/LearningTask.model.js
//  Caches a user's daily task snapshot from the Python learning agent.
//  Lets the dashboard reload instantly without waiting for the agent.
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ResourceSchema = new Schema(
  {
    title : { type: String, default: '' },
    url   : { type: String, default: '' },
    kind  : { type: String, default: 'link' },
  },
  { _id: false }
);

const TaskItemSchema = new Schema(
  {
    taskId      : { type: String, required: true },
    title       : { type: String, required: true },
    description : { type: String, default: '' },
    resources   : { type: [ResourceSchema], default: [] },
    done        : { type: Boolean, default: false },
    week        : { type: Number, default: 1 },
    day         : { type: Number, default: 1 },
  },
  { _id: false }
);

const LearningTaskSchema = new Schema(
  {
    userId        : { type: String, required: true, unique: true, index: true },
    tasks         : { type: [TaskItemSchema], default: [] },
    currentWeek   : { type: Number, default: 1 },
    planTitle     : { type: String, default: '' },
    syncedAt      : { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const LearningTask = model('LearningTask', LearningTaskSchema);
export default LearningTask;
