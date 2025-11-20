import request from 'supertest';
import { createServer } from '../../src/server';
import { PrismaClient } from '@prisma/client';

const app = createServer();
const prisma = new PrismaClient();

describe('Schema API', () => {
  let adminToken: string;
  let creatorToken: string;
  let testSchemaId: string;
  let createdCategoryIds: string[] = [];
  let createdFieldIds: string[] = [];

  beforeAll(async () => {
    // 管理者トークン取得
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Admin123!',
    });
    adminToken = adminLogin.body.data.token;

    // 作成者トークン取得
    const creatorLogin = await request(app).post('/api/auth/login').send({
      email: 'creator@example.com',
      password: 'Creator123!',
    });
    creatorToken = creatorLogin.body.data.token;

    // テスト専用スキーマを作成
    const testSchema = await prisma.schema.create({
      data: {
        schemaName: 'Test Schema for Integration Tests',
        schemaVersion: '1.0.0-test',
        status: 'DRAFT',
      },
    });
    testSchemaId = testSchema.id;
  });

  afterEach(async () => {
    // テスト後のクリーンアップ
    for (const fieldId of createdFieldIds) {
      try {
        await prisma.schemaField.delete({ where: { id: fieldId } });
      } catch (error) {
        // 既に削除されている場合は無視
      }
    }
    createdFieldIds = [];

    for (const categoryId of createdCategoryIds) {
      try {
        await prisma.schemaCategory.delete({ where: { id: categoryId } });
      } catch (error) {
        // 既に削除されている場合は無視
      }
    }
    createdCategoryIds = [];
  });

  afterAll(async () => {
    // テスト専用スキーマを削除（カスケードでカテゴリ・フィールドも削除される）
    if (testSchemaId) {
      try {
        await prisma.schema.delete({ where: { id: testSchemaId } });
      } catch (error) {
        // 既に削除されている場合は無視
      }
    }
    await prisma.$disconnect();
  });

  describe('GET /api/schema/:schemaId', () => {
    it('should return schema with admin token', async () => {
      const response = await request(app)
        .get(`/api/schema/${testSchemaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testSchemaId);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });

    it('should return 403 for creator token', async () => {
      const response = await request(app)
        .get(`/api/schema/${testSchemaId}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get(`/api/schema/${testSchemaId}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should return 404 for non-existent schema', async () => {
      const response = await request(app)
        .get('/api/schema/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SCHEMA_NOT_FOUND');
    });

    it('should return categories sorted by displayOrder', async () => {
      const response = await request(app)
        .get(`/api/schema/${testSchemaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const categories = response.body.data.categories;

      if (categories.length > 1) {
        const displayOrders = categories.map((c: any) => c.displayOrder);
        const sorted = [...displayOrders].sort((a, b) => a - b);
        expect(displayOrders).toEqual(sorted);
      }
    });

    it('should return fields sorted by displayOrder in each category', async () => {
      const response = await request(app)
        .get(`/api/schema/${testSchemaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const categories = response.body.data.categories;

      categories.forEach((category: any) => {
        if (category.fields.length > 1) {
          const displayOrders = category.fields.map((f: any) => f.displayOrder);
          const sorted = [...displayOrders].sort((a, b) => a - b);
          expect(displayOrders).toEqual(sorted);
        }
      });
    });
  });

  describe('POST /api/schema/categories', () => {
    it('should create category with valid data', async () => {
      const response = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Integration Test Category',
          description: 'Test Description',
          displayOrder: 999,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Integration Test Category');
      expect(response.body.data.description).toBe('Test Description');
      expect(response.body.data.displayOrder).toBe(999);

      createdCategoryIds.push(response.body.data.id);
    });

    it('should create category without description', async () => {
      const response = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Category Without Desc',
          displayOrder: 998,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.description).toBeNull();

      createdCategoryIds.push(response.body.data.id);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          // name が欠けている
          displayOrder: 997,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid displayOrder', async () => {
      const response = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Test',
          displayOrder: -1, // 負の数
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent schema', async () => {
      const response = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: 'non-existent-schema',
          name: 'Test',
          displayOrder: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SCHEMA_NOT_FOUND');
    });

    it('should return 403 for creator token', async () => {
      const response = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Test',
          displayOrder: 996,
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/schema/categories')
        .send({
          schemaId: testSchemaId,
          name: 'Test',
          displayOrder: 995,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/schema/categories/:id', () => {
    let testCategoryId: string;

    beforeEach(async () => {
      // テスト用カテゴリ作成
      const response = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Category to Update',
          description: 'Original Description',
          displayOrder: 994,
        });
      testCategoryId = response.body.data.id;
      createdCategoryIds.push(testCategoryId);
    });

    it('should update category name', async () => {
      const response = await request(app)
        .put(`/api/schema/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.description).toBe('Original Description');
    });

    it('should update category displayOrder', async () => {
      const response = await request(app)
        .put(`/api/schema/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayOrder: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.displayOrder).toBe(100);
    });

    it('should update multiple fields', async () => {
      const response = await request(app)
        .put(`/api/schema/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Name',
          description: 'New Description',
          displayOrder: 99,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.description).toBe('New Description');
      expect(response.body.data.displayOrder).toBe(99);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .put('/api/schema/categories/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 403 for creator token', async () => {
      const response = await request(app)
        .put(`/api/schema/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          name: 'Test',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/schema/categories/:id', () => {
    it('should delete category', async () => {
      // カテゴリ作成
      const createResponse = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Category to Delete',
          displayOrder: 993,
        });
      const categoryId = createResponse.body.data.id;

      // 削除
      const deleteResponse = await request(app)
        .delete(`/api/schema/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // 削除確認
      const deleted = await prisma.schemaCategory.findUnique({
        where: { id: categoryId },
      });
      expect(deleted).toBeNull();
    });

    it('should cascade delete fields', async () => {
      // カテゴリ作成
      const categoryResponse = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Category with Fields',
          displayOrder: 992,
        });
      const categoryId = categoryResponse.body.data.id;

      // フィールド作成
      const fieldResponse = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          fieldName: 'Test Field',
          dataType: 'TEXT',
          isRequired: false,
          displayOrder: 1,
        });
      const fieldId = fieldResponse.body.data.id;

      // カテゴリ削除
      await request(app)
        .delete(`/api/schema/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // フィールドも削除されているか確認
      const deletedField = await prisma.schemaField.findUnique({
        where: { id: fieldId },
      });
      expect(deletedField).toBeNull();
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .delete('/api/schema/categories/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 403 for creator token', async () => {
      const createResponse = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Test',
          displayOrder: 991,
        });
      const categoryId = createResponse.body.data.id;
      createdCategoryIds.push(categoryId);

      const response = await request(app)
        .delete(`/api/schema/categories/${categoryId}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/schema/fields', () => {
    let testCategoryId: string;

    beforeEach(async () => {
      // テスト用カテゴリ作成
      const response = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Category for Fields',
          displayOrder: 990,
        });
      testCategoryId = response.body.data.id;
      createdCategoryIds.push(testCategoryId);
    });

    it('should create TEXT field', async () => {
      const response = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Test Text Field',
          dataType: 'TEXT',
          isRequired: true,
          placeholderText: 'Enter text here',
          displayOrder: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fieldName).toBe('Test Text Field');
      expect(response.body.data.dataType).toBe('TEXT');
      expect(response.body.data.isRequired).toBe(true);

      createdFieldIds.push(response.body.data.id);
    });

    it('should create RADIO field with options', async () => {
      const response = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Test Radio',
          dataType: 'RADIO',
          isRequired: false,
          options: ['Option 1', 'Option 2', 'Option 3'],
          displayOrder: 2,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.dataType).toBe('RADIO');
      expect(response.body.data.options).toEqual(['Option 1', 'Option 2', 'Option 3']);

      createdFieldIds.push(response.body.data.id);
    });

    it('should create LIST field with listTargetEntity', async () => {
      const response = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Test List',
          dataType: 'LIST',
          isRequired: false,
          listTargetEntity: 'Deliverable',
          displayOrder: 3,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.dataType).toBe('LIST');
      expect(response.body.data.listTargetEntity).toBe('Deliverable');

      createdFieldIds.push(response.body.data.id);
    });

    it('should return 400 for RADIO without options', async () => {
      const response = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Invalid Radio',
          dataType: 'RADIO',
          isRequired: false,
          displayOrder: 4,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Options are required');
    });

    it('should return 400 for LIST without listTargetEntity', async () => {
      const response = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Invalid List',
          dataType: 'LIST',
          isRequired: false,
          displayOrder: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('listTargetEntity is required');
    });

    it('should return 400 for invalid dataType', async () => {
      const response = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Test',
          dataType: 'INVALID_TYPE',
          isRequired: false,
          displayOrder: 6,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: 'non-existent-category',
          fieldName: 'Test',
          dataType: 'TEXT',
          isRequired: false,
          displayOrder: 7,
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 403 for creator token', async () => {
      const response = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Test',
          dataType: 'TEXT',
          isRequired: false,
          displayOrder: 8,
        });

      expect(response.status).toBe(403);
    });

    it('should default isRequired to false when not provided', async () => {
      const response = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Test Field',
          dataType: 'TEXT',
          displayOrder: 9,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.isRequired).toBe(false);

      createdFieldIds.push(response.body.data.id);
    });
  });

  describe('PUT /api/schema/fields/:id', () => {
    let testCategoryId: string;
    let testFieldId: string;

    beforeEach(async () => {
      // カテゴリ作成
      const categoryResponse = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Category for Field Updates',
          displayOrder: 989,
        });
      testCategoryId = categoryResponse.body.data.id;
      createdCategoryIds.push(testCategoryId);

      // フィールド作成
      const fieldResponse = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Original Field',
          dataType: 'TEXT',
          isRequired: false,
          displayOrder: 1,
        });
      testFieldId = fieldResponse.body.data.id;
      createdFieldIds.push(testFieldId);
    });

    it('should update field name', async () => {
      const response = await request(app)
        .put(`/api/schema/fields/${testFieldId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fieldName: 'Updated Field Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.fieldName).toBe('Updated Field Name');
    });

    it('should update field dataType', async () => {
      const response = await request(app)
        .put(`/api/schema/fields/${testFieldId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dataType: 'TEXTAREA',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.dataType).toBe('TEXTAREA');
    });

    it('should update field to RADIO with options', async () => {
      const response = await request(app)
        .put(`/api/schema/fields/${testFieldId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dataType: 'RADIO',
          options: ['Choice 1', 'Choice 2'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.dataType).toBe('RADIO');
      expect(response.body.data.options).toEqual(['Choice 1', 'Choice 2']);
    });

    it('should return 404 for non-existent field', async () => {
      const response = await request(app)
        .put('/api/schema/fields/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fieldName: 'Test',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('FIELD_NOT_FOUND');
    });

    it('should return 403 for creator token', async () => {
      const response = await request(app)
        .put(`/api/schema/fields/${testFieldId}`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          fieldName: 'Test',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/schema/fields/:id', () => {
    let testCategoryId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Category for Field Deletion',
          displayOrder: 988,
        });
      testCategoryId = response.body.data.id;
      createdCategoryIds.push(testCategoryId);
    });

    it('should delete field', async () => {
      // フィールド作成
      const createResponse = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Field to Delete',
          dataType: 'TEXT',
          isRequired: false,
          displayOrder: 1,
        });
      const fieldId = createResponse.body.data.id;

      // 削除
      const deleteResponse = await request(app)
        .delete(`/api/schema/fields/${fieldId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // 削除確認
      const deleted = await prisma.schemaField.findUnique({
        where: { id: fieldId },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent field', async () => {
      const response = await request(app)
        .delete('/api/schema/fields/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('FIELD_NOT_FOUND');
    });

    it('should return 403 for creator token', async () => {
      const createResponse = await request(app)
        .post('/api/schema/fields')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          fieldName: 'Test',
          dataType: 'TEXT',
          isRequired: false,
          displayOrder: 2,
        });
      const fieldId = createResponse.body.data.id;
      createdFieldIds.push(fieldId);

      const response = await request(app)
        .delete(`/api/schema/fields/${fieldId}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/schema/reset', () => {
    it('should reset schema to default', async () => {
      // テスト用カテゴリ作成
      const categoryResponse = await request(app)
        .post('/api/schema/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
          name: 'Category to Reset',
          displayOrder: 987,
        });
      const categoryId = categoryResponse.body.data.id;

      // リセット実行
      const response = await request(app)
        .post('/api/schema/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schemaId: testSchemaId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // カテゴリが削除されたことを確認
      const deleted = await prisma.schemaCategory.findUnique({
        where: { id: categoryId },
      });
      expect(deleted).toBeNull();
    });

    it('should return 400 for missing schemaId', async () => {
      const response = await request(app)
        .post('/api/schema/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 403 for creator token', async () => {
      const response = await request(app)
        .post('/api/schema/reset')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          schemaId: testSchemaId,
        });

      expect(response.status).toBe(403);
    });
  });
});
