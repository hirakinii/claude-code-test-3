import { Router, RequestHandler } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getSpecificationsHandler,
  createSpecificationHandler,
  getSpecificationByIdHandler,
  deleteSpecificationHandler,
} from '../controllers/specificationController';

const router = Router();

// All endpoints require authentication
router.use(requireAuth);

// GET /api/specifications - List specifications (paginated)
router.get('/', getSpecificationsHandler as RequestHandler);

// POST /api/specifications - Create new specification (shell)
router.post('/', createSpecificationHandler as RequestHandler);

// GET /api/specifications/:id - Get specification by ID
router.get('/:id', getSpecificationByIdHandler as RequestHandler);

// DELETE /api/specifications/:id - Delete specification
router.delete('/:id', deleteSpecificationHandler as RequestHandler);

export default router;
