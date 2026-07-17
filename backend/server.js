// ─────────────────────────────────────────────────────────────
//  server.js  –  HTTP server entry point
// ─────────────────────────────────────────────────────────────

import './src/config/config.js';   // validate env vars first — exits if missing
import { connectDB } from './src/config/db.js';
import app           from './src/app.js';
import { config }    from './src/config/config.js';

async function start() {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`🚀  SkillX backend running on http://localhost:${config.port}`);
  });
}

start();
