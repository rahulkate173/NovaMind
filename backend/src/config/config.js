// ─────────────────────────────────────────────────────────────
//  config/config.js  –  centralised env config with validation
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';

const REQUIRED_VARS = ['GROQ_API_KEY', 'MONGO_URI'];

// ── Validate all required env variables on startup ────────────
const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`\n❌  Missing required environment variables:\n   ${missing.join('\n   ')}\n`);
  console.error('   Please add them to your .env file and restart the server.\n');
  process.exit(1);
}

// ── Export typed config object ────────────────────────────────
export const config = {
  groqApiKey : process.env.GROQ_API_KEY,
  mongoUri   : process.env.MONGO_URI,
  port       : parseInt(process.env.PORT || '3000', 10),
  nodeEnv    : process.env.NODE_ENV || 'development',
  googleClientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  jwtSecret  : process.env.JWT_SECRET || 'your-jwt-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
