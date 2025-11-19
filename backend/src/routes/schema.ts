import { Router } from 'express';
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
router.get('/:schemaId', getSchemaHandler);

// カテゴリCRUD
router.post('/categories', createCategoryHandler);
router.put('/categories/:id', updateCategoryHandler);
router.delete('/categories/:id', deleteCategoryHandler);

// フィールドCRUD
router.post('/fields', createFieldHandler);
router.put('/fields/:id', updateFieldHandler);
router.delete('/fields/:id', deleteFieldHandler);

// デフォルト復元
router.post('/reset', resetSchemaHandler);

export default router;
