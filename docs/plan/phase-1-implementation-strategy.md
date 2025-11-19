# Phase 1: バックエンド基盤 - 実装方針書

**作成日**: 2025-11-19
**対象フェーズ**: Phase 1 (実装計画書 v1.1.1 参照)
**実装期間**: 3-5日
**担当**: Backend開発チーム

---

## 目次

1. [Phase 1 概要](#phase-1-概要)
2. [1.1 データベース設計実装](#11-データベース設計実装)
3. [1.2 認証・認可基盤](#12-認証認可基盤)
4. [1.3 基本APIフレームワーク](#13-基本apiフレームワーク)
5. [実装順序とマイルストーン](#実装順序とマイルストーン)
6. [リスクと対策](#リスクと対策)
7. [検証方法](#検証方法)

---

## Phase 1 概要

### 目的

バックエンドAPI開発の基盤となる以下の3つの主要コンポーネントを構築します：

1. **データベース設計実装**: Prismaを使用したスキーマ定義、マイグレーション、シードデータ
2. **認証・認可基盤**: JWTベースの認証とRBACによる認可
3. **基本APIフレームワーク**: Expressアプリケーション、エラーハンドリング、セキュリティ設定

### 成功基準

- [ ] Prismaマイグレーションが正常に実行でき、全テーブルが作成される
- [ ] シードデータが正常に投入され、デフォルトスキーマとテストユーザーが利用可能
- [ ] JWT認証が動作し、トークンの生成・検証が成功する
- [ ] RBACミドルウェアが正しくロールを検証する
- [ ] ヘルスチェックエンドポイントが正常に応答する
- [ ] 全ての実装に対してテストが作成され、カバレッジ80%以上を達成
- [ ] セキュリティチェックリストの全項目がクリアされる

---

## 1.1 データベース設計実装

### 実装概要

メタモデル・アーキテクチャに基づくデータベーススキーマを Prisma で定義し、マイグレーションとシードデータを作成します。

### データベーステーブル構成

データモデル設計書 ([仕様書作成アプリ データモデル生成.md](../spec/仕様書作成アプリ%20データモデル生成.md)) に基づき、以下のテーブルを実装します：

#### スキーマ層（メタデータ）
1. **Schema**: 仕様書テンプレート全体を定義
2. **Schema_Category**: ウィザードのステップ（カテゴリ）を定義
3. **Schema_Field**: 各カテゴリ内の入力項目を定義

#### インスタンス層（データ）
4. **User**: ユーザー情報
5. **Role**: ロール定義（Administrator/Creator）
6. **User_Role**: ユーザーとロールの多対多関係
7. **Specification**: 仕様書マスター
8. **Specification_Content**: 動的フィールドの値（EAVパターン）

#### サブエンティティ（1:N動的リスト）
9. **Deliverable**: 納品物
10. **Contractor_Requirement**: 受注者要件
11. **Basic_Business_Requirement**: 業務基本要件
12. **Business_Task**: 業務タスク

### 実装タスク詳細

#### Task 1.1.1: Prisma初期化

```bash
# backend ディレクトリで実行
cd backend
npx prisma init
```

**作成されるファイル**:
- `backend/prisma/schema.prisma`
- `backend/.env` (DATABASE_URL が追加される)

**設定内容**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Task 1.1.2: Prisma スキーマ定義

**ファイル**: `backend/prisma/schema.prisma`

**重要な設計決定事項**:

1. **UUID使用**: 全てのPKにUUIDを使用（セキュリティとスケーラビリティのため）
2. **Enum型の定義**:
   - `DataType`: フィールドのデータ型（TEXT, TEXTAREA, DATE, RADIO, CHECKBOX, LIST）
   - `SpecificationStatus`: 仕様書のステータス（DRAFT, REVIEW, SAVED）
   - `RoleName`: ロール名（ADMINISTRATOR, CREATOR）
3. **インデックス設計**:
   - `Specification.author_user_id`: 一覧取得のパフォーマンス向上
   - `Specification.schema_id`: スキーマ参照の高速化
   - `Specification_Content.specification_id`: コンテンツ取得の高速化
   - `Specification_Content.field_id`: フィールド検索の高速化
4. **Cascade削除設定**:
   - Specification削除時に関連する Specification_Content, Deliverable, Business_Task等を自動削除
   - Schema削除時に関連する Schema_Category, Schema_Field を自動削除

**スキーマ定義の骨格**:

```prisma
model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  passwordHash String   @map("password_hash")
  fullName     String   @map("full_name")
  createdAt    DateTime @default(now()) @map("created_at")

  userRoles      UserRole[]
  specifications Specification[]

  @@map("users")
}

model Role {
  id       Int      @id @default(autoincrement())
  roleName RoleName @unique @map("role_name")

  userRoles UserRole[]

  @@map("roles")
}

enum RoleName {
  ADMINISTRATOR
  CREATOR
}

model UserRole {
  userId String @map("user_id") @db.Uuid
  roleId Int    @map("role_id")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

model Schema {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @map("schema_name")
  isDefault Boolean  @default(false) @map("is_default")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  categories     SchemaCategory[]
  specifications Specification[]

  @@map("schemas")
}

model SchemaCategory {
  id           String  @id @default(uuid()) @db.Uuid
  schemaId     String  @map("schema_id") @db.Uuid
  name         String  @map("category_name")
  description  String?
  displayOrder Int     @map("display_order")

  schema Schema        @relation(fields: [schemaId], references: [id], onDelete: Cascade)
  fields SchemaField[]

  @@map("schema_categories")
  @@index([schemaId])
}

model SchemaField {
  id               String   @id @default(uuid()) @db.Uuid
  categoryId       String   @map("category_id") @db.Uuid
  fieldName        String   @map("field_name")
  dataType         DataType @map("data_type")
  isRequired       Boolean  @default(false) @map("is_required")
  options          Json?
  placeholderText  String?  @map("placeholder_text")
  listTargetEntity String?  @map("list_target_entity")
  displayOrder     Int      @map("display_order")

  category            SchemaCategory         @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  specificationContent SpecificationContent[]

  @@map("schema_fields")
  @@index([categoryId])
}

enum DataType {
  TEXT
  TEXTAREA
  DATE
  RADIO
  CHECKBOX
  LIST
}

model Specification {
  id        String              @id @default(uuid()) @db.Uuid
  authorId  String              @map("author_user_id") @db.Uuid
  schemaId  String              @map("schema_id") @db.Uuid
  title     String?
  status    SpecificationStatus @default(DRAFT)
  version   String              @default("1.0")
  createdAt DateTime            @default(now()) @map("created_at")
  updatedAt DateTime            @updatedAt @map("updated_at")

  author                   User                       @relation(fields: [authorId], references: [id])
  schema                   Schema                     @relation(fields: [schemaId], references: [id])
  content                  SpecificationContent[]
  deliverables             Deliverable[]
  contractorRequirements   ContractorRequirement[]
  basicBusinessRequirements BasicBusinessRequirement[]
  businessTasks            BusinessTask[]

  @@map("specifications")
  @@index([authorId])
  @@index([schemaId])
}

enum SpecificationStatus {
  DRAFT
  REVIEW
  SAVED
}

model SpecificationContent {
  id              String @id @default(uuid()) @db.Uuid
  specificationId String @map("specification_id") @db.Uuid
  fieldId         String @map("field_id") @db.Uuid
  value           String @db.Text

  specification Specification @relation(fields: [specificationId], references: [id], onDelete: Cascade)
  field         SchemaField   @relation(fields: [fieldId], references: [id])

  @@map("specification_contents")
  @@index([specificationId])
  @@index([fieldId])
}

model Deliverable {
  id              String  @id @default(uuid()) @db.Uuid
  specificationId String  @map("specification_id") @db.Uuid
  name            String
  quantity        Int
  description     String? @db.Text

  specification Specification @relation(fields: [specificationId], references: [id], onDelete: Cascade)

  @@map("deliverables")
  @@index([specificationId])
}

model ContractorRequirement {
  id              String  @id @default(uuid()) @db.Uuid
  specificationId String  @map("specification_id") @db.Uuid
  category        String
  description     String  @db.Text

  specification Specification @relation(fields: [specificationId], references: [id], onDelete: Cascade)

  @@map("contractor_requirements")
  @@index([specificationId])
}

model BasicBusinessRequirement {
  id              String  @id @default(uuid()) @db.Uuid
  specificationId String  @map("specification_id") @db.Uuid
  category        String
  description     String  @db.Text

  specification Specification @relation(fields: [specificationId], references: [id], onDelete: Cascade)

  @@map("basic_business_requirements")
  @@index([specificationId])
}

model BusinessTask {
  id              String  @id @default(uuid()) @db.Uuid
  specificationId String  @map("specification_id") @db.Uuid
  title           String
  detailedSpec    String  @db.Text @map("detailed_spec")

  specification Specification @relation(fields: [specificationId], references: [id], onDelete: Cascade)

  @@map("business_tasks")
  @@index([specificationId])
}
```

#### Task 1.1.3: マイグレーション作成

```bash
# 開発環境でのマイグレーション作成
npm run prisma:migrate -- --name init_schema
```

**検証**:
- `backend/prisma/migrations/` ディレクトリにマイグレーションファイルが生成されること
- SQLファイルの内容を確認し、全テーブル、インデックス、外部キー制約が正しく定義されていること

#### Task 1.1.4: Prisma Client 生成

```bash
npm run prisma:generate
```

**検証**:
- `node_modules/.prisma/client` が生成されること
- TypeScript型定義が利用可能になること

#### Task 1.1.5: シードデータ作成

**ファイル**: `backend/prisma/seeds/index.ts`

**シードデータの内容**:

1. **ロールデータ**:
   - ADMINISTRATOR
   - CREATOR

2. **テストユーザー**:
   - 管理者ユーザー: `admin@example.com` / `Admin123!`
   - 作成者ユーザー: `creator@example.com` / `Creator123!`

3. **デフォルトスキーマ**:
   - スキーマ名: "デフォルトスキーマ"
   - 6つのカテゴリ（ステップ1〜6）
   - 各カテゴリに対応するフィールド定義

**シードデータ実装例**:

```typescript
import { PrismaClient, RoleName, DataType, SpecificationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // ロールの作成
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

  console.log('Roles created:', { adminRole, creatorRole });

  // テストユーザーの作成
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      fullName: '管理者テストユーザー',
    },
  });

  const creatorPassword = await bcrypt.hash('Creator123!', 12);
  const creatorUser = await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {},
    create: {
      email: 'creator@example.com',
      passwordHash: creatorPassword,
      fullName: '作成者テストユーザー',
    },
  });

  console.log('Users created:', { adminUser, creatorUser });

  // ユーザーロールの関連付け
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

  console.log('User roles assigned');

  // デフォルトスキーマの作成
  const defaultSchema = await prisma.schema.upsert({
    where: { id: 'default-schema-id' }, // 固定IDを使用
    update: {},
    create: {
      id: 'default-schema-id',
      name: 'デフォルトスキーマ',
      isDefault: true,
    },
  });

  console.log('Default schema created:', defaultSchema);

  // カテゴリとフィールドの作成（ステップ1: 基本情報）
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

  // 残りのカテゴリとフィールドも同様に作成...
  // （ステップ2〜6の詳細は実装時に追加）

  console.log('Seeding finished successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**実行**:
```bash
npm run prisma:seed
```

#### Task 1.1.6: データベース接続設定

**ファイル**: `backend/src/config/database.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// ロギング設定
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Query executed', {
      query: e.query,
      duration: e.duration,
    });
  }
});

prisma.$on('error', (e) => {
  logger.error('Database error', { message: e.message });
});

prisma.$on('warn', (e) => {
  logger.warn('Database warning', { message: e.message });
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export { prisma };
```

### テスト仕様（TDD）

#### Unit Tests: `backend/tests/unit/database.test.ts`

```typescript
import { prisma } from '../../src/config/database';
import { RoleName } from '@prisma/client';

describe('Database Connection', () => {
  it('should connect to database successfully', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it('should disconnect from database successfully', async () => {
    await expect(prisma.$disconnect()).resolves.not.toThrow();
  });
});

describe('Seed Data', () => {
  it('should have ADMINISTRATOR and CREATOR roles', async () => {
    const roles = await prisma.role.findMany();
    expect(roles).toHaveLength(2);
    expect(roles.map(r => r.roleName)).toContain(RoleName.ADMINISTRATOR);
    expect(roles.map(r => r.roleName)).toContain(RoleName.CREATOR);
  });

  it('should have default schema', async () => {
    const schema = await prisma.schema.findFirst({
      where: { isDefault: true },
    });
    expect(schema).not.toBeNull();
    expect(schema?.name).toBe('デフォルトスキーマ');
  });

  it('should have test users', async () => {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });
    const creatorUser = await prisma.user.findUnique({
      where: { email: 'creator@example.com' },
    });
    expect(adminUser).not.toBeNull();
    expect(creatorUser).not.toBeNull();
  });

  it('should have proper foreign key constraints', async () => {
    const specification = await prisma.specification.create({
      data: {
        authorId: 'non-existent-user-id',
        schemaId: 'non-existent-schema-id',
        title: 'Test',
      },
    });
    // 外部キー制約によりエラーが発生するはず
  });
});
```

---

## 1.2 認証・認可基盤

### 実装概要

JWTベースの認証システムとロールベースアクセス制御（RBAC）を実装します。

### 実装タスク詳細

#### Task 1.2.1: JWT ユーティリティ作成

**ファイル**: `backend/src/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * JWTトークンを生成する
 */
export function generateToken(payload: JwtPayload): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'spec-manager-api',
    });

    logger.debug('JWT token generated', { userId: payload.userId });
    return token;
  } catch (error) {
    logger.error('Failed to generate JWT token', { error });
    throw error;
  }
}

