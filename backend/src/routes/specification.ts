import { Router, RequestHandler } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getSpecificationsHandler,
  createSpecificationHandler,
  getSpecificationByIdHandler,
  deleteSpecificationHandler,
  getSpecificationContentHandler,
  saveSpecificationHandler,
} from '../controllers/specificationController';

const router = Router();

// All endpoints require authentication
router.use(requireAuth);

// GET /api/specifications - List specifications (paginated)
router.get('/', getSpecificationsHandler as RequestHandler);

// POST /api/specifications - Create new specification (shell)
router.post('/', createSpecificationHandler as RequestHandler);

// GET /api/specifications/:id/content - Get specification content (EAV + sub-entities)
router.get('/:id/content', getSpecificationContentHandler as RequestHandler);

// GET /api/specifications/:id - Get specification by ID
router.get('/:id', getSpecificationByIdHandler as RequestHandler);

// PUT /api/specifications/:id - Save specification (EAV + sub-entities)
router.put('/:id', saveSpecificationHandler as RequestHandler);

// DELETE /api/specifications/:id - Delete specification
router.delete('/:id', deleteSpecificationHandler as RequestHandler);

export default router;
