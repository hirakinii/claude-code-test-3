# Phase 2 クイックスタートガイド

このドキュメントは Phase 2（スキーマ管理機能）の実装を開始するための簡潔なガイドです。

詳細な実装計画は [phase-2-implementation-plan.md](./phase-2-implementation-plan.md) を参照してください。

---

## 実装開始前の確認事項

### 前提条件

- [ ] Phase 1 が完了していること
- [ ] データベースが起動していること
- [ ] シードデータが投入されていること
- [ ] テストユーザーでログインできること

### 確認コマンド

```bash
# データベース接続確認
npm run prisma:studio

# バックエンド起動
cd backend
npm run dev

# フロントエンド起動
cd frontend
npm run dev

# テスト実行
cd backend
npm run test
```

---

## 実装の順序（推奨）

### Day 1: バックエンド基盤とスキーマ取得API

#### ステップ 1: ファイル作成

```bash
cd backend/src

# ディレクトリ作成
mkdir -p services/schema
mkdir -p controllers/schema
mkdir -p routes/schema
mkdir -p tests/unit/services
mkdir -p tests/integration

# ファイル作成
touch services/schemaService.ts
touch controllers/schemaController.ts
touch routes/schema.ts
touch tests/unit/services/schemaService.test.ts
touch tests/integration/schema.test.ts
```

#### ステップ 2: テスト作成（TDD）

`backend/src/tests/unit/services/schemaService.test.ts`

```typescript
import { getSchemaById } from '../../../services/schemaService';

describe('SchemaService - getSchemaById', () => {
  it('should return schema with categories and fields', async () => {
    const schema = await getSchemaById('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

    expect(schema).toBeDefined();
    expect(schema.categories).toBeDefined();
    expect(schema.categories.length).toBeGreaterThan(0);
  });
});
```

#### ステップ 3: Service実装

`backend/src/services/schemaService.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSchemaById(schemaId: string) {
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

  return schema;
}
```

#### ステップ 4: Controller実装

`backend/src/controllers/schemaController.ts`

```typescript
import { Request, Response } from 'express';
import { getSchemaById } from '../services/schemaService';
import { logger } from '../utils/logger';

export async function getSchemaHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { schemaId } = req.params;

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

    res.status(404).json({
      success: false,
      error: {
        code: 'SCHEMA_NOT_FOUND',
        message: 'Schema not found',
      },
    });
  }
}
```

#### ステップ 5: Route定義

`backend/src/routes/schema.ts`

```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { getSchemaHandler } from '../controllers/schemaController';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/:schemaId', getSchemaHandler);

export default router;
```

#### ステップ 6: server.ts に追加

`backend/src/server.ts`

```typescript
import schemaRouter from './routes/schema';

// ...

app.use('/api/schema', schemaRouter);
```

#### ステップ 7: テスト実行

```bash
npm run test
```

---

### Day 2: カテゴリCRUD API

#### 実装順序

1. **テスト作成**: `createCategory` のテスト
2. **実装**: Service, Controller, Route
3. **テスト実行**: 確認
4. **同様に**: `updateCategory`, `deleteCategory`

#### カテゴリ作成の実装例

**Service** (`services/schemaService.ts` に追加)

```typescript
export async function createCategory(data: {
  schemaId: string;
  name: string;
  description?: string;
  displayOrder: number;
}) {
  const schema = await prisma.schema.findUnique({
    where: { id: data.schemaId },
  });

  if (!schema) {
    throw new Error('Schema not found');
  }

  const category = await prisma.schemaCategory.create({
    data,
  });

  return category;
}
```

**Controller** (`controllers/schemaController.ts` に追加)

```typescript
export async function createCategoryHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { schemaId, name, description, displayOrder } = req.body;

    // バリデーション
    if (!schemaId || !name || !displayOrder) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields are missing',
        },
      });
      return;
    }

    const category = await createCategory({ schemaId, name, description, displayOrder });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('Failed to create category', { error });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create category',
      },
    });
  }
}
```

**Route** (`routes/schema.ts` に追加)

```typescript
router.post('/categories', createCategoryHandler);
```

---

### Day 3: フィールドCRUD API

Day 2 と同様の手順で実装します。

**注意点**:
- `dataType` のENUM検証
- `options` のJSON検証（RADIO/CHECKBOXの場合）
- `listTargetEntity` の必須検証（LISTの場合）

---

### Day 4: フロントエンド基盤

#### ステップ 1: ファイル作成

```bash
cd frontend/src

# ディレクトリ作成
mkdir -p pages/SchemaSettings
mkdir -p components/schema
mkdir -p hooks
mkdir -p api

# ファイル作成
touch api/schemaApi.ts
touch hooks/useSchema.ts
touch pages/SchemaSettings/index.tsx
touch pages/SchemaSettings/CategoryList.tsx
touch pages/SchemaSettings/CategoryForm.tsx
```

#### ステップ 2: API クライアント実装

`frontend/src/api/schemaApi.ts` - 詳細は実装計画書を参照

#### ステップ 3: カスタムフック実装

`frontend/src/hooks/useSchema.ts` - 詳細は実装計画書を参照

#### ステップ 4: ルーティング設定

`frontend/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SchemaSettings from './pages/SchemaSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/settings/schema" element={<SchemaSettings />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## テストの実行

### バックエンドテスト

```bash
cd backend

# すべてのテスト
npm run test

# ユニットテストのみ
npm run test:unit

# 統合テストのみ
npm run test:integration

# カバレッジ確認
npm run test -- --coverage
```

### フロントエンドテスト

```bash
cd frontend

# すべてのテスト
npm run test

# E2Eテスト
npm run test:e2e
```

---

## トラブルシューティング

### データベース接続エラー

```bash
# Prisma Client 再生成
npm run prisma:generate

# データベースリセット
npm run db:reset
```

### テスト失敗

```bash
# テストデータベースのリセット
NODE_ENV=test npm run db:reset

# キャッシュクリア
npm run clean
npm install
```

### ポート競合

```bash
# バックエンドのポート変更
PORT=3002 npm run dev

# フロントエンドのポート変更
# vite.config.ts で設定
```

---

## コミット戦略

### コミットタイミング

1. スキーマ取得API完成時
2. カテゴリCRUD API完成時
3. フィールドCRUD API完成時
4. フロントエンド基盤完成時
5. UI実装完成時
6. テスト完成時

### コミットメッセージ例

```bash
git add .
git commit -m "feat(schema): Add schema retrieval API with tests"

git add .
git commit -m "feat(schema): Add category CRUD APIs"

git add .
git commit -m "feat(schema): Add field CRUD APIs"

git add .
git commit -m "feat(frontend): Add schema settings page UI"

git add .
git commit -m "test(schema): Add integration tests for schema API"
```

---

## 次のステップ

Phase 2 完了後:

1. 実装計画書の完了基準を確認
2. セキュリティチェックリストを確認
3. リポジトリオーナーにレビュー依頼
4. Phase 3 の計画策定へ

---

## 参考リンク

- [Phase 2 詳細実装計画](./phase-2-implementation-plan.md)
- [Phase 1 実装コード](../../backend/src/)
- [Prismaスキーマ](../../backend/prisma/schema.prisma)
- [既存のテストコード](../../backend/src/tests/)

---

**作成者**: Claude
**最終更新**: 2025-11-19
