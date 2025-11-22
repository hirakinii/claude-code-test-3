import { Router, RequestHandler } from 'express';
import { loginHandler } from '../controllers/authController';

const router = Router();

/**
 * POST /api/auth/login
 * ユーザーログイン
 */
router.post('/login', loginHandler as RequestHandler);

export default router;
