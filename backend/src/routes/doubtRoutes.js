// ─────────────────────────────────────────────────────────────
//  doubtRoutes.js  –  routes for the doubt solver feature
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  solveDoubtHandler,
  getDoubtHistoryHandler,
  getDoubtByIdHandler,
} from '../controllers/doubtController.js';

const router = Router();

router.post('/solve',      solveDoubtHandler);       // POST /api/doubt/solve
router.get('/history',     getDoubtHistoryHandler);  // GET  /api/doubt/history
router.get('/:id',         getDoubtByIdHandler);     // GET  /api/doubt/:id

export default router;
