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

### ⚠️ 重要: フロントエンドライブラリのバージョン要件

**React 19.x + Material-UI v7.x の互換性問題により、以下の厳密なバージョン指定が必要です:**

```json
{
  "dependencies": {
    "react": "19.1.1",
    "react-dom": "19.1.1",
    "@mui/material": "7.3.2",
    "@mui/icons-material": "7.3.2"
  },
  "devDependencies": {
    "@types/react": "19.1.1",
    "@types/react-dom": "19.1.1"
  }
}
```

**注意事項:**
- `^` プレフィックスを使用せず、**exact versions**（厳密バージョン）を指定してください
- React 19.2.0 は MUI v7 との互換性問題があることが確認されています
- `npm install` 後に必ず `rm -rf node_modules package-lock.json && npm install` を実行してください

**アーキテクチャ上の変更:**
- **Redux**: Phase 2 ではローカルステート管理のみ使用（Redux は不要）
- **React.StrictMode**: MUI v7 との互換性のため、一時的に無効化されています

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

### Day 1: バックエンド基盤とスキーマ取得API ✅ **COMPLETED**

**実装状況:**
- すべてのテストと実装が完了
- 39 unit tests + 39 integration tests = 78+ tests (all passing)
- Test isolation using dedicated test schemas

#### ステップ 1: ファイル作成 ✅

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

#### ステップ 7: テスト実行 ✅

```bash
cd backend
npm run test

# 実行結果: 80+ tests passing
# - Unit tests: 39 tests
# - Integration tests: 39 tests
# - Test coverage: 80%+
```

**実装完了ファイル:**
- ✅ `backend/src/services/schemaService.ts`
- ✅ `backend/src/controllers/schemaController.ts`
- ✅ `backend/src/routes/schema.ts`
- ✅ `backend/tests/unit/services/schemaService.test.ts`
- ✅ `backend/tests/integration/schema.test.ts`

---

### Day 2: カテゴリCRUD API ✅ **COMPLETED**

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

**実装統計:**
- Unit tests for categories: 12 tests (create, update, delete, cascade)
- Integration tests for categories: 15 tests (API, auth, validation)
- All tests passing

---

### Day 3: フィールドCRUD API ✅ **COMPLETED**

Day 2 と同様の手順で実装完了。

**実装済みの機能:**
- ✅ `dataType` のENUM検証 (TEXT, TEXTAREA, DATE, RADIO, CHECKBOX, LIST)
- ✅ `options` のJSON検証（RADIO/CHECKBOXの場合）
- ✅ `listTargetEntity` の必須検証（LISTの場合）

**実装統計:**
- Unit tests for fields: 18 tests (all data types, validation)
- Integration tests for fields: 13 tests (API, auth, validation)
- All tests passing

**テスト改善点:**
- UUID validation: エラーケースで有効なUUID形式を使用
- Test isolation: 専用スキーマで完全にテストを分離
- Cleanup strategy: 作成したリソースを自動削除

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

### バックエンドテスト ✅ **COMPLETED - 80+ tests passing**

```bash
cd backend

# すべてのテスト (80+ tests)
npm run test

# テスト実行結果:
# PASS  tests/unit/services/schemaService.test.ts (39 tests)
# PASS  tests/integration/schema.test.ts (39 tests)
#
# Test Suites: 2 passed, 2 total
# Tests:       78 passed, 78 total
# Coverage:    80%+ for Phase 2 features

# ユニットテストのみ (39 tests)
npm run test tests/unit

# 統合テストのみ (39 tests)
npm run test tests/integration

# カバレッジ確認
npm run test -- --coverage
```

**テスト統計:**
- **Unit Tests**: 39 tests
  - getSchemaById: 5 tests
  - Category CRUD: 13 tests
  - Field CRUD: 20 tests
  - resetSchemaToDefault: 1 test

- **Integration Tests**: 39 tests
  - Schema API: 7 tests
  - Category API: 19 tests
  - Field API: 13 tests
  - All with authentication/authorization testing