/**
 * JWTトークンを検証する
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'spec-manager-api',
    }) as JwtPayload;

    logger.debug('JWT token verified', { userId: decoded.userId });
    return decoded;
  } catch (error) {
    logger.warn('JWT token verification failed', { error });
    throw error;
  }
}

/**
 * JWTトークンをデコードする（検証なし）
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    logger.warn('JWT token decoding failed', { error });
    return null;
  }
}
```

#### Task 1.2.2: パスワードハッシュユーティリティ作成

**ファイル**: `backend/src/utils/password.ts`

```typescript
import bcrypt from 'bcrypt';
import { logger } from './logger';

const SALT_ROUNDS = 12;

/**
 * パスワードをハッシュ化する
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    logger.debug('Password hashed successfully');
    return hash;
  } catch (error) {
    logger.error('Failed to hash password', { error });
    throw error;
  }
}

/**
 * パスワードを検証する
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    logger.debug('Password comparison completed', { isMatch });
    return isMatch;
  } catch (error) {
    logger.error('Failed to compare password', { error });
    throw error;
  }
}
```

#### Task 1.2.3: 認証ミドルウェア作成

**ファイル**: `backend/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * 認証ミドルウェア
 * Authorizationヘッダーからトークンを取得し、検証する
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Authorization ヘッダーからトークンを取得
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is missing',
        },
      });
      return;
    }

    // "Bearer <token>" 形式を想定
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authorization header format',
        },
      });
      return;
    }

    const token = parts[1];

    // トークンを検証
    const decoded = verifyToken(token);

    // リクエストオブジェクトにユーザー情報を追加
    req.user = decoded;

    logger.debug('User authenticated', { userId: decoded.userId });
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}
```

#### Task 1.2.4: RBAC ミドルウェア作成

**ファイル**: `backend/src/middleware/rbac.ts`

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { logger } from '../utils/logger';

/**
 * ロールベースアクセス制御ミドルウェア
 * 指定されたロールを持つユーザーのみアクセスを許可する
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // 認証ミドルウェアが先に実行されていることを前提
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      // ユーザーのロールをチェック
      const userRoles = req.user.roles || [];
      const hasRequiredRole = allowedRoles.some(role =>
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        logger.warn('Access denied due to insufficient permissions', {
          userId: req.user.userId,
          userRoles,
          requiredRoles: allowedRoles,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        });
        return;
      }

      logger.debug('Role check passed', {
        userId: req.user.userId,
        userRoles,
      });

      next();
    } catch (error) {
      logger.error('Role check failed', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify user permissions',
        },
      });
    }
  };
}

/**
 * 管理者のみアクセス可能
 */
