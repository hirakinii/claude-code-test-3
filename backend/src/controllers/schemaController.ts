import { Request, Response } from 'express';
import {
  getSchemaById,
  createCategory,
  updateCategory,
  deleteCategory,
  createField,
  updateField,
  deleteField,
  resetSchemaToDefault,
} from '../services/schemaService';
import { logger } from '../utils/logger';

/**
 * スキーマ取得ハンドラー
 * GET /api/schema/:schemaId
 */
export async function getSchemaHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { schemaId } = req.params;

    // バリデーション
    if (!schemaId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Schema ID is required',
        },
      });
      return;
    }

    const schema = await getSchemaById(schemaId);

    res.status(200).json({
      success: true,
      data: schema,
    });
  } catch (error) {
    logger.error('Failed to get schema', { error });

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'Schema not found') {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCHEMA_NOT_FOUND',
          message: 'Schema not found',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve schema',
      },
    });
  }
}

/**
 * カテゴリ作成ハンドラー
 * POST /api/schema/categories
 */
export async function createCategoryHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { schemaId, name, description, displayOrder } = req.body;

    // バリデーション
    if (!schemaId || !name || displayOrder === undefined) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields are missing (schemaId, name, displayOrder)',
        },
      });
      return;
    }

    if (typeof displayOrder !== 'number' || displayOrder < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'displayOrder must be a positive number',
        },
      });
      return;
    }

    const category = await createCategory({
      schemaId,
      name,
      description,
      displayOrder,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('Failed to create category', { error });

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'Schema not found') {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCHEMA_NOT_FOUND',
          message: 'Schema not found',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create category',
      },
    });
  }
}

/**
 * カテゴリ更新ハンドラー
 * PUT /api/schema/categories/:id
 */
export async function updateCategoryHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, displayOrder } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category ID is required',
        },
      });
      return;
    }

    // displayOrder のバリデーション
    if (displayOrder !== undefined && (typeof displayOrder !== 'number' || displayOrder < 1)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'displayOrder must be a positive number',
        },
      });
      return;
    }

    const category = await updateCategory(id, { name, description, displayOrder });

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('Failed to update category', { error });

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'Category not found') {
      res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update category',
      },
    });
  }
}

/**
 * カテゴリ削除ハンドラー
 * DELETE /api/schema/categories/:id
 */
export async function deleteCategoryHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category ID is required',
        },
      });
      return;
    }

    await deleteCategory(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete category', { error });

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'Category not found') {
      res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete category',
      },
    });
  }
}

/**
 * フィールド作成ハンドラー
 * POST /api/schema/fields
 */
export async function createFieldHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      categoryId,
      fieldName,
      dataType,
      isRequired,
      options,
      listTargetEntity,
      placeholderText,
      displayOrder,
    } = req.body;

    // バリデーション
    if (!categoryId || !fieldName || !dataType || displayOrder === undefined) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields are missing (categoryId, fieldName, dataType, displayOrder)',
        },
      });
      return;
    }

    // dataType の検証
    const validDataTypes = ['TEXT', 'TEXTAREA', 'DATE', 'RADIO', 'CHECKBOX', 'LIST'];
    if (!validDataTypes.includes(dataType)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid dataType. Must be one of: ${validDataTypes.join(', ')}`,
        },
      });
      return;
    }

    const field = await createField({
      categoryId,
      fieldName,
      dataType,
      isRequired: isRequired || false,
      options,
      listTargetEntity,
      placeholderText,
      displayOrder,
    });

    res.status(201).json({
      success: true,
      data: field,
    });
  } catch (error) {
    logger.error('Failed to create field', { error });

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'Category not found') {
      res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
        },
      });
      return;
    }

    if (
      errorMessage.includes('Options are required') ||
      errorMessage.includes('listTargetEntity is required')
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMessage,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create field',
      },
    });
  }
}

/**
 * フィールド更新ハンドラー
 * PUT /api/schema/fields/:id
 */
export async function updateFieldHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const {
      fieldName,
      dataType,
      isRequired,
      options,
      listTargetEntity,
      placeholderText,
      displayOrder,
    } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Field ID is required',
        },
      });
      return;
    }

    // dataType の検証
    if (dataType) {
      const validDataTypes = ['TEXT', 'TEXTAREA', 'DATE', 'RADIO', 'CHECKBOX', 'LIST'];
      if (!validDataTypes.includes(dataType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid dataType. Must be one of: ${validDataTypes.join(', ')}`,
          },
        });
        return;
      }
    }

    const field = await updateField(id, {
      fieldName,
      dataType,
      isRequired,
      options,
      listTargetEntity,
      placeholderText,
      displayOrder,
    });

    res.status(200).json({
      success: true,
      data: field,
    });
  } catch (error) {
    logger.error('Failed to update field', { error });

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'Field not found') {
      res.status(404).json({
        success: false,
        error: {
          code: 'FIELD_NOT_FOUND',
          message: 'Field not found',
        },
      });
      return;
    }

    if (errorMessage.includes('Options are required')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMessage,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update field',
      },
    });
  }
}

/**
 * フィールド削除ハンドラー
 * DELETE /api/schema/fields/:id
 */
export async function deleteFieldHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Field ID is required',
        },
      });
      return;
    }

    await deleteField(id);

    res.status(200).json({
      success: true,
      message: 'Field deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete field', { error });

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'Field not found') {
      res.status(404).json({
        success: false,
        error: {
          code: 'FIELD_NOT_FOUND',
          message: 'Field not found',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete field',
      },
    });
  }
}

/**
 * スキーマリセットハンドラー
 * POST /api/schema/reset
 */
export async function resetSchemaHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { schemaId } = req.body;

    if (!schemaId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Schema ID is required',
        },
      });
      return;
    }

    const schema = await resetSchemaToDefault(schemaId);

    res.status(200).json({
      success: true,
      data: schema,
      message: 'Schema reset to default successfully',
    });
  } catch (error) {
    logger.error('Failed to reset schema', { error });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reset schema',
      },
    });
  }
}
