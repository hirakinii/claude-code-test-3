import { Router } from 'express';
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
router.get('/', getSpecificationsHandler);

// POST /api/specifications - Create new specification (shell)
router.post('/', createSpecificationHandler);

// GET /api/specifications/:id - Get specification by ID
router.get('/:id', getSpecificationByIdHandler);

// DELETE /api/specifications/:id - Delete specification
router.delete('/:id', deleteSpecificationHandler);

export default router;
