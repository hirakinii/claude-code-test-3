import { PrismaClient } from '@prisma/client';
import {
  getSchemaById,
  createCategory,
  updateCategory,
  deleteCategory,
  createField,
  updateField,
  deleteField,
  resetSchemaToDefault,
} from '../../../src/services/schemaService';

const prisma = new PrismaClient();

describe('SchemaService', () => {
  let testSchemaId: string;
  let createdCategoryIds: string[] = [];
  let createdFieldIds: string[] = [];

  // テスト開始時にテスト専用スキーマを作成
  beforeAll(async () => {
    const testSchema = await prisma.schema.create({
      data: {
        schemaName: 'Test Schema for Unit Tests',
        schemaVersion: '1.0.0-test',
        status: 'DRAFT',
      },
    });
    testSchemaId = testSchema.id;
  });

  // テスト後のクリーンアップ
  afterEach(async () => {
    // 作成されたフィールドを削除
    for (const fieldId of createdFieldIds) {
      try {
        await prisma.schemaField.delete({ where: { id: fieldId } });
      } catch (error) {
        // 既に削除されている場合は無視
      }
    }
    createdFieldIds = [];

    // 作成されたカテゴリを削除
    for (const categoryId of createdCategoryIds) {
      try {
        await prisma.schemaCategory.delete({ where: { id: categoryId } });
      } catch (error) {
        // 既に削除されている場合は無視
      }
    }
    createdCategoryIds = [];
  });

  // テスト終了時にテスト専用スキーマを削除
  afterAll(async () => {
    if (testSchemaId) {
      try {
        await prisma.schema.delete({ where: { id: testSchemaId } });
      } catch (error) {
        // 既に削除されている場合は無視
      }
    }
    await prisma.$disconnect();
  });

  describe('getSchemaById', () => {
    it('should return schema with categories and fields', async () => {
      const schema = await getSchemaById(testSchemaId);

      expect(schema).toBeDefined();
      expect(schema.id).toBe(testSchemaId);
      expect(schema.categories).toBeDefined();
      expect(Array.isArray(schema.categories)).toBe(true);
    });

    it('should sort categories by displayOrder ascending', async () => {
      const schema = await getSchemaById(testSchemaId);

      const displayOrders = schema.categories.map((c) => c.displayOrder);
      const sorted = [...displayOrders].sort((a, b) => a - b);
      expect(displayOrders).toEqual(sorted);
    });

    it('should include fields for each category', async () => {
      const schema = await getSchemaById(testSchemaId);

      schema.categories.forEach((category) => {
        expect(category.fields).toBeDefined();
        expect(Array.isArray(category.fields)).toBe(true);
      });
    });

    it('should sort fields by displayOrder ascending', async () => {
      const schema = await getSchemaById(testSchemaId);

      schema.categories.forEach((category) => {
        if (category.fields.length > 0) {
          const displayOrders = category.fields.map((f) => f.displayOrder);
          const sorted = [...displayOrders].sort((a, b) => a - b);
          expect(displayOrders).toEqual(sorted);
        }
      });
    });

    it('should throw error for non-existent schema', async () => {
      await expect(getSchemaById('non-existent-id')).rejects.toThrow(
        'Schema not found'
      );
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Test Category',
        description: 'Test Description',
        displayOrder: 99,
      });

      createdCategoryIds.push(category.id);

      expect(category).toBeDefined();
      expect(category.name).toBe('Test Category');
      expect(category.description).toBe('Test Description');
      expect(category.displayOrder).toBe(99);
      expect(category.schemaId).toBe(testSchemaId);
    });

    it('should create category without description', async () => {
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Category Without Description',
        displayOrder: 98,
      });

      createdCategoryIds.push(category.id);

      expect(category).toBeDefined();
      expect(category.name).toBe('Category Without Description');
      expect(category.description).toBeNull();
      expect(category.displayOrder).toBe(98);
    });

    it('should throw error for non-existent schema', async () => {
      await expect(
        createCategory({
          schemaId: 'non-existent-id',
          name: 'Test',
          displayOrder: 1,
        })
      ).rejects.toThrow('Schema not found');
    });

    it('should create category with unique ID', async () => {
      const category1 = await createCategory({
        schemaId: testSchemaId,
        name: 'Category 1',
        displayOrder: 97,
      });
      createdCategoryIds.push(category1.id);

      const category2 = await createCategory({
        schemaId: testSchemaId,
        name: 'Category 2',
        displayOrder: 96,
      });
      createdCategoryIds.push(category2.id);

      expect(category1.id).not.toBe(category2.id);
    });
  });

  describe('updateCategory', () => {
    it('should update category name', async () => {
      // カテゴリ作成
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Original Name',
        displayOrder: 95,
      });
      createdCategoryIds.push(category.id);

      // 更新
      const updated = await updateCategory(category.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.displayOrder).toBe(95); // 変更されていない
      expect(updated.id).toBe(category.id);
    });

    it('should update category description', async () => {
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Test',
        description: 'Original',
        displayOrder: 94,
      });
      createdCategoryIds.push(category.id);

      const updated = await updateCategory(category.id, {
        description: 'Updated Description',
      });

      expect(updated.description).toBe('Updated Description');
      expect(updated.name).toBe('Test');
    });

    it('should update category displayOrder', async () => {
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Test',
        displayOrder: 93,
      });
      createdCategoryIds.push(category.id);

      const updated = await updateCategory(category.id, {
        displayOrder: 50,
      });

      expect(updated.displayOrder).toBe(50);
    });

    it('should update multiple fields at once', async () => {
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Original',
        description: 'Original Desc',
        displayOrder: 92,
      });
      createdCategoryIds.push(category.id);

      const updated = await updateCategory(category.id, {
        name: 'Updated',
        description: 'Updated Desc',
        displayOrder: 91,
      });

      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('Updated Desc');
      expect(updated.displayOrder).toBe(91);
    });

    it('should throw error for non-existent category', async () => {
      await expect(
        updateCategory('non-existent-id', { name: 'Test' })
      ).rejects.toThrow('Category not found');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      // カテゴリ作成
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'To Delete',
        displayOrder: 90,
      });

      // 削除
      const result = await deleteCategory(category.id);

      expect(result.success).toBe(true);

      // 削除確認
      const deleted = await prisma.schemaCategory.findUnique({
        where: { id: category.id },
      });
      expect(deleted).toBeNull();
    });

    it('should cascade delete fields', async () => {
      // カテゴリ作成
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Category with Field',
        displayOrder: 89,
      });

      // フィールド作成
      const field = await createField({
        categoryId: category.id,
        fieldName: 'Test Field',
        dataType: 'TEXT',
        isRequired: false,
        displayOrder: 1,
      });

      // カテゴリ削除
      await deleteCategory(category.id);

      // フィールドも削除されているか確認
      const deletedField = await prisma.schemaField.findUnique({
        where: { id: field.id },
      });
      expect(deletedField).toBeNull();
    });

    it('should throw error for non-existent category', async () => {
      await expect(deleteCategory('non-existent-id')).rejects.toThrow(
        'Category not found'
      );
    });
  });

  describe('createField', () => {
    let testCategoryId: string;

    beforeEach(async () => {
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Test Category for Fields',
        displayOrder: 88,
      });
      testCategoryId = category.id;
      createdCategoryIds.push(category.id);
    });

    it('should create TEXT field', async () => {
      const field = await createField({
        categoryId: testCategoryId,
        fieldName: 'Test Text Field',
        dataType: 'TEXT',
        isRequired: true,
        placeholderText: 'Enter text',
        displayOrder: 1,
      });
      createdFieldIds.push(field.id);

      expect(field).toBeDefined();
      expect(field.fieldName).toBe('Test Text Field');
      expect(field.dataType).toBe('TEXT');
      expect(field.isRequired).toBe(true);
      expect(field.placeholderText).toBe('Enter text');
      expect(field.categoryId).toBe(testCategoryId);
    });

    it('should create RADIO field with options', async () => {
      const field = await createField({
        categoryId: testCategoryId,
        fieldName: 'Test Radio Field',
        dataType: 'RADIO',
        isRequired: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
        displayOrder: 2,
      });
      createdFieldIds.push(field.id);

      expect(field).toBeDefined();
      expect(field.dataType).toBe('RADIO');
      expect(field.options).toEqual(['Option 1', 'Option 2', 'Option 3']);
    });

    it('should create CHECKBOX field with options', async () => {
      const field = await createField({
        categoryId: testCategoryId,
        fieldName: 'Test Checkbox Field',
        dataType: 'CHECKBOX',
        isRequired: false,
        options: ['Choice A', 'Choice B'],
        displayOrder: 3,
      });
      createdFieldIds.push(field.id);

      expect(field.dataType).toBe('CHECKBOX');
      expect(field.options).toEqual(['Choice A', 'Choice B']);
    });

    it('should throw error for RADIO without options', async () => {
      await expect(
        createField({
          categoryId: testCategoryId,
          fieldName: 'Invalid Radio',
          dataType: 'RADIO',
          isRequired: false,
          displayOrder: 4,
        })
      ).rejects.toThrow('Options are required for RADIO/CHECKBOX data type');
    });

    it('should throw error for CHECKBOX without options', async () => {
      await expect(
        createField({
          categoryId: testCategoryId,
          fieldName: 'Invalid Checkbox',
          dataType: 'CHECKBOX',
          isRequired: false,
          displayOrder: 5,
        })
      ).rejects.toThrow('Options are required for RADIO/CHECKBOX data type');
    });

    it('should create LIST field with listTargetEntity', async () => {
      const field = await createField({
        categoryId: testCategoryId,
        fieldName: 'Test List Field',
        dataType: 'LIST',
        isRequired: false,
        listTargetEntity: 'Deliverable',
        displayOrder: 6,
      });
      createdFieldIds.push(field.id);

      expect(field).toBeDefined();
      expect(field.dataType).toBe('LIST');
      expect(field.listTargetEntity).toBe('Deliverable');
    });

    it('should throw error for LIST without listTargetEntity', async () => {
      await expect(
        createField({
          categoryId: testCategoryId,
          fieldName: 'Invalid List',
          dataType: 'LIST',
          isRequired: false,
          displayOrder: 7,
        })
      ).rejects.toThrow('listTargetEntity is required for LIST data type');
    });

    it('should create TEXTAREA field', async () => {
      const field = await createField({
        categoryId: testCategoryId,
        fieldName: 'Test Textarea',
        dataType: 'TEXTAREA',
        isRequired: false,
        displayOrder: 8,
      });
      createdFieldIds.push(field.id);

      expect(field.dataType).toBe('TEXTAREA');
    });

    it('should create DATE field', async () => {
      const field = await createField({
        categoryId: testCategoryId,
        fieldName: 'Test Date',
        dataType: 'DATE',
        isRequired: false,
        displayOrder: 9,
      });
      createdFieldIds.push(field.id);

      expect(field.dataType).toBe('DATE');
    });

    it('should throw error for non-existent category', async () => {
      await expect(
        createField({
          categoryId: 'non-existent-id',
          fieldName: 'Test',
          dataType: 'TEXT',
          isRequired: false,
          displayOrder: 10,
        })
      ).rejects.toThrow('Category not found');
    });
  });

  describe('updateField', () => {
    let testCategoryId: string;
    let testFieldId: string;

    beforeEach(async () => {
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Test Category for Field Updates',
        displayOrder: 87,
      });
      testCategoryId = category.id;
      createdCategoryIds.push(category.id);

      const field = await createField({
        categoryId: testCategoryId,
        fieldName: 'Original Field',
        dataType: 'TEXT',
        isRequired: false,
        displayOrder: 1,
      });
      testFieldId = field.id;
      createdFieldIds.push(field.id);
    });

    it('should update field name', async () => {
      const updated = await updateField(testFieldId, {
        fieldName: 'Updated Field Name',
      });

      expect(updated.fieldName).toBe('Updated Field Name');
      expect(updated.dataType).toBe('TEXT');
    });

    it('should update field isRequired', async () => {
      const updated = await updateField(testFieldId, {
        isRequired: true,
      });

      expect(updated.isRequired).toBe(true);
    });

    it('should update field displayOrder', async () => {
      const updated = await updateField(testFieldId, {
        displayOrder: 99,
      });

      expect(updated.displayOrder).toBe(99);
    });

    it('should update field dataType', async () => {
      const updated = await updateField(testFieldId, {
        dataType: 'TEXTAREA',
      });

      expect(updated.dataType).toBe('TEXTAREA');
    });

    it('should update RADIO field with options', async () => {
      const updated = await updateField(testFieldId, {
        dataType: 'RADIO',
        options: ['Choice 1', 'Choice 2'],
      });

      expect(updated.dataType).toBe('RADIO');
      expect(updated.options).toEqual(['Choice 1', 'Choice 2']);
    });

    it('should throw error when updating to RADIO without options', async () => {
      await expect(
        updateField(testFieldId, {
          dataType: 'RADIO',
          options: null,
        })
      ).rejects.toThrow('Options are required for RADIO/CHECKBOX data type');
    });

    it('should throw error for non-existent field', async () => {
      await expect(
        updateField('non-existent-id', { fieldName: 'Test' })
      ).rejects.toThrow('Field not found');
    });
  });

  describe('deleteField', () => {
    let testCategoryId: string;

    beforeEach(async () => {
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Test Category for Field Deletion',
        displayOrder: 86,
      });
      testCategoryId = category.id;
      createdCategoryIds.push(category.id);
    });

    it('should delete field', async () => {
      const field = await createField({
        categoryId: testCategoryId,
        fieldName: 'Field to Delete',
        dataType: 'TEXT',
        isRequired: false,
        displayOrder: 1,
      });

      const result = await deleteField(field.id);

      expect(result.success).toBe(true);

      const deleted = await prisma.schemaField.findUnique({
        where: { id: field.id },
      });
      expect(deleted).toBeNull();
    });

    it('should throw error for non-existent field', async () => {
      await expect(deleteField('non-existent-id')).rejects.toThrow(
        'Field not found'
      );
    });
  });

  describe('resetSchemaToDefault', () => {
    it('should delete existing categories and fields', async () => {
      // テスト用カテゴリとフィールドを作成
      const category = await createCategory({
        schemaId: testSchemaId,
        name: 'Category to Reset',
        displayOrder: 85,
      });
      createdCategoryIds.push(category.id);

      const field = await createField({
        categoryId: category.id,
        fieldName: 'Field to Reset',
        dataType: 'TEXT',
        isRequired: false,
        displayOrder: 1,
      });

      // リセット実行
      const result = await resetSchemaToDefault(testSchemaId);

      expect(result).toBeDefined();

      // カテゴリが削除されたことを確認
      const deletedCategory = await prisma.schemaCategory.findUnique({
        where: { id: category.id },
      });
      expect(deletedCategory).toBeNull();

      // フィールドも削除されたことを確認
      const deletedField = await prisma.schemaField.findUnique({
        where: { id: field.id },
      });
      expect(deletedField).toBeNull();

      // クリーンアップリストから削除（既に削除済み）
      createdCategoryIds = createdCategoryIds.filter((id) => id !== category.id);
      createdFieldIds = createdFieldIds.filter((id) => id !== field.id);
    });

    it('should return schema structure after reset', async () => {
      const result = await resetSchemaToDefault(testSchemaId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testSchemaId);
      expect(result?.categories).toBeDefined();
    });
  });
});
