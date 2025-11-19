import { PrismaClient, RoleName, DataType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Start seeding...');

  // ============================================
  // ロールの作成
  // ============================================
  console.log('📝 Creating roles...');

  const adminRole = await prisma.role.upsert({
    where: { roleName: RoleName.ADMINISTRATOR },
    update: {},
    create: { roleName: RoleName.ADMINISTRATOR },
  });

  const creatorRole = await prisma.role.upsert({
    where: { roleName: RoleName.CREATOR },
    update: {},
    create: { roleName: RoleName.CREATOR },
  });

  console.log(`✅ Roles created: ${adminRole.roleName}, ${creatorRole.roleName}`);

  // ============================================
  // テストユーザーの作成
  // ============================================
  console.log('👤 Creating test users...');

  const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      fullName: '管理者テストユーザー',
    },
  });

  const creatorPassword = await bcrypt.hash('Creator123!', SALT_ROUNDS);
  const creatorUser = await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {},
    create: {
      email: 'creator@example.com',
      passwordHash: creatorPassword,
      fullName: '作成者テストユーザー',
    },
  });

  console.log(`✅ Users created: ${adminUser.email}, ${creatorUser.email}`);

  // ============================================
  // ユーザーロールの関連付け
  // ============================================
  console.log('🔗 Assigning roles to users...');

  // 管理者ユーザーに両方のロールを付与
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: creatorRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: creatorRole.id,
    },
  });

  // 作成者ユーザーにCREATORロールを付与
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: creatorUser.id,
        roleId: creatorRole.id,
      },
    },
    update: {},
    create: {
      userId: creatorUser.id,
      roleId: creatorRole.id,
    },
  });

  console.log('✅ User roles assigned');

  // ============================================
  // デフォルトスキーマの作成
  // ============================================
  console.log('📋 Creating default schema...');

  const defaultSchema = await prisma.schema.upsert({
    where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }, // 固定IDを使用
    update: {},
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'デフォルトスキーマ',
      isDefault: true,
    },
  });

  console.log(`✅ Default schema created: ${defaultSchema.name}`);

  // ============================================
  // カテゴリとフィールドの作成
  // ============================================
  console.log('📂 Creating categories and fields...');

  // ステップ 1: 基本情報
  const category1 = await prisma.schemaCategory.create({
    data: {
      schemaId: defaultSchema.id,
      name: 'ステップ 1: 基本情報',
      description: '仕様書の基本的な情報を入力してください',
      displayOrder: 1,
    },
  });

  await prisma.schemaField.createMany({
    data: [
      {
        categoryId: category1.id,
        fieldName: '件名',
        dataType: DataType.TEXT,
        isRequired: true,
        placeholderText: '仕様書の件名を入力してください',
        displayOrder: 1,
      },
      {
        categoryId: category1.id,
        fieldName: '背景',
        dataType: DataType.TEXTAREA,
        isRequired: true,
        placeholderText: '調達の背景を入力してください',
        displayOrder: 2,
      },
      {
        categoryId: category1.id,
        fieldName: '調達の目的',
        dataType: DataType.TEXTAREA,
        isRequired: true,
        placeholderText: '調達の目的を入力してください',
        displayOrder: 3,
      },
    ],
  });

  console.log(`✅ Category created: ${category1.name} (3 fields)`);

  // ステップ 2: 調達の種別とスコープ
  const category2 = await prisma.schemaCategory.create({
    data: {
      schemaId: defaultSchema.id,
      name: 'ステップ 2: 調達の種別とスコープ',
      description: '調達の種別とスコープを選択してください',
      displayOrder: 2,
    },
  });

  await prisma.schemaField.createMany({
    data: [
      {
        categoryId: category2.id,
        fieldName: '調達の種別',
        dataType: DataType.RADIO,
        isRequired: true,
        options: JSON.stringify([
          '開発',
          '保守・運用',
          'コンサルティング',
          'その他',
        ]),
        displayOrder: 1,
      },
      {
        categoryId: category2.id,
        fieldName: '調達のスコープ',
        dataType: DataType.CHECKBOX,
        isRequired: false,
        options: JSON.stringify([
          'コンサルティング',
          '要件定義支援',
          'システム設計',
          'プログラム開発',
          'テスト',
          '移行',
          '教育',
        ]),
        displayOrder: 2,
      },
    ],
  });

  console.log(`✅ Category created: ${category2.name} (2 fields)`);

  // ステップ 3: 納品情報
  const category3 = await prisma.schemaCategory.create({
    data: {
      schemaId: defaultSchema.id,
      name: 'ステップ 3: 納品情報',
      description: '納品物と納品条件を入力してください',
      displayOrder: 3,
    },
  });

  await prisma.schemaField.createMany({
    data: [
      {
        categoryId: category3.id,
        fieldName: '納品物',
        dataType: DataType.LIST,
        isRequired: false,
        listTargetEntity: 'Deliverable',
        placeholderText: '納品物を追加してください',
        displayOrder: 1,
      },
      {
        categoryId: category3.id,
        fieldName: '納品期限',
        dataType: DataType.DATE,
        isRequired: true,
        placeholderText: '納品期限を選択してください',
        displayOrder: 2,
      },
      {
        categoryId: category3.id,
        fieldName: '納品場所',
        dataType: DataType.TEXT,
        isRequired: false,
        placeholderText: '納品場所を入力してください',
        displayOrder: 3,
      },
      {
        categoryId: category3.id,
        fieldName: '納品担当者',
        dataType: DataType.TEXT,
        isRequired: false,
        placeholderText: '納品担当者を入力してください',
        displayOrder: 4,
      },
    ],
  });

  console.log(`✅ Category created: ${category3.name} (4 fields)`);

  // ステップ 4: 受注者等の要件
  const category4 = await prisma.schemaCategory.create({
    data: {
      schemaId: defaultSchema.id,
      name: 'ステップ 4: 受注者等の要件',
      description: '受注者に求める要件を入力してください',
      displayOrder: 4,
    },
  });

  await prisma.schemaField.createMany({
    data: [
      {
        categoryId: category4.id,
        fieldName: '受注者要件',
        dataType: DataType.LIST,
        isRequired: false,
        listTargetEntity: 'ContractorRequirement',
        placeholderText: '受注者要件を追加してください',
        displayOrder: 1,
      },
      {
        categoryId: category4.id,
        fieldName: '業務基本要件',
        dataType: DataType.LIST,
        isRequired: false,
        listTargetEntity: 'BasicBusinessRequirement',
        placeholderText: '業務基本要件を追加してください',
        displayOrder: 2,
      },
    ],
  });

  console.log(`✅ Category created: ${category4.name} (2 fields)`);

  // ステップ 5: 各業務の詳細仕様
  const category5 = await prisma.schemaCategory.create({
    data: {
      schemaId: defaultSchema.id,
      name: 'ステップ 5: 各業務の詳細仕様',
      description: '業務タスクの詳細仕様を入力してください',
      displayOrder: 5,
    },
  });

  await prisma.schemaField.createMany({
    data: [
      {
        categoryId: category5.id,
        fieldName: '業務タスク',
        dataType: DataType.LIST,
        isRequired: false,
        listTargetEntity: 'BusinessTask',
        placeholderText: '業務タスクを追加してください',
        displayOrder: 1,
      },
    ],
  });

  console.log(`✅ Category created: ${category5.name} (1 field)`);

  // ステップ 6: 仕様確認
  const category6 = await prisma.schemaCategory.create({
    data: {
      schemaId: defaultSchema.id,
      name: 'ステップ 6: 仕様確認',
      description: '入力した内容を確認してください',
      displayOrder: 6,
    },
  });

  console.log(`✅ Category created: ${category6.name} (0 fields - confirmation step)`);

  // ============================================
  // サマリー
  // ============================================
  console.log('\n🎉 Seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`  - Roles: 2 (ADMINISTRATOR, CREATOR)`);
  console.log(`  - Users: 2 (admin@example.com, creator@example.com)`);
  console.log(`  - Default passwords: Admin123!, Creator123!`);
  console.log(`  - Schema: 1 (デフォルトスキーマ)`);
  console.log(`  - Categories: 6`);
  console.log(`  - Fields: 12\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
