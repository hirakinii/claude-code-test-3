import {
  PrismaClient,
  Specification,
  SpecificationStatus,
  Prisma,
} from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Types
export interface GetSpecificationsParams {
  userId: string;
  page?: number;
  limit?: number;
  status?: SpecificationStatus;
  sort?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SpecificationListItem {
  id: string;
  title: string | null;
  status: SpecificationStatus;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpecificationWithAuthor extends Specification {
  author: {
    id: string;
    fullName: string;
    email: string;
  };
}

// Default schema ID (from seed data)
const DEFAULT_SCHEMA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

/**
 * 仕様書一覧を取得（ページネーション対応）
 */
export async function getSpecifications(
  params: GetSpecificationsParams,
): Promise<PaginatedResult<SpecificationListItem>> {
  const { userId, page = 1, limit = 10, status, sort = '-updatedAt' } = params;

  // Validate pagination params
  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.min(100, Math.max(1, limit));

  // Parse sort parameter
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortOrder: 'asc' | 'desc' = sort.startsWith('-') ? 'desc' : 'asc';

  // Validate sort field
  const allowedSortFields = ['updatedAt', 'createdAt', 'title', 'version'];
  const validSortField = allowedSortFields.includes(sortField)
    ? sortField
    : 'updatedAt';

  try {
    // Build where clause
    const where: Prisma.SpecificationWhereInput = {
      authorId: userId,
      ...(status && { status }),
    };

    // Get total count
    const total = await prisma.specification.count({ where });

    // Get paginated items
    const items = await prisma.specification.findMany({
      where,
      orderBy: { [validSortField]: sortOrder },
      skip: (validatedPage - 1) * validatedLimit,
      take: validatedLimit,
      select: {
        id: true,
        title: true,
        status: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.debug('Specifications retrieved', {
      userId,
      count: items.length,
      total,
    });

    return {
      items,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages: Math.ceil(total / validatedLimit),
      },
    };
  } catch (error) {
    logger.error('Failed to get specifications', { userId, error });
    throw error;
  }
}

/**
 * 新規仕様書を作成（シェルレコード）
 */
export async function createSpecification(data: {
  userId: string;
  schemaId?: string;
}): Promise<Specification> {
  const schemaId = data.schemaId || DEFAULT_SCHEMA_ID;

  try {
    // Verify schema exists
    const schema = await prisma.schema.findUnique({
      where: { id: schemaId },
    });

    if (!schema) {
      const error = new Error('Schema not found');
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }

    // Create specification shell
    const specification = await prisma.specification.create({
      data: {
        authorId: data.userId,
        schemaId,
        status: 'DRAFT',
        version: '1.0',
      },
    });

    logger.info('Specification created', { specificationId: specification.id });
    return specification;
  } catch (error) {
    logger.error('Failed to create specification', { data, error });
    throw error;
  }
}

/**
 * 仕様書をIDで取得（作成者情報を含む）
 */
export async function getSpecificationById(
  specificationId: string,
  userId: string,
): Promise<SpecificationWithAuthor> {
  try {
    const specification = await prisma.specification.findUnique({
      where: { id: specificationId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!specification) {
      const error = new Error('Specification not found');
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }

    // Authorization check: only author can access
    if (specification.authorId !== userId) {
      const error = new Error('Access denied');
      (error as Error & { statusCode: number }).statusCode = 403;
      throw error;
    }

    logger.debug('Specification retrieved', { specificationId });
    return specification;
  } catch (error) {
    logger.error('Failed to get specification', { specificationId, error });
    throw error;
  }
}

/**
 * 仕様書を削除
 */
export async function deleteSpecification(
  specificationId: string,
  userId: string,
): Promise<{ success: boolean }> {
  try {
    const specification = await prisma.specification.findUnique({
      where: { id: specificationId },
    });

    if (!specification) {
      const error = new Error('Specification not found');
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }

    // Authorization check: only author can delete
    if (specification.authorId !== userId) {
      const error = new Error('Access denied');
      (error as Error & { statusCode: number }).statusCode = 403;
      throw error;
    }

    // Delete specification (cascades to related records per Prisma schema)
    await prisma.specification.delete({
      where: { id: specificationId },
    });

    logger.info('Specification deleted', { specificationId });
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete specification', { specificationId, error });
    throw error;
  }
}
