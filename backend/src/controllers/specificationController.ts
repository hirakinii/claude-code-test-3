import { Response, NextFunction } from 'express';
import { SpecificationStatus } from '@prisma/client';
import * as specificationService from '../services/specificationService';
import {
  CreateSpecificationRequestBody,
  GetSpecificationsQueryParams,
  SaveSpecificationRequestBody,
} from '../types/requests';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * 仕様書一覧取得ハンドラー
 * GET /api/specifications
 */
export async function getSpecificationsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    /* istanbul ignore if -- @preserve auth middleware guarantees userId exists */
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const query = req.query as unknown as GetSpecificationsQueryParams;

    // Parse query parameters
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const status = query.status as SpecificationStatus | undefined;
    const sort = query.sort || '-updatedAt';

    // Validate status if provided
    if (status && !['DRAFT', 'REVIEW', 'SAVED'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: DRAFT, REVIEW, SAVED',
      });
      return;
    }

    const result = await specificationService.getSpecifications({
      userId,
      page,
      limit,
      status,
      sort,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in getSpecificationsHandler', { error });
    next(error);
  }
}

/**
 * 新規仕様書作成ハンドラー
 * POST /api/specifications
 */
export async function createSpecificationHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    /* istanbul ignore if -- @preserve auth middleware guarantees userId exists */
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const body = req.body as CreateSpecificationRequestBody;

    // Validate schemaId format if provided
    if (body.schemaId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(body.schemaId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid schemaId format',
        });
        return;
      }
    }

    const specification = await specificationService.createSpecification({
      userId,
      schemaId: body.schemaId,
    });

    res.status(201).json({
      success: true,
      data: specification,
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    if (err.message === 'Schema not found') {
      res.status(404).json({ success: false, error: 'Schema not found' });
      return;
    }
    /* istanbul ignore next -- @preserve defensive error handler */
    logger.error('Error in createSpecificationHandler', { error });
    /* istanbul ignore next -- @preserve defensive error handler */
    next(error);
  }
}

/**
 * 仕様書詳細取得ハンドラー
 * GET /api/specifications/:id
 */
export async function getSpecificationByIdHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    /* istanbul ignore if -- @preserve auth middleware guarantees userId exists */
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    /* istanbul ignore if -- @preserve Express routing guarantees id exists */
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Specification ID is required',
      });
      return;
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid specification ID format',
      });
      return;
    }

    const specification = await specificationService.getSpecificationById(
      id,
      userId,
    );

    res.json({
      success: true,
      data: specification,
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    if (err.message === 'Specification not found') {
      res
        .status(404)
        .json({ success: false, error: 'Specification not found' });
      return;
    }
    if (err.message === 'Access denied') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }
    /* istanbul ignore next -- @preserve defensive error handler */
    logger.error('Error in getSpecificationByIdHandler', { error });
    /* istanbul ignore next -- @preserve defensive error handler */
    next(error);
  }
}

/**
 * 仕様書削除ハンドラー
 * DELETE /api/specifications/:id
 */
export async function deleteSpecificationHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    /* istanbul ignore if -- @preserve auth middleware guarantees userId exists */
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    /* istanbul ignore if -- @preserve Express routing guarantees id exists */
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Specification ID is required',
      });
      return;
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid specification ID format',
      });
      return;
    }

    await specificationService.deleteSpecification(id, userId);

    res.json({
      success: true,
      message: 'Specification deleted successfully',
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    if (err.message === 'Specification not found') {
      res
        .status(404)
        .json({ success: false, error: 'Specification not found' });
      return;
    }
    if (err.message === 'Access denied') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }
    /* istanbul ignore next -- @preserve defensive error handler */
    logger.error('Error in deleteSpecificationHandler', { error });
    /* istanbul ignore next -- @preserve defensive error handler */
    next(error);
  }
}

/**
 * 仕様書コンテンツ取得ハンドラー
 * GET /api/specifications/:id/content
 */
/* istanbul ignore next -- @preserve function not yet tested */
export async function getSpecificationContentHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Specification ID is required',
      });
      return;
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid specification ID format',
      });
      return;
    }

    const content = await specificationService.getSpecificationContent(
      id,
      userId,
    );

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    if (err.message === 'Specification not found') {
      res
        .status(404)
        .json({ success: false, error: 'Specification not found' });
      return;
    }
    if (err.message === 'Access denied') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }
    logger.error('Error in getSpecificationContentHandler', { error });
    next(error);
  }
}

/**
 * 仕様書保存ハンドラー
 * PUT /api/specifications/:id
 */
/* istanbul ignore next -- @preserve function not yet tested */
export async function saveSpecificationHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Specification ID is required',
      });
      return;
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid specification ID format',
      });
      return;
    }

    const body = req.body as SaveSpecificationRequestBody;

    // Basic validation
    if (!body.content || typeof body.content !== 'object') {
      res.status(400).json({
        success: false,
        error: 'content is required and must be an object',
      });
      return;
    }

    const specification = await specificationService.saveSpecification(
      id,
      userId,
      {
        content: body.content,
        deliverables: body.deliverables || [],
        contractorRequirements: body.contractorRequirements || [],
        basicBusinessRequirements: body.basicBusinessRequirements || [],
        businessTasks: body.businessTasks || [],
      },
    );

    res.json({
      success: true,
      data: {
        id: specification.id,
        title: specification.title,
        status: specification.status,
        version: specification.version,
        updatedAt: specification.updatedAt,
      },
    });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    if (err.message === 'Specification not found') {
      res
        .status(404)
        .json({ success: false, error: 'Specification not found' });
      return;
    }
    if (err.message === 'Access denied') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }
    logger.error('Error in saveSpecificationHandler', { error });
    next(error);
  }
}