export const requireAdmin = requireRole('ADMINISTRATOR');

/**
 * 作成者または管理者がアクセス可能
 */
export const requireCreator = requireRole('CREATOR', 'ADMINISTRATOR');
```

#### Task 1.2.5: 認証サービス作成

**ファイル**: `backend/src/services/authService.ts`

```typescript
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
  };
}

/**
 * ログイン処理
 */
export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const { email, password } = credentials;

  // ユーザーを検索
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    logger.warn('Login attempt with non-existent email', { email });
    throw new Error('Invalid email or password');
  }

  // パスワードを検証
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    logger.warn('Login attempt with invalid password', {
      userId: user.id,
      email,
    });
    throw new Error('Invalid email or password');
  }

  // ロール情報を取得
  const roles = user.userRoles.map(ur => ur.role.roleName);

  // JWTトークンを生成
  const token = generateToken({
    userId: user.id,
    email: user.email,
    roles,
  });

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    roles,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
    },
  };
}
```

#### Task 1.2.6: 認証コントローラー作成

**ファイル**: `backend/src/controllers/authController.ts`

```typescript
import { Request, Response } from 'express';
import { login } from '../services/authService';
import { logger } from '../utils/logger';

/**
 * POST /api/auth/login
 * ユーザーログイン
 */
