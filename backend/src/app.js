// ─────────────────────────────────────────────────────────────
//  app.js  –  Express application setup
// ─────────────────────────────────────────────────────────────

import express    from 'express';
import cors       from 'cors';
import passport   from 'passport';
import doubtRoutes     from './routes/doubtRoutes.js';
import tutorRoutes     from './routes/tutorRoutes.js';
import authRoutes      from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();

// Trust reverse proxy (Render / Vercel HTTPS load balancing) so Passport sees https:// instead of http://
app.enable('trust proxy');

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/doubt', doubtRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
