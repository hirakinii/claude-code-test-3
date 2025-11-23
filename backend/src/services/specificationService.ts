import {
  PrismaClient,
  Specification,
  SpecificationStatus,
  Prisma,
  Deliverable,
  ContractorRequirement,
  BasicBusinessRequirement,
  BusinessTask,
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

// Field value type (EAV pattern)
export type FieldValue = string | string[] | null;

// Specification content response
export interface SpecificationContentResponse {
  id: string;
  title: string | null;
  status: SpecificationStatus;
  version: string;
  schemaId: string;
  content: Record<string, FieldValue>;
  deliverables: Deliverable[];
  contractorRequirements: ContractorRequirement[];
  basicBusinessRequirements: BasicBusinessRequirement[];
  businessTasks: BusinessTask[];
}

// Sub-entity input types
export interface DeliverableInput {
  name: string;
  quantity?: number;
  description?: string;
}

export interface ContractorRequirementInput {
  category: string;
  description: string;
}

export interface BasicBusinessRequirementInput {
  category: string;
  description: string;
}

export interface BusinessTaskInput {
  title: string;
  detailedSpec: string;
}

// Save specification payload
export interface SaveSpecificationPayload {
  content: Record<string, FieldValue>;
  deliverables: DeliverableInput[];
  contractorRequirements: ContractorRequirementInput[];
  basicBusinessRequirements: BasicBusinessRequirementInput[];
  businessTasks: BusinessTaskInput[];
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

/**
 * Parse field value from stored string
 */
function parseFieldValue(value: string): FieldValue {
  try {
    return JSON.parse(value) as FieldValue;
  } catch {
    return value;
  }
}

/**
 * 仕様書コンテンツを取得（EAVデータとサブエンティティ含む）
 */
export async function getSpecificationContent(
  specificationId: string,
  userId: string,
): Promise<SpecificationContentResponse> {
  try {
    const specification = await prisma.specification.findUnique({
      where: { id: specificationId },
      include: {
        content: true,
        deliverables: true,
        contractorRequirements: true,
        basicBusinessRequirements: true,
        businessTasks: true,
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

    // Convert EAV data to object
    const content: Record<string, FieldValue> = {};
    for (const item of specification.content) {
      content[item.fieldId] = parseFieldValue(item.value);
    }

    logger.debug('Specification content retrieved', { specificationId });

    return {
      id: specification.id,
      title: specification.title,
      status: specification.status,
      version: specification.version,
      schemaId: specification.schemaId,
      content,
      deliverables: specification.deliverables,
      contractorRequirements: specification.contractorRequirements,
      basicBusinessRequirements: specification.basicBusinessRequirements,
      businessTasks: specification.businessTasks,
    };
  } catch (error) {
    logger.error('Failed to get specification content', {
      specificationId,
      error,
    });
    throw error;
  }
}

/**
 * Calculate new version and status based on content
 */
function calculateVersionAndStatus(
  currentVersion: string,
): { newVersion: string; newStatus: SpecificationStatus } {
  const [major, minor] = currentVersion.split('.').map(Number);

  // For now, always increment minor version and keep as DRAFT
  // Full required field validation will be added in Phase 5
  return {
    newVersion: `${major}.${minor + 1}`,
    newStatus: 'DRAFT' as SpecificationStatus,
  };
}

/**
 * 仕様書を保存（EAVデータとサブエンティティ含む）
 */
export async function saveSpecification(
  specificationId: string,
  userId: string,
  payload: SaveSpecificationPayload,
): Promise<Specification> {
  try {
    // 1. Authorization check
    const specification = await prisma.specification.findUnique({
      where: { id: specificationId },
    });

    if (!specification) {
      const error = new Error('Specification not found');
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }

    if (specification.authorId !== userId) {
      const error = new Error('Access denied');
      (error as Error & { statusCode: number }).statusCode = 403;
      throw error;
    }

    // 2. Calculate version and status
    const { newVersion, newStatus } = calculateVersionAndStatus(
      specification.version,
    );

    // 3. Extract title from content (find title field - first TEXT field named 件名)
    // For now, use the first text value or keep existing title
    let newTitle = specification.title;
    const contentValues = Object.values(payload.content);
    if (contentValues.length > 0 && typeof contentValues[0] === 'string') {
      newTitle = contentValues[0];
    }

    // 4. Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing EAV data
      await tx.specificationContent.deleteMany({
        where: { specificationId },
      });

      // Delete existing sub-entities
      await tx.deliverable.deleteMany({
        where: { specificationId },
      });
      await tx.contractorRequirement.deleteMany({
        where: { specificationId },
      });
      await tx.basicBusinessRequirement.deleteMany({
        where: { specificationId },
      });
      await tx.businessTask.deleteMany({
        where: { specificationId },
      });

      // Insert EAV data
      const contentEntries = Object.entries(payload.content).map(
        ([fieldId, value]) => ({
          specificationId,
          fieldId,
          value: JSON.stringify(value),
        }),
      );

      if (contentEntries.length > 0) {
        await tx.specificationContent.createMany({
          data: contentEntries,
        });
      }

      // Insert deliverables
      if (payload.deliverables.length > 0) {
        await tx.deliverable.createMany({
          data: payload.deliverables.map((d) => ({
            specificationId,
            name: d.name,
            quantity: d.quantity ?? 1,
            description: d.description,
          })),
        });
      }

      // Insert contractor requirements
      if (payload.contractorRequirements.length > 0) {
        await tx.contractorRequirement.createMany({
          data: payload.contractorRequirements.map((r) => ({
            specificationId,
            category: r.category,
            description: r.description,
          })),
        });
      }

      // Insert basic business requirements
      if (payload.basicBusinessRequirements.length > 0) {
        await tx.basicBusinessRequirement.createMany({
          data: payload.basicBusinessRequirements.map((r) => ({
            specificationId,
            category: r.category,
            description: r.description,
          })),
        });
      }

      // Insert business tasks
      if (payload.businessTasks.length > 0) {
        await tx.businessTask.createMany({
          data: payload.businessTasks.map((t) => ({
            specificationId,
            title: t.title,
            detailedSpec: t.detailedSpec,
          })),
        });
      }

      // Update specification
      return tx.specification.update({
        where: { id: specificationId },
        data: {
          title: newTitle,
          version: newVersion,
          status: newStatus,
        },
      });
    });

    logger.info('Specification saved', {
      specificationId,
      version: newVersion,
      status: newStatus,
    });

    return result;
  } catch (error) {
    logger.error('Failed to save specification', { specificationId, error });
    throw error;
  }
}