export async function loginHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
      return;
    }

    // ログイン処理
    const result = await login({ email, password });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Login failed', { error });

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Invalid email or password',
      },
    });
  }
}
```

#### Task 1.2.7: 認証ルート作成

**ファイル**: `backend/src/routes/auth.ts`

```typescript
import { Router } from 'express';
import { loginHandler } from '../controllers/authController';

const router = Router();

/**
 * POST /api/auth/login
 * ユーザーログイン
 */
router.post('/login', loginHandler);

export default router;
```

### セキュリティチェック

- [x] パスワードハッシュ化（bcrypt、saltRounds: 12）
- [x] JWT Secret の環境変数管理
- [x] トークン有効期限設定（7日）
- [x] トークン検証における issuer チェック
- [x] 認証エラー時の適切なログ出力
- [x] RBAC による権限チェック

### テスト仕様（TDD）

#### Unit Tests: `backend/tests/unit/jwt.test.ts`

```typescript
import { generateToken, verifyToken, decodeToken } from '../../src/utils/jwt';

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    roles: ['CREATOR'],
  };

  it('should generate a valid JWT token', () => {
    const token = generateToken(mockPayload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid token', () => {
    const token = generateToken(mockPayload);
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.roles).toEqual(mockPayload.roles);
  });

  it('should throw error for invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });

  it('should decode token without verification', () => {
    const token = generateToken(mockPayload);
    const decoded = decodeToken(token);

    expect(decoded?.userId).toBe(mockPayload.userId);
  });
});
```

#### Unit Tests: `backend/tests/unit/password.test.ts`

```typescript
import { hashPassword, comparePassword } from '../../src/utils/password';

