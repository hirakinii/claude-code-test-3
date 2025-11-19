import { Router } from 'express';
import { loginHandler } from '../controllers/authController';

const router = Router();

/**
 * POST /api/auth/login
 * ユーザーログイン
 */
router.post('/login', loginHandler);

export default router;
