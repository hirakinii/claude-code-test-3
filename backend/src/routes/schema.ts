import { Router, RequestHandler } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import {
  getSchemaHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  createFieldHandler,
  updateFieldHandler,
  deleteFieldHandler,
  resetSchemaHandler,
} from '../controllers/schemaController';

const router = Router();

// すべてのエンドポイントに認証と管理者権限を要求
router.use(requireAuth);
router.use(requireAdmin);

// スキーマ取得
router.get('/:schemaId', getSchemaHandler as RequestHandler);

// カテゴリCRUD
router.post('/categories', createCategoryHandler as RequestHandler);
router.put('/categories/:id', updateCategoryHandler as RequestHandler);
router.delete('/categories/:id', deleteCategoryHandler as RequestHandler);

// フィールドCRUD
router.post('/fields', createFieldHandler as RequestHandler);
router.put('/fields/:id', updateFieldHandler as RequestHandler);
router.delete('/fields/:id', deleteFieldHandler as RequestHandler);

// デフォルト復元
router.post('/reset', resetSchemaHandler as RequestHandler);

export default router;