describe('Password Utilities', () => {
  const plainPassword = 'TestPassword123!';

  it('should hash password successfully', async () => {
    const hash = await hashPassword(plainPassword);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(plainPassword);
  });

  it('should compare password successfully', async () => {
    const hash = await hashPassword(plainPassword);
    const isMatch = await comparePassword(plainPassword, hash);
    expect(isMatch).toBe(true);
  });

  it('should fail comparison with wrong password', async () => {
    const hash = await hashPassword(plainPassword);
    const isMatch = await comparePassword('WrongPassword', hash);
    expect(isMatch).toBe(false);
  });
});
```

#### Integration Tests: `backend/tests/integration/auth.test.ts`

```typescript
import request from 'supertest';
import { createServer } from '../../src/server';

describe('Authentication API', () => {
  const app = createServer();

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'creator@example.com',
          password: 'Creator123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeTruthy();
      expect(response.body.data.user.email).toBe('creator@example.com');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'creator@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
```

#### Integration Tests: `backend/tests/integration/middleware/auth.test.ts`

```typescript
import request from 'supertest';
import { createServer } from '../../../src/server';
import { generateToken } from '../../../src/utils/jwt';

describe('Auth Middleware', () => {
  const app = createServer();

  const validToken = generateToken({
    userId: 'test-user-id',
    email: 'test@example.com',
    roles: ['CREATOR'],
  });

  it('should allow access with valid token', async () => {
    const response = await request(app)
      .get('/api/specifications')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).not.toBe(401);
  });

  it('should deny access without token', async () => {
    const response = await request(app)
      .get('/api/specifications');

    expect(response.status).toBe(401);
  });

  it('should deny access with invalid token', async () => {
    const response = await request(app)
      .get('/api/specifications')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
});
```

---

## 1.3 基本APIフレームワーク

### 実装概要

Expressアプリケーションの基本設定、エラーハンドリング、セキュリティ設定、ロギング、ヘルスチェックエンドポイントを実装します。

### 実装タスク詳細

#### Task 1.3.1: 環境変数管理

**ファイル**: `backend/src/config/env.ts`

```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // サーバー設定
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // データベース設定
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT設定
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS設定
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // レート制限設定
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
} as const;

// 必須環境変数のチェック
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is required but not defined`);
  }
}
```

#### Task 1.3.2: カスタムエラークラス

**ファイル**: `backend/src/utils/errors.ts`

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_SERVER_ERROR', message);
    this.name = 'InternalServerError';
  }
}
```

#### Task 1.3.3: エラーハンドリングミドルウェア（既存の更新）

**ファイル**: `backend/src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // AppError の場合
  if (err instanceof AppError) {
    logger.warn('Application error', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // その他のエラー
  logger.error('Unhandled error', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack,
      }),
    },
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
```

#### Task 1.3.4: レート制限ミドルウェア

**ファイル**: `backend/src/middleware/rateLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * 一般的なAPIエンドポイント用のレート制限
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 認証エンドポイント用の厳格なレート制限
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 15分あたり5リクエストまで
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### Task 1.3.5: ヘルスチェックルート（既存の更新）

