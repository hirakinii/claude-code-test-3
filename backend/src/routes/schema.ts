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
router.get('/:schemaId', getSchemaHandler as unknown as RequestHandler);

// カテゴリCRUD
router.post('/categories', createCategoryHandler as unknown as RequestHandler);
router.put('/categories/:id', updateCategoryHandler as unknown as RequestHandler);
router.delete('/categories/:id', deleteCategoryHandler as unknown as RequestHandler);

// フィールドCRUD
router.post('/fields', createFieldHandler as unknown as RequestHandler);
router.put('/fields/:id', updateFieldHandler as unknown as RequestHandler);
router.delete('/fields/:id', deleteFieldHandler as unknown as RequestHandler);

// デフォルト復元
router.post('/reset', resetSchemaHandler as unknown as RequestHandler);

export default router;