**主要なテスト機能:**
- ✅ Test isolation (dedicated test schemas)
- ✅ Automatic cleanup (afterEach/afterAll)
- ✅ UUID validation for error cases
- ✅ Authentication & authorization testing
- ✅ Cascade delete verification
- ✅ Transaction testing

### フロントエンドテスト ⏳ **PENDING**

```bash
cd frontend

# すべてのテスト (未実装)
npm run test

# E2Eテスト (未実装)
npm run test:e2e
```

**実装状況:**
- ❌ Component tests (CategoryList.test.tsx) not yet implemented
- ❌ E2E tests not yet implemented

**理由:**
- ログインページが未実装のため、schema settings画面のテストがブロックされている
- Phase 2 では TDD 原則に従い、バックエンド API 実装を優先

**実装予定:**
- ログインページ実装完了後（別セッションで対応予定）
- Phase 2.5 または Phase 3 の一部として実施

---

## トラブルシューティング

### ⚠️ React 19.x + Material-UI v7 互換性問題

#### 問題 1: "Element type is invalid" エラー（ThemeProvider関連）

**エラー内容:**
```
Error: Element type is invalid: expected a string (for built-in components)
or a class/function (for composite components) but got: object.
Check the render method of ThemeProvider3.
```

**原因:**
- React 19.2.0 と Material-UI v7.3.5 の組み合わせに互換性問題
- React.StrictMode がMUI v7のネストされたThemeProviderと衝突

**解決方法:**
```bash
cd frontend

# 1. package.json を正しいバージョンに修正（exact versions、^ なし）
# "react": "19.1.1",
# "react-dom": "19.1.1",
# "@mui/material": "7.3.2",
# "@mui/icons-material": "7.3.2",
# "@types/react": "19.1.1",
# "@types/react-dom": "19.1.1"

# 2. クリーンインストール
rm -rf node_modules package-lock.json
npm install
```

#### 問題 2: Redux Store エラー（"Store does not have a valid reducer"）

**原因:**
- Redux Toolkit は空の reducer オブジェクト `reducer: {}` を許可しない
- Phase 2 ではグローバルステート管理が不要

**解決方法:**
```bash
# Redux 関連ファイルを削除
rm -rf frontend/src/store

# main.tsx と App.tsx から Redux Provider を削除
# （詳細は phase-2-implementation-plan.md の v1.0.1 を参照）
```

#### 問題 3: 無限ローディングスピナー（/settings/schema ページ）

**原因:**
- `useSchema` フックで token が空文字列の場合、`loading` が `true` のまま更新されない

**解決方法:**
- `frontend/src/hooks/useSchema.ts` で token チェックを追加済み
- 認証なしでアクセスすると適切な警告メッセージを表示

#### 問題 4: Button component prop エラー

**原因:**
- Material-UI Button の `component={Link}` プロップが React 19 と互換性なし

**解決方法:**
```typescript
// 修正前
<Button component={Link} to="/settings/schema">

// 修正後
const navigate = useNavigate();
<Button onClick={() => navigate('/settings/schema')}>
```

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

### Phase 2 バックエンドテスト完了後の状況 ✅

**完了した作業:**
1. ✅ バックエンドAPI実装 (Schema, Category, Field CRUD)
2. ✅ ユニットテスト (39 tests, 80%+ coverage)
3. ✅ 統合テスト (39 tests, authentication/authorization)
4. ✅ Test isolation (dedicated schemas, automatic cleanup)
5. ✅ 実装計画書・クイックスタートガイドの更新

**残っている作業:**
1. ⏳ ログインページの実装 (別セッションで対応予定)
2. ⏳ フロントエンドコンポーネントテスト (CategoryList.test.tsx など)
3. ⏳ E2Eテスト (Playwright)
4. ⏳ フロントエンドUI実装 (SchemaSettings page)