**ファイル**: `backend/src/routes/health.ts`

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /health
 * アプリケーション状態のヘルスチェック
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
  });
});

/**
 * GET /health/db
 * データベース接続のヘルスチェック
 */
router.get('/db', async (req: Request, res: Response) => {
  try {
    // データベース接続確認
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Database health check failed', { error });

    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
```

#### Task 1.3.6: Express アプリケーション設定（server.ts の更新）

**ファイル**: `backend/src/server.ts`

```typescript
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import 'express-async-errors';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import { logger } from './utils/logger';

export function createServer(): Application {
  const app = express();

  // セキュリティヘッダー
  app.use(helmet());

  // CORS設定
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // リクエストボディパーサー
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // レート制限
  app.use(generalLimiter);

  // リクエストロギング
  app.use((req, res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });

  // ルート
  app.use('/health', healthRouter);
  app.use('/api/auth', authRouter);

  // 404ハンドラー
  app.use(notFoundHandler);

  // エラーハンドラー
  app.use(errorHandler);

  return app;
}
```

### セキュリティチェック

- [x] CORS設定の適切性（環境変数で管理）
- [x] レート制限の実装（一般エンドポイント: 100req/15min、認証: 5req/15min）
- [x] セキュリティヘッダー（helmet使用）
- [x] リクエストサイズ制限（10MB）
- [x] エラーメッセージの適切性（本番環境でスタック非表示）

### テスト仕様（TDD）

#### Integration Tests: `backend/tests/integration/health.test.ts`

```typescript
import request from 'supertest';
import { createServer } from '../../src/server';

describe('Health Check Endpoints', () => {
  const app = createServer();

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /health/db', () => {
    it('should return database connection status', async () => {
      const response = await request(app).get('/health/db');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.database).toBe('connected');
    });
  });
});
```

#### Unit Tests: `backend/tests/unit/errors.test.ts`

```typescript
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../src/utils/errors';

