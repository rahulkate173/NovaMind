// ─────────────────────────────────────────────────────────────
//  tutorRoutes.js  –  routes for the AI Tutor feature
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  chatHandler,
  getHistoryHandler,
  getChatByIdHandler,
  deleteChatHandler,
} from '../controllers/tutorController.js';

const router = Router();

router.post('/chat',        chatHandler);         // POST   /api/tutor/chat
router.get('/history',      getHistoryHandler);   // GET    /api/tutor/history
router.get('/history/:id',  getChatByIdHandler);  // GET    /api/tutor/history/:id
router.delete('/history/:id', deleteChatHandler); // DELETE /api/tutor/history/:id

export default router;
