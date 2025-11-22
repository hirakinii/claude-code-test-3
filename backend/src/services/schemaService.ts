import {
  PrismaClient,
  Schema,
  SchemaCategory,
  SchemaField,
} from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Type for Schema with nested relations
type SchemaWithRelations = Schema & {
  categories: (SchemaCategory & {
    fields: SchemaField[];
  })[];
};

/**
 * スキーマをIDで取得
 * カテゴリとフィールドを含む完全なスキーマ定義を返す
 */
export async function getSchemaById(
  schemaId: string,
): Promise<SchemaWithRelations> {
  try {
    const schema = await prisma.schema.findUnique({
      where: { id: schemaId },
      include: {
        categories: {
          orderBy: { displayOrder: 'asc' },
          include: {
            fields: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!schema) {
      throw new Error('Schema not found');
    }

    logger.debug('Schema retrieved successfully', { schemaId });
    return schema;
  } catch (error) {
    logger.error('Failed to get schema', { schemaId, error });
    throw error;
  }
}

/**
 * カテゴリを作成
 */
export async function createCategory(data: {
  schemaId: string;
  name: string;
  description?: string;
  displayOrder: number;
}): Promise<SchemaCategory> {
  try {
    // スキーマの存在確認
    const schema = await prisma.schema.findUnique({
      where: { id: data.schemaId },
    });

    if (!schema) {
      throw new Error('Schema not found');
    }

    // カテゴリ作成
    const category = await prisma.schemaCategory.create({
      data: {
        schemaId: data.schemaId,
        name: data.name,
        description: data.description,
        displayOrder: data.displayOrder,
      },
    });

    logger.info('Category created successfully', { categoryId: category.id });
    return category;
  } catch (error) {
    logger.error('Failed to create category', { data, error });
    throw error;
  }
}

/**
 * カテゴリを更新
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    displayOrder?: number;
  },
): Promise<SchemaCategory> {
  try {
    // 存在確認
    const existingCategory = await prisma.schemaCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // 更新
    const category = await prisma.schemaCategory.update({
      where: { id },
      data,
    });

    logger.info('Category updated successfully', { categoryId: id });
    return category;
  } catch (error) {
    logger.error('Failed to update category', { id, data, error });
    throw error;
  }
}

/**
 * カテゴリを削除（カスケード削除）
 */
export async function deleteCategory(
  id: string,
): Promise<{ success: boolean }> {
  try {
    // 存在確認
    const existingCategory = await prisma.schemaCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // カスケード削除（Prismaスキーマで onDelete: Cascade 設定済み）
    await prisma.schemaCategory.delete({
      where: { id },
    });

    logger.info('Category deleted successfully', { categoryId: id });
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete category', { id, error });
    throw error;
  }
}

/**
 * フィールドを作成
 */
export async function createField(data: {
  categoryId: string;
  fieldName: string;
  dataType: 'TEXT' | 'TEXTAREA' | 'DATE' | 'RADIO' | 'CHECKBOX' | 'LIST';
  isRequired: boolean;
  options?: string[] | null;
  listTargetEntity?: string | null;
  placeholderText?: string | null;
  displayOrder: number;
}): Promise<SchemaField> {
  try {
    // カテゴリの存在確認
    const category = await prisma.schemaCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // データ型別バリデーション
    if (
      (data.dataType === 'RADIO' || data.dataType === 'CHECKBOX') &&
      !data.options
    ) {
      throw new Error('Options are required for RADIO/CHECKBOX data type');
    }

    if (data.dataType === 'LIST' && !data.listTargetEntity) {
      throw new Error('listTargetEntity is required for LIST data type');
    }

    // フィールド作成
    const field = await prisma.schemaField.create({
      data: {
        categoryId: data.categoryId,
        fieldName: data.fieldName,
        dataType: data.dataType,
        isRequired: data.isRequired,
        options: data.options ?? undefined,
        listTargetEntity: data.listTargetEntity,
        placeholderText: data.placeholderText,
        displayOrder: data.displayOrder,
      },
    });

    logger.info('Field created successfully', { fieldId: field.id });
    return field;
  } catch (error) {
    logger.error('Failed to create field', { data, error });
    throw error;
  }
}

/**
 * フィールドを更新
 */
export async function updateField(
  id: string,
  data: {
    fieldName?: string;
    dataType?: 'TEXT' | 'TEXTAREA' | 'DATE' | 'RADIO' | 'CHECKBOX' | 'LIST';
    isRequired?: boolean;
    options?: string[] | null;
    listTargetEntity?: string | null;
    placeholderText?: string | null;
    displayOrder?: number;
  },
): Promise<SchemaField> {
  try {
    // 存在確認
    const existingField = await prisma.schemaField.findUnique({
      where: { id },
    });

    if (!existingField) {
      throw new Error('Field not found');
    }

    // データ型別バリデーション
    const dataType = data.dataType || existingField.dataType;
    if (
      (dataType === 'RADIO' || dataType === 'CHECKBOX') &&
      data.options === undefined
    ) {
      // 既存のoptionsを維持
    } else if (
      (dataType === 'RADIO' || dataType === 'CHECKBOX') &&
      !data.options
    ) {
      throw new Error('Options are required for RADIO/CHECKBOX data type');
    }

    // 更新
    const updateData: {
      fieldName?: string;
      dataType?: 'TEXT' | 'TEXTAREA' | 'DATE' | 'RADIO' | 'CHECKBOX' | 'LIST';
      isRequired?: boolean;
      options?: string[];
      listTargetEntity?: string | null;
      placeholderText?: string | null;
      displayOrder?: number;
    } = {};

    if (data.fieldName !== undefined) {
      updateData.fieldName = data.fieldName;
    }
    if (data.dataType !== undefined) {
      updateData.dataType = data.dataType;
    }
    if (data.isRequired !== undefined) {
      updateData.isRequired = data.isRequired;
    }
    if (data.options !== undefined && data.options !== null) {
      updateData.options = data.options;
    }
    if (data.listTargetEntity !== undefined) {
      updateData.listTargetEntity = data.listTargetEntity;
    }
    if (data.placeholderText !== undefined) {
      updateData.placeholderText = data.placeholderText;
    }
    if (data.displayOrder !== undefined) {
      updateData.displayOrder = data.displayOrder;
    }

    const field = await prisma.schemaField.update({
      where: { id },
      data: updateData,
    });

    logger.info('Field updated successfully', { fieldId: id });
    return field;
  } catch (error) {
    logger.error('Failed to update field', { id, data, error });
    throw error;
  }
}

/**
 * フィールドを削除
 */
export async function deleteField(id: string): Promise<{ success: boolean }> {
  try {
    // 存在確認
    const existingField = await prisma.schemaField.findUnique({
      where: { id },
    });

    if (!existingField) {
      throw new Error('Field not found');
    }

    // 削除
    await prisma.schemaField.delete({
      where: { id },
    });

    logger.info('Field deleted successfully', { fieldId: id });
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete field', { id, error });
    throw error;
  }
}

/**
 * スキーマをデフォルト設定にリセット
 * トランザクションで既存データを削除し、シードデータから復元
 */
export async function resetSchemaToDefault(
  schemaId: string,
): Promise<SchemaWithRelations | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. 既存のカテゴリとフィールドを削除（カスケード）
      await tx.schemaCategory.deleteMany({
        where: { schemaId },
      });

      logger.info('Existing schema data deleted', { schemaId });

      // 2. シードデータから復元
      // Note: 実際のシードデータの投入は別途実装が必要
      // ここでは削除のみ行い、復元は手動で行う想定

      // 3. 復元後のスキーマを返却
      const schema = await tx.schema.findUnique({
        where: { id: schemaId },
        include: {
          categories: {
            orderBy: { displayOrder: 'asc' },
            include: {
              fields: {
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
        },
      });

      logger.info('Schema reset completed', { schemaId });
      return schema;
    });
  } catch (error) {
    logger.error('Failed to reset schema', { schemaId, error });
    throw error;
  }
}
