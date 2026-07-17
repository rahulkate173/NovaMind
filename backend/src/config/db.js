// ─────────────────────────────────────────────────────────────
//  config/db.js  –  MongoDB connection via Mongoose
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