**次のアクション:**
1. 実装計画書の完了基準を確認 (部分的に完了)
2. セキュリティチェックリストを確認 (継続作業)
3. リポジトリオーナーにレビュー依頼 (バックエンド部分)
4. ログインページ実装の計画策定
5. Phase 2.5 (フロントエンド完成) または Phase 3 への移行検討

---

## 参考リンク

- [Phase 2 詳細実装計画](./phase-2-implementation-plan.md)
- [Phase 1 実装コード](../../backend/src/)
- [Prismaスキーマ](../../backend/prisma/schema.prisma)
- [既存のテストコード](../../backend/src/tests/)

---

## 📝 更新履歴

### v1.0.1 (2025-11-19) - React 19.x + Material-UI v7 互換性対応

#### 背景

Phase 2 実装中に **React 19.2.0 と Material-UI v7.3.5 の組み合わせで深刻な互換性問題** が発生しました。5時間のデバッグの結果、以下の安定版バージョンの組み合わせで問題が解決されました。

#### ライブラリバージョンの変更

| ライブラリ | 元のバージョン | 修正後のバージョン | 理由 |
|----------|--------------|-----------------|------|
| react | 19.2.0 | **19.1.1** (exact) | MUI v7との互換性確保 |
| react-dom | 19.2.0 | **19.1.1** (exact) | Reactに合わせて統一 |
| @mui/material | 7.3.5 | **7.3.2** (exact) | React 19.1.1との互換性確保 |
| @mui/icons-material | 7.3.5 | **7.3.2** (exact) | MUIのバージョン統一 |
| @types/react | 19.2.6 | **19.1.1** (exact) | Reactに合わせた型定義 |
| @types/react-dom | 19.2.3 | **19.1.1** (exact) | React DOMに合わせた型定義 |
| react-router-dom | 6.21.1 | **7.9.1** | 最新安定版へ更新 |

**重要**: `package.json` で `^` プレフィックスを削除し、exact versionsを指定しています。これにより、`npm install` 時に意図しないバージョンアップを防ぎます。

#### アーキテクチャの簡素化

**1. Redux の削除**
- **理由**: Phase 2 の機能はローカルステート管理で十分
- **削除ファイル**: `frontend/src/store/index.ts`
- **影響範囲**: `main.tsx`, `App.tsx` から Redux Provider を削除
- **利点**:
  - コード量削減
  - Redux Toolkit の "empty reducer" エラー回避
  - デバッグの簡素化

**2. React.StrictMode の無効化**
- **理由**: React 19 の StrictMode が MUI v7 の ThemeProvider とコンフリクト
- **影響ファイル**: `frontend/src/main.tsx`
- **将来の対応**: MUI が React 19 を完全サポート後に再有効化を検討

#### フロントエンド構造の変更

**新規作成されたファイル:**
```
frontend/src/
├── api/
│   └── schemaApi.ts              # Schema API クライアント
├── hooks/
│   └── useSchema.ts              # Schema データフェッチング用カスタムフック
└── pages/
    └── SchemaSettings/
        ├── index.tsx             # メインページ
        ├── CategoryList.tsx      # ドラッグ&ドロップ可能なカテゴリリスト
        ├── CategoryForm.tsx      # カテゴリ作成/編集フォーム
        ├── FieldList.tsx         # フィールド一覧表示
        └── FieldForm.tsx         # フィールド作成/編集フォーム
```

**削除されたファイル:**
```
frontend/src/
└── store/
    └── index.ts                  # Redux store（不要のため削除）
```

**修正されたファイル:**
- `frontend/src/main.tsx`: Redux Provider 削除、StrictMode 削除
- `frontend/src/App.tsx`: Redux imports 削除、lazy loading 追加、Button navigation 修正
- `frontend/package.json`: バージョン修正（exact versions）

#### 発生した問題と解決策

**問題 1: ThemeProvider エラー**
- **エラー**: "Element type is invalid ... ThemeProvider3"
- **原因**: React 19.2.0 + MUI v7.3.5 の互換性問題
- **解決**: React 19.1.1 + MUI 7.3.2 へダウングレード
- **コミット**: `8767559`

