import { prisma, testDatabaseConnection, disconnectDatabase } from '../../src/config/database';
import { RoleName } from '@prisma/client';

describe('Database Connection', () => {
  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should connect to database successfully', async () => {
    await expect(testDatabaseConnection()).resolves.not.toThrow();
  });

  it('should execute a simple query', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    expect(result).toBeDefined();
  });

  it('should disconnect from database successfully', async () => {
    await expect(disconnectDatabase()).resolves.not.toThrow();
  });
});

describe('Seed Data Validation', () => {
  beforeAll(async () => {
    await testDatabaseConnection();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Roles', () => {
    it('should have ADMINISTRATOR and CREATOR roles', async () => {
      const roles = await prisma.role.findMany();

      expect(roles).toHaveLength(2);

      const roleNames = roles.map((r) => r.roleName);
      expect(roleNames).toContain(RoleName.ADMINISTRATOR);
      expect(roleNames).toContain(RoleName.CREATOR);
    });

    it('should have unique role names', async () => {
      const adminRole = await prisma.role.findUnique({
        where: { roleName: RoleName.ADMINISTRATOR },
      });

      const creatorRole = await prisma.role.findUnique({
        where: { roleName: RoleName.CREATOR },
      });

      expect(adminRole).not.toBeNull();
      expect(creatorRole).not.toBeNull();
      expect(adminRole?.id).not.toBe(creatorRole?.id);
    });
  });

  describe('Users', () => {
    it('should have test admin user', async () => {
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
      });

      expect(adminUser).not.toBeNull();
      expect(adminUser?.email).toBe('admin@example.com');
      expect(adminUser?.fullName).toBe('管理者テストユーザー');
      expect(adminUser?.passwordHash).toBeDefined();
      expect(adminUser?.passwordHash.length).toBeGreaterThan(0);
    });

    it('should have test creator user', async () => {
      const creatorUser = await prisma.user.findUnique({
        where: { email: 'creator@example.com' },
      });

      expect(creatorUser).not.toBeNull();
      expect(creatorUser?.email).toBe('creator@example.com');
      expect(creatorUser?.fullName).toBe('作成者テストユーザー');
      expect(creatorUser?.passwordHash).toBeDefined();
      expect(creatorUser?.passwordHash.length).toBeGreaterThan(0);
    });

    it('should have unique email addresses', async () => {
      const users = await prisma.user.findMany();
      const emails = users.map((u) => u.email);
      const uniqueEmails = new Set(emails);

      expect(emails.length).toBe(uniqueEmails.size);
    });
  });

  describe('User Roles', () => {
    it('should assign ADMINISTRATOR and CREATOR roles to admin user', async () => {
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      expect(adminUser).not.toBeNull();
      expect(adminUser?.userRoles).toHaveLength(2);

      const roleNames = adminUser?.userRoles.map((ur) => ur.role.roleName);
      expect(roleNames).toContain(RoleName.ADMINISTRATOR);
      expect(roleNames).toContain(RoleName.CREATOR);
    });

    it('should assign CREATOR role to creator user', async () => {
      const creatorUser = await prisma.user.findUnique({
        where: { email: 'creator@example.com' },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      expect(creatorUser).not.toBeNull();
      expect(creatorUser?.userRoles).toHaveLength(1);
      expect(creatorUser?.userRoles[0].role.roleName).toBe(RoleName.CREATOR);
    });
  });

  describe('Default Schema', () => {
    it('should have default schema', async () => {
      const defaultSchema = await prisma.schema.findFirst({
        where: { isDefault: true },
      });

      expect(defaultSchema).not.toBeNull();
      expect(defaultSchema?.name).toBe('デフォルトスキーマ');
      expect(defaultSchema?.isDefault).toBe(true);
    });

    it('should have 6 categories', async () => {
      const defaultSchema = await prisma.schema.findFirst({
        where: { isDefault: true },
        include: {
          categories: true,
        },
      });

      expect(defaultSchema).not.toBeNull();
      expect(defaultSchema?.categories).toHaveLength(6);
    });

    it('should have categories in correct order', async () => {
      const categories = await prisma.schemaCategory.findMany({
        where: {
          schema: {
            isDefault: true,
          },
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });

      expect(categories).toHaveLength(6);
      expect(categories[0].name).toBe('ステップ 1: 基本情報');
      expect(categories[1].name).toBe('ステップ 2: 調達の種別とスコープ');
      expect(categories[2].name).toBe('ステップ 3: 納品情報');
      expect(categories[3].name).toBe('ステップ 4: 受注者等の要件');
      expect(categories[4].name).toBe('ステップ 5: 各業務の詳細仕様');
      expect(categories[5].name).toBe('ステップ 6: 仕様確認');
    });

    it('should have fields with correct configuration', async () => {
      const defaultSchema = await prisma.schema.findFirst({
        where: { isDefault: true },
        include: {
          categories: {
            include: {
              fields: true,
            },
          },
        },
      });

      expect(defaultSchema).not.toBeNull();

      // フィールドの総数を確認
      const totalFields = defaultSchema?.categories.reduce(
        (sum, category) => sum + category.fields.length,
        0
      );
      expect(totalFields).toBeGreaterThan(0);

      // 必須フィールドが存在することを確認
      const requiredFields = defaultSchema?.categories
        .flatMap((c) => c.fields)
        .filter((f) => f.isRequired);
      expect(requiredFields?.length).toBeGreaterThan(0);

      // LIST型フィールドにlistTargetEntityが設定されていることを確認
      const listFields = defaultSchema?.categories
        .flatMap((c) => c.fields)
        .filter((f) => f.dataType === 'LIST');
      listFields?.forEach((field) => {
        expect(field.listTargetEntity).toBeDefined();
        expect(field.listTargetEntity).not.toBe('');
      });
    });
  });
});

describe('Database Constraints', () => {
  beforeAll(async () => {
    await testDatabaseConnection();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should enforce unique email constraint', async () => {
    const existingUser = await prisma.user.findFirst();

    if (!existingUser) {
      throw new Error('No existing user found for testing');
    }

    await expect(
      prisma.user.create({
        data: {
          email: existingUser.email, // 既存のメールアドレス
          passwordHash: 'test_hash',
          fullName: 'Duplicate User',
        },
      })
    ).rejects.toThrow();
  });

  it('should enforce foreign key constraint on UserRole', async () => {
    const nonExistentUserId = '00000000-0000-0000-0000-000000000000';
    const role = await prisma.role.findFirst();

    if (!role) {
      throw new Error('No role found for testing');
    }

    await expect(
      prisma.userRole.create({
        data: {
          userId: nonExistentUserId,
          roleId: role.id,
        },
      })
    ).rejects.toThrow();
  });

  it('should cascade delete user roles when user is deleted', async () => {
    // テスト用ユーザーを作成
    const testUser = await prisma.user.create({
      data: {
        email: 'test-delete@example.com',
        passwordHash: 'test_hash',
        fullName: 'Test Delete User',
      },
    });

    const role = await prisma.role.findFirst();
    if (!role) {
      throw new Error('No role found for testing');
    }

    // ロールを割り当て
    await prisma.userRole.create({
      data: {
        userId: testUser.id,
        roleId: role.id,
      },
    });

    // ユーザーを削除
    await prisma.user.delete({
      where: { id: testUser.id },
    });

    // UserRoleも削除されていることを確認
    const userRoles = await prisma.userRole.findMany({
      where: { userId: testUser.id },
    });

    expect(userRoles).toHaveLength(0);
  });
});
