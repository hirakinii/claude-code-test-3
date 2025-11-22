import request from 'supertest';
import { createServer } from '../../src/server';
import { PrismaClient } from '@prisma/client';

const app = createServer();
const prisma = new PrismaClient();

describe('Specification API', () => {
  let creatorToken: string;
  let adminToken: string;
  let creatorUserId: string;
  let adminUserId: string;
  let testSchemaId: string;
  let createdSpecificationIds: string[] = [];

  beforeAll(async () => {
    // 作成者トークン取得
    const creatorLogin = await request(app).post('/api/auth/login').send({
      email: 'creator@example.com',
      password: 'Creator123!',
    });
    creatorToken = creatorLogin.body.data.token;

    // 作成者ユーザーID取得
    const creator = await prisma.user.findUnique({
      where: { email: 'creator@example.com' },
    });
    creatorUserId = creator!.id;

    // 管理者トークン取得
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Admin123!',
    });
    adminToken = adminLogin.body.data.token;

    // 管理者ユーザーID取得
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });
    adminUserId = admin!.id;

    // デフォルトスキーマID取得
    const schema = await prisma.schema.findFirst({
      where: { isDefault: true },
    });
    testSchemaId = schema!.id;
  });

  afterEach(async () => {
    // テスト後のクリーンアップ
    for (const specId of createdSpecificationIds) {
      try {
        await prisma.specification.delete({ where: { id: specId } });
      } catch {
        // 既に削除されている場合は無視
      }
    }
    createdSpecificationIds = [];
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/specifications', () => {
    it('should return 200 with paginated list', async () => {
      // テストデータ作成
      const spec = await prisma.specification.create({
        data: {
          authorId: creatorUserId,
          schemaId: testSchemaId,
          title: 'Test Spec',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app).get('/api/specifications');

      expect(response.status).toBe(401);
    });

    it('should filter by status query param', async () => {
      // DRAFTステータスの仕様書作成
      const draftSpec = await prisma.specification.create({
        data: {
          authorId: creatorUserId,
          schemaId: testSchemaId,
          title: 'Draft Spec',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(draftSpec.id);

      // SAVEDステータスの仕様書作成
      const savedSpec = await prisma.specification.create({
        data: {
          authorId: creatorUserId,
          schemaId: testSchemaId,
          title: 'Saved Spec',
          status: 'SAVED',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(savedSpec.id);

      const response = await request(app)
        .get('/api/specifications?status=DRAFT')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(200);
      response.body.data.items.forEach((item: { status: string }) => {
        expect(item.status).toBe('DRAFT');
      });
    });

    it('should paginate results', async () => {
      // 5つの仕様書を作成
      for (let i = 0; i < 5; i++) {
        const spec = await prisma.specification.create({
          data: {
            authorId: creatorUserId,
            schemaId: testSchemaId,
            title: `Pagination Test ${i}`,
            status: 'DRAFT',
            version: '1.0',
          },
        });
        createdSpecificationIds.push(spec.id);
      }

      const response = await request(app)
        .get('/api/specifications?page=1&limit=2')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should sort by updatedAt descending by default', async () => {
      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(200);

      const items = response.body.data.items;
      if (items.length >= 2) {
        const dates = items.map((item: { updatedAt: string }) =>
          new Date(item.updatedAt).getTime(),
        );
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      }
    });

    it('should return only own specifications', async () => {
      // 他ユーザーの仕様書作成
      const otherSpec = await prisma.specification.create({
        data: {
          authorId: adminUserId,
          schemaId: testSchemaId,
          title: 'Admin Spec',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(otherSpec.id);

      const response = await request(app)
        .get('/api/specifications')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(200);
      const ids = response.body.data.items.map((item: { id: string }) => item.id);
      expect(ids).not.toContain(otherSpec.id);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .get('/api/specifications?status=INVALID')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/specifications', () => {
    it('should create specification and return 201', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.version).toBe('1.0');

      createdSpecificationIds.push(response.body.data.id);
    });

    it('should create specification with specified schemaId', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ schemaId: testSchemaId });

      expect(response.status).toBe(201);
      expect(response.body.data.schemaId).toBe(testSchemaId);

      createdSpecificationIds.push(response.body.data.id);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent schema', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ schemaId: '00000000-0000-0000-0000-000000000000' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid schemaId format', async () => {
      const response = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ schemaId: 'invalid-uuid' });

      expect(response.status).toBe(400);
    });

    it('should allow both creator and admin to create', async () => {
      const creatorResponse = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({});

      expect(creatorResponse.status).toBe(201);
      createdSpecificationIds.push(creatorResponse.body.data.id);

      const adminResponse = await request(app)
        .post('/api/specifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(adminResponse.status).toBe(201);
      createdSpecificationIds.push(adminResponse.body.data.id);
    });
  });

  describe('GET /api/specifications/:id', () => {
    it('should return specification details', async () => {
      const spec = await prisma.specification.create({
        data: {
          authorId: creatorUserId,
          schemaId: testSchemaId,
          title: 'Test Detail',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      const response = await request(app)
        .get(`/api/specifications/${spec.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(spec.id);
      expect(response.body.data.title).toBe('Test Detail');
      expect(response.body.data.author).toBeDefined();
    });

    it('should return 403 for other user specification', async () => {
      // 管理者の仕様書作成
      const adminSpec = await prisma.specification.create({
        data: {
          authorId: adminUserId,
          schemaId: testSchemaId,
          title: 'Admin Only',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(adminSpec.id);

      const response = await request(app)
        .get(`/api/specifications/${adminSpec.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent specification', async () => {
      const response = await request(app)
        .get('/api/specifications/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/specifications/invalid-uuid')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const spec = await prisma.specification.create({
        data: {
          authorId: creatorUserId,
          schemaId: testSchemaId,
          title: 'Test',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      const response = await request(app).get(`/api/specifications/${spec.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/specifications/:id', () => {
    it('should delete specification and return 200', async () => {
      const spec = await prisma.specification.create({
        data: {
          authorId: creatorUserId,
          schemaId: testSchemaId,
          title: 'To Delete',
          status: 'DRAFT',
          version: '1.0',
        },
      });

      const response = await request(app)
        .delete(`/api/specifications/${spec.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // 削除確認
      const deleted = await prisma.specification.findUnique({
        where: { id: spec.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 403 for other user specification', async () => {
      const adminSpec = await prisma.specification.create({
        data: {
          authorId: adminUserId,
          schemaId: testSchemaId,
          title: 'Admin Only',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(adminSpec.id);

      const response = await request(app)
        .delete(`/api/specifications/${adminSpec.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent specification', async () => {
      const response = await request(app)
        .delete('/api/specifications/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/specifications/invalid-uuid')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const spec = await prisma.specification.create({
        data: {
          authorId: creatorUserId,
          schemaId: testSchemaId,
          title: 'Test',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      const response = await request(app).delete(
        `/api/specifications/${spec.id}`,
      );

      expect(response.status).toBe(401);
    });

    it('should cascade delete related data', async () => {
      const spec = await prisma.specification.create({
        data: {
          authorId: creatorUserId,
          schemaId: testSchemaId,
          title: 'With Deliverable',
          status: 'DRAFT',
          version: '1.0',
        },
      });

      const deliverable = await prisma.deliverable.create({
        data: {
          specificationId: spec.id,
          name: 'Test Deliverable',
          quantity: 1,
        },
      });

      const response = await request(app)
        .delete(`/api/specifications/${spec.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(200);

      // 関連データも削除されているか確認
      const deletedDeliverable = await prisma.deliverable.findUnique({
        where: { id: deliverable.id },
      });
      expect(deletedDeliverable).toBeNull();
    });
  });
});