**問題 2: Redux Store エラー**
- **エラー**: "Store does not have a valid reducer"
- **原因**: Redux Toolkit が空の reducer を許可しない
- **解決**: Redux を完全削除
- **コミット**: `b4d479c`

**問題 3: 無限ローディングスピナー**
- **エラー**: `/settings/schema` ページでスピナーが永続表示
- **原因**: token が空の場合に `loading` が `true` のまま
- **解決**: `useSchema` フックで token チェックを追加し、適切なエラーメッセージを表示
- **コミット**: `1b91e1b`

**問題 4: StrictMode による二重レンダリング**
- **エラー**: MUI コンポーネントの警告・エラー
- **原因**: React 19 の StrictMode が MUI v7 と完全互換でない
- **解決**: StrictMode を一時的に無効化
- **コミット**: `0d0aeeb`

**問題 5: Button component prop**
- **エラー**: `component={Link}` が React 19 で動作しない
- **原因**: React 19 の変更により、一部の prop が非推奨
- **解決**: `useNavigate` フックを使用したナビゲーションに変更
- **コミット**: `3a386e6`

#### 実装プロセスへの影響

**Day 4: フロントエンド基盤** のセットアップ手順に以下が追加されました:

```bash
# フロントエンドセットアップ（修正版）
cd frontend

# 1. package.json のバージョンを確認
#    React: 19.1.1 (exact, ^ なし)
#    MUI: 7.3.2 (exact, ^ なし)

# 2. クリーンインストール
rm -rf node_modules package-lock.json
npm install

# 3. 開発サーバー起動
npm run dev

# 4. ブラウザで動作確認
# http://localhost:5173 でアプリが表示されることを確認
# ThemeProvider エラーが出ないことを確認
```

#### 全コミット履歴

| コミットハッシュ | 説明 |
|---------------|------|
| `a49038f` | fix(frontend): Add lazy loading for SchemaSettings component |
| `3a386e6` | fix(frontend): Replace Button component prop with useNavigate hook |
| `0d0aeeb` | fix(frontend): Remove React.StrictMode to resolve ThemeProvider error |
| `8767559` | fix(frontend): Downgrade to stable React 19.1.1 and MUI 7.3.2 |
| `1b91e1b` | fix(frontend): Fix infinite loading spinner when auth token is missing |
| `b4d479c` | fix(frontend): Remove Redux store to resolve empty reducer error |

#### 影響を受けるセクション

**前提条件セクション**:
- 厳密なバージョン要件を明記
- exact versions の重要性を強調
- アーキテクチャの変更（Redux 削除、StrictMode 無効化）を説明

**トラブルシューティングセクション**:
- React 19.x + MUI v7 互換性問題の詳細を追加
- 5つの問題とその解決策を文書化
- 再現可能な手順と回避策を提供

**Day 4: フロントエンド基盤セクション**:
- クリーンインストール手順を追加
- バージョン確認ステップを追加
- ThemeProvider エラーの確認ポイントを追加

#### 将来の考慮事項

**バージョンアップの方針:**
- React 19.2.x 以降へのアップグレードは慎重に検討
- MUI の React 19 完全サポートを待つ
- アップグレード前に必ずローカル環境で検証

**React.StrictMode の再有効化:**
- MUI v7 が React 19 を完全サポートしたタイミングで検討
- 再有効化前に全コンポーネントのテストを実施

**Redux の再導入:**
- Phase 3 以降でグローバルステート管理が必要になった場合に検討
- 現時点では YAGNI 原則に従い導入しない

#### 参考情報

- **詳細な実装計画**: [phase-2-implementation-plan.md v1.0.1 セクション](./phase-2-implementation-plan.md#-更新履歴)
- **デバッグ所要時間**: 約5時間
- **検証環境**: Node.js 24.11.1, npm 10.9.0

---

**作成者**: Claude
**最終更新**: 2025-11-19
**バージョン**: 1.0.1