describe('Custom Error Classes', () => {
  it('should create ValidationError with correct properties', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create UnauthorizedError with correct properties', () => {
    const error = new UnauthorizedError();

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('should create ForbiddenError with correct properties', () => {
    const error = new ForbiddenError();

    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('should create NotFoundError with correct properties', () => {
    const error = new NotFoundError('User not found');

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('User not found');
  });
});
```

---

## 実装順序とマイルストーン

### Day 1: データベース設計実装（1.1）

**目標**: Prismaスキーマ定義、マイグレーション、シードデータの完成

1. ✅ Prisma初期化
2. ✅ スキーマ定義（全テーブル、Enum、リレーション）
3. ✅ マイグレーション作成と実行
4. ✅ Prisma Client生成
5. ✅ シードデータ作成と投入
6. ✅ データベース接続設定
7. ✅ データベース関連のユニットテスト作成

**マイルストーン**: `docker-compose up` でPostgreSQLが起動し、`npm run prisma:seed` でデータが投入される

### Day 2-3: 認証・認可基盤（1.2）

**目標**: JWT認証とRBACの完成

1. ✅ JWTユーティリティ作成
2. ✅ パスワードハッシュユーティリティ作成
3. ✅ 認証ミドルウェア作成
4. ✅ RBACミドルウェア作成
5. ✅ 認証サービス作成
6. ✅ 認証コントローラー作成
7. ✅ 認証ルート作成
8. ✅ 認証関連のユニットテスト作成
9. ✅ 認証APIの統合テスト作成

**マイルストーン**: `POST /api/auth/login` でログインが成功し、トークンが取得できる

### Day 4-5: 基本APIフレームワーク（1.3）

**目標**: Expressアプリケーションの基盤完成

1. ✅ 環境変数管理
2. ✅ カスタムエラークラス作成
3. ✅ エラーハンドリングミドルウェア更新
4. ✅ レート制限ミドルウェア作成
5. ✅ ヘルスチェックルート更新
6. ✅ server.ts の更新（全ミドルウェア統合）
7. ✅ APIフレームワークの統合テスト作成
8. ✅ セキュリティチェックリストの検証

**マイルストーン**: 全てのセキュリティ設定が適用され、ヘルスチェックが動作する

### Phase 1 完了チェック

- [ ] 全テーブルがデータベースに作成されている
- [ ] シードデータが正常に投入されている
- [ ] ログインAPIが動作し、JWTトークンが取得できる
- [ ] RBACミドルウェアが正しく権限チェックを行う
- [ ] ヘルスチェックエンドポイントが正常に応答する
- [ ] 全てのテストが成功する
- [ ] テストカバレッジが80%以上である
- [ ] セキュリティチェックリストの全項目がクリアされている
- [ ] ESLintとPrettierでコード品質が保証されている

---

## リスクと対策

### リスク1: Prismaスキーマの複雑性

**リスク**: メタモデル・アーキテクチャは複雑で、スキーマ定義にミスが発生する可能性

**対策**:
- データモデル設計書を詳細に確認
- スキーマ定義後、ERD生成ツールで視覚的に確認
- シードデータで全リレーションの動作を検証

### リスク2: JWT Secretの管理

**リスク**: JWT_SECRETが適切に設定されていないとセキュリティリスク

**対策**:
- 環境変数の必須チェックをアプリケーション起動時に実施
- `.env.example` に明確な説明を記載
- 本番環境ではSecret Managerを使用（Phase 8で実装）

### リスク3: テストカバレッジの不足

**リスク**: TDD原則に従わないと、後からテストを書くのが困難

**対策**:
- 各実装前にテスト仕様を明確化
- 実装とテストをペアで進める
- カバレッジレポートを定期的に確認

### リスク4: パフォーマンス問題

**リスク**: N+1問題や不適切なインデックスによるパフォーマンス低下

**対策**:
- Prismaのクエリログを有効化（開発環境）
- インデックスを適切に設定
- 統合テストでクエリ数を確認

---

## 検証方法

### 手動検証

#### 1. データベース接続確認

```bash
cd backend
npm run prisma:studio
```

ブラウザで `http://localhost:5555` にアクセスし、全テーブルが表示されることを確認

#### 2. シードデータ確認

Prisma Studioで以下を確認:
- Roleテーブルに ADMINISTRATOR, CREATOR が存在
- Userテーブルに admin@example.com, creator@example.com が存在
- Schemaテーブルにデフォルトスキーマが存在

#### 3. ログインAPI確認

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "creator@example.com", "password": "Creator123!"}'
```

レスポンスにトークンが含まれることを確認

#### 4. 認証ミドルウェア確認

```bash
# トークンなしでアクセス（401エラーになるはず）
curl http://localhost:3001/api/specifications

# トークン付きでアクセス（認証成功）
curl http://localhost:3001/api/specifications \
  -H "Authorization: Bearer <TOKEN>"
```

### 自動テスト

```bash
# 全テスト実行
npm test

# カバレッジ付き実行
npm run test:coverage

# カバレッジレポートを開く
open coverage/lcov-report/index.html
```

### セキュリティ検証

```bash
# 依存関係の脆弱性スキャン
npm audit

# ESLint実行
npm run lint

# Prettier実行
npm run format:check
```

---

## 参考資料

### プロジェクトドキュメント
- [実装計画書](./implementation-plan.md)
- [データモデル設計](../spec/仕様書作成アプリ%20データモデル生成.md)
- [CLAUDE.md](../../CLAUDE.md)
- [Backend CLAUDE.md](../../backend/CLAUDE.md)

### 技術ドキュメント
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**作成者**: Claude
**最終更新**: 2025-11-19
**バージョン**: 1.0.0
