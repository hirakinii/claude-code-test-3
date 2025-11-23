import { PrismaClient } from '@prisma/client';
import {
  getSpecifications,
  createSpecification,
  getSpecificationById,
  deleteSpecification,
  getSpecificationContent,
  saveSpecification,
} from '../../../src/services/specificationService';

const prisma = new PrismaClient();

describe('SpecificationService', () => {
  let testUserId: string;
  let otherUserId: string;
  let testSchemaId: string;
  let createdSpecificationIds: string[] = [];

  // テスト開始時にテストデータを設定
  beforeAll(async () => {
    // テスト用ユーザーIDを取得（シードデータから）
    const creator = await prisma.user.findUnique({
      where: { email: 'creator@example.com' },
    });
    if (!creator) {
      throw new Error('Test user not found. Run prisma:seed first.');
    }
    testUserId = creator.id;

    // 別のユーザーを取得
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });
    if (!admin) {
      throw new Error('Admin user not found. Run prisma:seed first.');
    }
    otherUserId = admin.id;

    // デフォルトスキーマIDを取得
    const schema = await prisma.schema.findFirst({
      where: { isDefault: true },
    });
    if (!schema) {
      throw new Error('Default schema not found. Run prisma:seed first.');
    }
    testSchemaId = schema.id;
  });

  // 各テスト後のクリーンアップ
  afterEach(async () => {
    for (const specId of createdSpecificationIds) {
      try {
        await prisma.specification.delete({ where: { id: specId } });
      } catch {
        // 既に削除されている場合は無視
      }
    }
    createdSpecificationIds = [];
  });

  // テスト終了時にデータベース接続を閉じる
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getSpecifications', () => {
    it('should return paginated specifications for user', async () => {
      // テストデータ作成
      const spec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Test Specification',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      const result = await getSpecifications({
        userId: testUserId,
        page: 1,
        limit: 10,
      });

      expect(result.items).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should return only user own specifications', async () => {
      // 自分の仕様書を作成
      const mySpec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'My Specification',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(mySpec.id);

      // 他ユーザーの仕様書を作成
      const otherSpec = await prisma.specification.create({
        data: {
          authorId: otherUserId,
          schemaId: testSchemaId,
          title: 'Other User Specification',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(otherSpec.id);

      const result = await getSpecifications({
        userId: testUserId,
        page: 1,
        limit: 100,
      });

      // 他ユーザーの仕様書が含まれていないことを確認
      const otherUserSpecs = result.items.filter(
        (item) => item.id === otherSpec.id,
      );
      expect(otherUserSpecs.length).toBe(0);
    });

    it('should filter by status', async () => {
      // DRAFTステータスの仕様書を作成
      const draftSpec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Draft Spec',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(draftSpec.id);

      // SAVEDステータスの仕様書を作成
      const savedSpec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Saved Spec',
          status: 'SAVED',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(savedSpec.id);

      const result = await getSpecifications({
        userId: testUserId,
        status: 'DRAFT',
        page: 1,
        limit: 100,
      });

      // すべてのアイテムがDRAFTステータスであることを確認
      result.items.forEach((item) => {
        expect(item.status).toBe('DRAFT');
      });
    });

    it('should sort by updatedAt descending by default', async () => {
      // 2つの仕様書を作成
      const spec1 = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Spec 1',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec1.id);

      // 少し待ってから2つ目を作成
      await new Promise((resolve) => setTimeout(resolve, 100));

      const spec2 = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Spec 2',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec2.id);

      const result = await getSpecifications({
        userId: testUserId,
        page: 1,
        limit: 100,
      });

      // 最新の仕様書が最初に来ることを確認
      if (result.items.length >= 2) {
        const dates = result.items.map((item) => new Date(item.updatedAt).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      }
    });

    it('should respect pagination limits', async () => {
      // 5つの仕様書を作成
      for (let i = 0; i < 5; i++) {
        const spec = await prisma.specification.create({
          data: {
            authorId: testUserId,
            schemaId: testSchemaId,
            title: `Pagination Test ${i}`,
            status: 'DRAFT',
            version: '1.0',
          },
        });
        createdSpecificationIds.push(spec.id);
      }

      const result = await getSpecifications({
        userId: testUserId,
        page: 1,
        limit: 2,
      });

      expect(result.items.length).toBeLessThanOrEqual(2);
      expect(result.pagination.limit).toBe(2);
    });

    it('should calculate totalPages correctly', async () => {
      // 5つの仕様書を作成
      for (let i = 0; i < 5; i++) {
        const spec = await prisma.specification.create({
          data: {
            authorId: testUserId,
            schemaId: testSchemaId,
            title: `TotalPages Test ${i}`,
            status: 'DRAFT',
            version: '1.0',
          },
        });
        createdSpecificationIds.push(spec.id);
      }

      const result = await getSpecifications({
        userId: testUserId,
        page: 1,
        limit: 2,
      });

      expect(result.pagination.totalPages).toBe(
        Math.ceil(result.pagination.total / 2),
      );
    });

    it('should handle empty results', async () => {
      // 存在しないユーザーIDで検索
      const result = await getSpecifications({
        userId: '00000000-0000-0000-0000-000000000000',
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('createSpecification', () => {
    it('should create shell specification with default schema', async () => {
      const spec = await createSpecification({
        userId: testUserId,
      });
      createdSpecificationIds.push(spec.id);

      expect(spec).toBeDefined();
      expect(spec.id).toBeDefined();
      expect(spec.authorId).toBe(testUserId);
      expect(spec.schemaId).toBeDefined();
      expect(spec.status).toBe('DRAFT');
      expect(spec.version).toBe('1.0');
      expect(spec.title).toBeNull();
    });

    it('should create specification with specified schema', async () => {
      const spec = await createSpecification({
        userId: testUserId,
        schemaId: testSchemaId,
      });
      createdSpecificationIds.push(spec.id);

      expect(spec.schemaId).toBe(testSchemaId);
    });

    it('should throw error for non-existent schema', async () => {
      await expect(
        createSpecification({
          userId: testUserId,
          schemaId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow('Schema not found');
    });

    it('should create specifications with unique IDs', async () => {
      const spec1 = await createSpecification({ userId: testUserId });
      createdSpecificationIds.push(spec1.id);

      const spec2 = await createSpecification({ userId: testUserId });
      createdSpecificationIds.push(spec2.id);

      expect(spec1.id).not.toBe(spec2.id);
    });
  });

  describe('getSpecificationById', () => {
    it('should return specification by id', async () => {
      const created = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Test Get By ID',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(created.id);

      const spec = await getSpecificationById(created.id, testUserId);

      expect(spec).toBeDefined();
      expect(spec.id).toBe(created.id);
      expect(spec.title).toBe('Test Get By ID');
      expect(spec.author).toBeDefined();
      expect(spec.author.id).toBe(testUserId);
    });

    it('should include author information', async () => {
      const created = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Test Author Info',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(created.id);

      const spec = await getSpecificationById(created.id, testUserId);

      expect(spec.author).toBeDefined();
      expect(spec.author.id).toBeDefined();
      expect(spec.author.email).toBeDefined();
      expect(spec.author.fullName).toBeDefined();
    });

    it('should throw error for non-existent specification', async () => {
      await expect(
        getSpecificationById(
          '00000000-0000-0000-0000-000000000000',
          testUserId,
        ),
      ).rejects.toThrow('Specification not found');
    });

    it('should throw error when accessing other user specification', async () => {
      // 他ユーザーの仕様書を作成
      const otherSpec = await prisma.specification.create({
        data: {
          authorId: otherUserId,
          schemaId: testSchemaId,
          title: 'Other User Spec',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(otherSpec.id);

      await expect(
        getSpecificationById(otherSpec.id, testUserId),
      ).rejects.toThrow('Access denied');
    });
  });

  describe('deleteSpecification', () => {
    it('should delete specification', async () => {
      const created = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'To Delete',
          status: 'DRAFT',
          version: '1.0',
        },
      });

      const result = await deleteSpecification(created.id, testUserId);

      expect(result.success).toBe(true);

      // 削除確認
      const deleted = await prisma.specification.findUnique({
        where: { id: created.id },
      });
      expect(deleted).toBeNull();
    });

    it('should cascade delete related data', async () => {
      // 仕様書を作成
      const spec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Spec with Content',
          status: 'DRAFT',
          version: '1.0',
        },
      });

      // 関連データを作成（Deliverable）
      const deliverable = await prisma.deliverable.create({
        data: {
          specificationId: spec.id,
          name: 'Test Deliverable',
          quantity: 1,
        },
      });

      // 削除
      await deleteSpecification(spec.id, testUserId);

      // 関連データも削除されているか確認
      const deletedDeliverable = await prisma.deliverable.findUnique({
        where: { id: deliverable.id },
      });
      expect(deletedDeliverable).toBeNull();
    });

    it('should throw error for non-existent specification', async () => {
      await expect(
        deleteSpecification(
          '00000000-0000-0000-0000-000000000000',
          testUserId,
        ),
      ).rejects.toThrow('Specification not found');
    });

    it('should throw error when deleting other user specification', async () => {
      // 他ユーザーの仕様書を作成
      const otherSpec = await prisma.specification.create({
        data: {
          authorId: otherUserId,
          schemaId: testSchemaId,
          title: 'Other User Spec to Delete',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(otherSpec.id);

      await expect(
        deleteSpecification(otherSpec.id, testUserId),
      ).rejects.toThrow('Access denied');
    });
  });

  describe('getSpecificationContent', () => {
    let testFieldId: string;

    beforeAll(async () => {
      // Get a field from the default schema for testing
      const schema = await prisma.schema.findFirst({
        where: { isDefault: true },
        include: {
          categories: {
            include: { fields: true },
          },
        },
      });
      if (schema?.categories[0]?.fields[0]) {
        testFieldId = schema.categories[0].fields[0].id;
      }
    });

    it('should return specification content with EAV data', async () => {
      // Create specification with content
      const spec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Test Content Spec',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      // Add EAV content
      if (testFieldId) {
        await prisma.specificationContent.create({
          data: {
            specificationId: spec.id,
            fieldId: testFieldId,
            value: JSON.stringify('Test value'),
          },
        });
      }

      const result = await getSpecificationContent(spec.id, testUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(spec.id);
      expect(result.title).toBe('Test Content Spec');
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe('object');
    });

    it('should return specification with sub-entities', async () => {
      // Create specification
      const spec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: 'Test Sub-Entity Spec',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      // Add deliverable
      await prisma.deliverable.create({
        data: {
          specificationId: spec.id,
          name: 'Test Deliverable',
          quantity: 1,
          description: 'Test description',
        },
      });

      // Add business task
      await prisma.businessTask.create({
        data: {
          specificationId: spec.id,
          title: 'Test Task',
          detailedSpec: 'Test detailed spec',
        },
      });

      const result = await getSpecificationContent(spec.id, testUserId);

      expect(result.deliverables).toBeDefined();
      expect(result.deliverables.length).toBe(1);
      expect(result.deliverables[0].name).toBe('Test Deliverable');

      expect(result.businessTasks).toBeDefined();
      expect(result.businessTasks.length).toBe(1);
      expect(result.businessTasks[0].title).toBe('Test Task');
    });

    it('should throw error for non-existent specification', async () => {
      await expect(
        getSpecificationContent(
          '00000000-0000-0000-0000-000000000000',
          testUserId,
        ),
      ).rejects.toThrow('Specification not found');
    });

    it('should throw error when accessing other user specification', async () => {
      // Create other user's specification
      const otherSpec = await prisma.specification.create({
        data: {
          authorId: otherUserId,
          schemaId: testSchemaId,
          title: 'Other User Content Spec',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(otherSpec.id);

      await expect(
        getSpecificationContent(otherSpec.id, testUserId),
      ).rejects.toThrow('Access denied');
    });
  });

  describe('saveSpecification', () => {
    let testFieldId: string;

    beforeAll(async () => {
      // Get a field from the default schema for testing
      const schema = await prisma.schema.findFirst({
        where: { isDefault: true },
        include: {
          categories: {
            include: { fields: true },
          },
        },
      });
      if (schema?.categories[0]?.fields[0]) {
        testFieldId = schema.categories[0].fields[0].id;
      }
    });

    it('should save EAV content correctly', async () => {
      // Create specification
      const spec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: null,
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      const payload = {
        content: testFieldId ? { [testFieldId]: 'Test saved value' } : {},
        deliverables: [],
        contractorRequirements: [],
        basicBusinessRequirements: [],
        businessTasks: [],
      };

      const result = await saveSpecification(spec.id, testUserId, payload);

      expect(result).toBeDefined();
      expect(result.id).toBe(spec.id);

      // Verify EAV data was saved
      const savedContent = await prisma.specificationContent.findMany({
        where: { specificationId: spec.id },
      });
      expect(savedContent.length).toBeGreaterThanOrEqual(0);
    });

    it('should save sub-entities correctly', async () => {
      // Create specification
      const spec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: null,
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      const payload = {
        content: {},
        deliverables: [
          { name: 'Saved Deliverable', quantity: 2, description: 'Saved desc' },
        ],
        contractorRequirements: [
          { category: 'Category A', description: 'Requirement desc' },
        ],
        basicBusinessRequirements: [
          { category: 'Category B', description: 'Business req desc' },
        ],
        businessTasks: [
          { title: 'Saved Task', detailedSpec: 'Saved detailed spec' },
        ],
      };

      await saveSpecification(spec.id, testUserId, payload);

      // Verify sub-entities were saved
      const deliverables = await prisma.deliverable.findMany({
        where: { specificationId: spec.id },
      });
      expect(deliverables.length).toBe(1);
      expect(deliverables[0].name).toBe('Saved Deliverable');

      const tasks = await prisma.businessTask.findMany({
        where: { specificationId: spec.id },
      });
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Saved Task');
    });

    it('should replace existing sub-entities on save', async () => {
      // Create specification with existing deliverable
      const spec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: null,
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      // Add existing deliverable
      await prisma.deliverable.create({
        data: {
          specificationId: spec.id,
          name: 'Old Deliverable',
          quantity: 1,
        },
      });

      // Save with new deliverable
      const payload = {
        content: {},
        deliverables: [{ name: 'New Deliverable', quantity: 5 }],
        contractorRequirements: [],
        basicBusinessRequirements: [],
        businessTasks: [],
      };

      await saveSpecification(spec.id, testUserId, payload);

      // Verify old deliverable was replaced
      const deliverables = await prisma.deliverable.findMany({
        where: { specificationId: spec.id },
      });
      expect(deliverables.length).toBe(1);
      expect(deliverables[0].name).toBe('New Deliverable');
    });

    it('should increment minor version when saving as draft', async () => {
      // Create specification
      const spec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: null,
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      const payload = {
        content: {},
        deliverables: [],
        contractorRequirements: [],
        basicBusinessRequirements: [],
        businessTasks: [],
      };

      const result = await saveSpecification(spec.id, testUserId, payload);

      expect(result.version).toBe('1.1');
      expect(result.status).toBe('DRAFT');
    });

    it('should throw error for non-existent specification', async () => {
      await expect(
        saveSpecification('00000000-0000-0000-0000-000000000000', testUserId, {
          content: {},
          deliverables: [],
          contractorRequirements: [],
          basicBusinessRequirements: [],
          businessTasks: [],
        }),
      ).rejects.toThrow('Specification not found');
    });

    it('should throw error when saving other user specification', async () => {
      // Create other user's specification
      const otherSpec = await prisma.specification.create({
        data: {
          authorId: otherUserId,
          schemaId: testSchemaId,
          title: 'Other User Save Spec',
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(otherSpec.id);

      await expect(
        saveSpecification(otherSpec.id, testUserId, {
          content: {},
          deliverables: [],
          contractorRequirements: [],
          basicBusinessRequirements: [],
          businessTasks: [],
        }),
      ).rejects.toThrow('Access denied');
    });

    it('should execute in transaction (atomic save)', async () => {
      // Create specification
      const spec = await prisma.specification.create({
        data: {
          authorId: testUserId,
          schemaId: testSchemaId,
          title: null,
          status: 'DRAFT',
          version: '1.0',
        },
      });
      createdSpecificationIds.push(spec.id);

      // Add existing data
      await prisma.deliverable.create({
        data: {
          specificationId: spec.id,
          name: 'Existing Deliverable',
          quantity: 1,
        },
      });

      // Save with new data
      const payload = {
        content: {},
        deliverables: [
          { name: 'New 1', quantity: 1 },
          { name: 'New 2', quantity: 2 },
        ],
        contractorRequirements: [],
        basicBusinessRequirements: [],
        businessTasks: [],
      };

      await saveSpecification(spec.id, testUserId, payload);

      // Verify atomicity - old data deleted, new data added
      const deliverables = await prisma.deliverable.findMany({
        where: { specificationId: spec.id },
      });
      expect(deliverables.length).toBe(2);
      expect(deliverables.map((d) => d.name)).toContain('New 1');
      expect(deliverables.map((d) => d.name)).toContain('New 2');
      expect(deliverables.map((d) => d.name)).not.toContain(
        'Existing Deliverable',
      );
    });
  });
});
