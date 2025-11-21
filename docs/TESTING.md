# テスト実行ガイド

このドキュメントでは、仕様書作成支援アプリのテスト実行方法を説明します。

## 目次

1. [テスト環境のセットアップ](#テスト環境のセットアップ)
2. [バックエンドテスト](#バックエンドテスト)
3. [フロントエンドテスト](#フロントエンドテスト)
4. [E2Eテスト](#e2eテスト)
5. [テストカバレッジ](#テストカバレッジ)
6. [トラブルシューティング](#トラブルシューティング)

---

## テスト環境のセットアップ

### 前提条件

- Node.js >= 24.11.1
- npm >= 10.9.0
- PostgreSQL（ローカル環境またはDocker）

### 初回セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd claude-code-test-3

# バックエンドの依存関係をインストール
cd backend
npm install

# フロントエンドの依存関係をインストール
cd ../frontend
npm install

# Playwrightブラウザのインストール
npx playwright install --with-deps
```

### データベースのセットアップ（テスト用）

```bash
cd backend

# テスト用データベースの環境変数を設定
cp .env.example .env.test

# .env.testを編集してテスト用のDATABASE_URLを設定
# 例: DATABASE_URL="postgresql://user:password@localhost:5432/spec_manager_test"

# マイグレーション実行
npm run prisma:migrate:test

# シードデータ投入
npm run prisma:seed:test
```

---

## バックエンドテスト

### ユニットテスト

バックエンドのユニットテストは、サービスやユーティリティ関数の単体テストです。

```bash
cd backend

# 全ユニットテスト実行
npm run test:unit

# 特定のテストファイルを実行
npm run test:unit -- schemaService.test.ts

# watchモードで実行
npm run test:unit -- --watch
```

### 統合テスト

統合テストは、APIエンドポイントとデータベースの統合をテストします。

```bash
cd backend

# 全統合テスト実行
npm run test:integration

# 特定のテストファイルを実行
npm run test:integration -- schema.test.ts
```

### 全バックエンドテスト実行

```bash
cd backend

# ユニットテスト + 統合テスト
npm test
```

### カバレッジレポート

```bash
cd backend

# カバレッジ計測付きでテスト実行
npm run test:coverage

# カバレッジレポートを開く（HTML形式）
open coverage/index.html
```

**目標カバレッジ**: 80%以上

---

## フロントエンドテスト

### コンポーネントテスト

フロントエンドのコンポーネントテストは、React Testing Libraryを使用しています。

```bash
cd frontend

# 全コンポーネントテスト実行
npm test

# watchモードで実行
npm run test:watch

# 特定のテストファイルを実行
npm test -- Login

# UIモードで実行（Vitest UI）
npm run test:watch
```

### カバレッジレポート

```bash
cd frontend

# カバレッジ計測付きでテスト実行
npm run test:coverage

# カバレッジレポートを開く（HTML形式）
open coverage/index.html
```

**目標カバレッジ**: 主要コンポーネント 80%以上

### テストファイルの場所

```
frontend/src/
├── pages/
│   ├── Login/__tests__/
│   │   └── index.test.tsx
│   └── SchemaSettings/__tests__/
│       ├── CategoryList.test.tsx
│       ├── CategoryForm.test.tsx
│       ├── FieldList.test.tsx
│       └── FieldForm.test.tsx
├── components/__tests__/
│   └── ProtectedRoute.test.tsx
└── hooks/__tests__/
    └── useSchema.test.ts
```

---

## E2Eテスト

E2Eテストは、Playwrightを使用してブラウザ上で実際のユーザーフローをテストします。

### 前提条件

E2Eテストを実行する前に、バックエンドとフロントエンドの両方が起動している必要があります。

#### オプション1: 手動で起動

```bash
# ターミナル1: バックエンド起動
cd backend
npm run dev

# ターミナル2: フロントエンド起動
cd frontend
npm run dev
```

#### オプション2: Docker Composeで起動

```bash
# プロジェクトルートで実行
docker-compose up -d
```

### E2Eテスト実行

```bash
cd frontend

# 全E2Eテスト実行（ヘッドレスモード）
npm run test:e2e

# UIモードで実行（デバッグに便利）
npm run test:e2e:ui

# 特定のテストファイルを実行
npx playwright test login.spec.ts

# 特定のブラウザで実行
npx playwright test --project=chromium

# デバッグモードで実行
npx playwright test --debug
```

### E2Eテストファイルの場所

```
frontend/e2e/
├── login.spec.ts              # ログイン機能のテスト
└── schema-settings.spec.ts    # スキーマ設定のテスト
```

### E2Eテストのシナリオ

#### login.spec.ts（10テスト）

- ログインフォームの表示確認
- 管理者アカウントでのログイン成功
- 作成者アカウントでのログイン成功
- 無効なメールアドレスでのエラー
- 無効なパスワードでのエラー
- メールアドレスフォーマットのバリデーション
- 必須フィールドのバリデーション
- パスワード最小文字数のバリデーション
- ローディング状態の確認
- ログイン状態の永続化

#### schema-settings.spec.ts（11テスト）

- スキーマ設定画面の表示確認
- カテゴリアコーディオンの展開/折りたたみ
- カテゴリの新規作成
- カテゴリの編集
- カテゴリの削除
- フィールドの新規作成
- デフォルトスキーマへの復元
- 管理者権限のチェック
- フィールドフォームのバリデーション
- カテゴリ作成のキャンセル

### テストレポート

```bash
# テスト実行後、HTMLレポートを開く
npx playwright show-report
```

---

## テストカバレッジ

### 現在のカバレッジ状況（Phase 2.5 完了時点）

#### バックエンド

| テストタイプ | テスト数 | カバレッジ |
|-------------|---------|-----------|
| ユニットテスト | 45 | 85%+ |
| 統合テスト | 35 | 90%+ |
| **合計** | **80** | **87%** |

#### フロントエンド

| コンポーネント | テスト数 | カバレッジ |
|---------------|---------|-----------|
| Login | 7 | 100% |
| ProtectedRoute | 3 | 87.5% |
| useSchema | 7 | 100% |
| CategoryList | 9 | 90.47% |
| CategoryForm | 10 | 100% |
| FieldList | 9 | 88.46% |
| FieldForm | 14 | 89.65% |
| **合計** | **59** | **85-100%** |

#### E2E

| テストファイル | テスト数 |
|---------------|---------|
| login.spec.ts | 10 |
| schema-settings.spec.ts | 11 |
| **合計** | **21** |

---

## トラブルシューティング

### バックエンドテストが失敗する

#### 問題: データベース接続エラー

```bash
Error: Can't reach database server at `localhost:5432`
```

**解決策**:

1. PostgreSQLが起動していることを確認
2. `.env.test` のDATABASE_URLが正しいことを確認
3. テスト用データベースが作成されていることを確認

```bash
# PostgreSQL起動確認
psql -U postgres -l

# テスト用データベース作成
createdb spec_manager_test
```

#### 問題: シードデータが投入されていない

```bash
Error: No default schema found
```

**解決策**:

```bash
cd backend
npm run prisma:seed:test
```

### フロントエンドテストが失敗する

#### 問題: モジュールが見つからない

```bash
Cannot find module '@testing-library/react'
```

**解決策**:

```bash
cd frontend
npm install
```

#### 問題: JSDOMエラー

```bash
ReferenceError: document is not defined
```

**解決策**:

`vitest.config.ts` で `environment: 'jsdom'` が設定されていることを確認

### E2Eテストが失敗する

#### 問題: タイムアウトエラー

```bash
Error: page.goto: Timeout 30000ms exceeded
```

**解決策**:

1. バックエンドとフロントエンドが起動していることを確認

```bash
# バックエンド
curl http://localhost:3001/health

# フロントエンド
curl http://localhost:5173
```

2. ポート番号が `playwright.config.ts` と一致していることを確認

#### 問題: ブラウザが見つからない

```bash
Error: browserType.launch: Executable doesn't exist
```

**解決策**:

```bash
cd frontend
npx playwright install --with-deps
```

#### 問題: 認証エラー

```bash
Error: Invalid credentials
```

**解決策**:

テスト用ユーザーがデータベースに存在することを確認

```bash
cd backend
npm run prisma:seed
```

**テスト用アカウント**:
- 管理者: `admin@example.com` / `Admin123!`
- 作成者: `creator@example.com` / `Creator123!`

### カバレッジが低い

#### 問題: 目標カバレッジ80%に達しない

**解決策**:

1. 未テストのファイルを確認

```bash
# バックエンド
cd backend
npm run test:coverage

# フロントエンド
cd frontend
npm run test:coverage
```

2. カバレッジレポートを開き、未テストの行を確認

3. 必要に応じて追加のテストケースを作成

---

## CI/CDでのテスト実行

GitHub Actionsでは、以下のワークフローで自動テストが実行されます：

1. **バックエンドテスト**: PR作成時・マージ時に自動実行
2. **フロントエンドテスト**: PR作成時・マージ時に自動実行
3. **E2Eテスト**: PR作成時・マージ時に自動実行

詳細は `.github/workflows/test.yml` を参照してください。

---

## テストのベストプラクティス

### 1. TDD（テスト駆動開発）

機能実装前にテストを書くことで、早期にバグを発見できます。

```
1. テストを書く（RED）
2. 最小限の実装をする（GREEN）
3. リファクタリングする（REFACTOR）
```

### 2. テストの独立性

各テストは独立して実行できるようにし、他のテストに依存しないようにします。

### 3. わかりやすいテスト名

テスト名は、何をテストしているのかが明確にわかるようにします。

```typescript
// Good
test('should login successfully with admin credentials', async () => { ... });

// Bad
test('test1', async () => { ... });
```

### 4. AAA パターン

テストは Arrange（準備）、Act（実行）、Assert（検証）の3段階で書きます。

```typescript
test('should create a new category', async () => {
  // Arrange: テストデータの準備
  const categoryData = { name: 'Test Category', description: 'Test Description' };

  // Act: 実行
  const result = await createCategory(categoryData);

  // Assert: 検証
  expect(result.name).toBe('Test Category');
});
```

---

## 参考資料

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**作成日**: 2025-11-21
**バージョン**: 1.0.0
**最終更新**: 2025-11-21
