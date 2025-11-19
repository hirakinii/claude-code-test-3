# Phase 0: プロジェクト基盤構築 - 実装詳細

**作成日**: 2025-11-19
**バージョン**: 1.0.0
**ステータス**: 完了

---

## 📋 概要

Phase 0 では、プロジェクト全体の基盤となるディレクトリ構造、開発環境、CI/CDパイプライン、Linter/Formatterの設定を完了しました。

---

## ✅ 完了タスク

### 1. プロジェクト構造作成
- ✅ `backend/` ディレクトリ構造
- ✅ `frontend/` ディレクトリ構造
- ✅ `infrastructure/` ディレクトリ構造
- ✅ `.github/workflows/` (CI/CD)

### 2. 開発ガイド配置
- ✅ `backend/CLAUDE.md` - バックエンド開発ガイド
- ✅ `frontend/CLAUDE.md` - フロントエンド開発ガイド
- ✅ `infrastructure/CLAUDE.md` - インフラ開発ガイド

### 3. パッケージ管理設定
- ✅ `package.json` (root) - npm workspaces 設定
- ✅ `backend/package.json` - Backend 依存関係
- ✅ `frontend/package.json` - Frontend 依存関係

### 4. TypeScript 設定
- ✅ `backend/tsconfig.json` - Backend TypeScript 設定
- ✅ `frontend/tsconfig.json` - Frontend TypeScript 設定
- ✅ `frontend/tsconfig.node.json` - Vite 設定用
- ✅ `backend/jest.config.js` - Backend テスト設定
- ✅ `frontend/jest.config.js` - Frontend テスト設定

### 5. Docker 環境設定
- ✅ `docker-compose.yml` - 統合開発環境
- ✅ `.env.example` - 環境変数テンプレート
- ✅ `backend/Dockerfile` - Backend コンテナ
- ✅ `frontend/Dockerfile` - Frontend コンテナ
- ✅ `frontend/nginx.conf` - Nginx 設定
- ✅ `infrastructure/docker/postgres/init.sql` - PostgreSQL 初期化スクリプト

### 6. Linter/Formatter 設定
- ✅ `.prettierrc` - Prettier 設定
- ✅ `.prettierignore` - Prettier 除外設定
- ✅ `backend/.eslintrc.js` - Backend ESLint 設定
- ✅ `frontend/.eslintrc.js` - Frontend ESLint 設定

### 7. Git Hooks 設定
- ✅ `commitlint.config.js` - コミットメッセージ検証
- ✅ `.husky/pre-commit` - コミット前 Lint 実行
- ✅ `.husky/commit-msg` - コミットメッセージ検証

### 8. CI/CD パイプライン
- ✅ `.github/workflows/ci.yml` - 継続的インテグレーション
- ✅ `.github/workflows/cd-staging.yml` - ステージング自動デプロイ
- ✅ `.github/workflows/cd-production.yml` - 本番手動デプロイ

### 9. 基本エントリーポイントファイル
**Backend:**
- ✅ `backend/src/index.ts` - アプリケーションエントリーポイント
- ✅ `backend/src/server.ts` - Express サーバー設定
- ✅ `backend/src/routes/health.ts` - ヘルスチェックエンドポイント
- ✅ `backend/src/utils/logger.ts` - ログユーティリティ
- ✅ `backend/src/middleware/errorHandler.ts` - エラーハンドリング
- ✅ `backend/tests/setup.ts` - テストセットアップ

**Frontend:**
- ✅ `frontend/index.html` - HTML テンプレート
- ✅ `frontend/vite.config.ts` - Vite 設定
- ✅ `frontend/src/main.tsx` - アプリケーションエントリーポイント
- ✅ `frontend/src/App.tsx` - ルートコンポーネント
- ✅ `frontend/src/store/index.ts` - Redux ストア
- ✅ `frontend/src/styles/theme.ts` - Material-UI テーマ
- ✅ `frontend/src/vite-env.d.ts` - Vite 型定義
- ✅ `frontend/tests/setup.ts` - テストセットアップ

---

## 📁 最終的なプロジェクト構造

```
claude-code-test-3/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-staging.yml
│       └── cd-production.yml
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   └── health.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── utils/
│   │   │   └── logger.ts
│   │   ├── types/
│   │   ├── index.ts
│   │   └── server.ts
│   ├── prisma/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── fixtures/
│   │   └── setup.ts
│   ├── .dockerignore
│   ├── .eslintrc.js
│   ├── CLAUDE.md
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── wizard/
│   │   │   ├── dashboard/
│   │   │   └── schema/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   │   └── index.ts
│   │   ├── types/
│   │   ├── utils/
│   │   ├── styles/
│   │   │   └── theme.ts
│   │   ├── config/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/
│   │   └── index.html
│   ├── tests/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── e2e/
│   │   └── setup.ts
│   ├── .dockerignore
│   ├── .eslintrc.js
│   ├── CLAUDE.md
│   ├── Dockerfile
│   ├── index.html
│   ├── jest.config.js
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── infrastructure/
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── cloud-run/
│   │   │   ├── cloud-sql/
│   │   │   ├── secret-manager/
│   │   │   └── vpc/
│   │   └── environments/
│   │       ├── staging/
│   │       └── production/
│   ├── docker/
│   │   ├── backend/
│   │   ├── frontend/
│   │   ├── postgres/
│   │   │   └── init.sql
│   │   └── nginx/
│   ├── k8s/
│   └── CLAUDE.md
├── docs/
│   ├── plan/
│   │   ├── implementation-plan.md
│   │   └── phase-0-implementation-details.md
│   └── spec/
├── .env.example
├── .gitignore
├── .prettierrc
├── .prettierignore
├── CLAUDE.md
├── commitlint.config.js
├── docker-compose.yml
├── LICENSE
├── package.json
└── README.md
```

---

## 🛠 技術選定

### パッケージマネージャー
- **npm** ✅

### Backend
- **Node.js** 18.x
- **TypeScript** 5.3.3
- **Express** 4.18.2
- **Prisma** 5.8.0
- **Winston** (ログ)
- **Jest** (テスト)

### Frontend
- **React** 18.2.0
- **TypeScript** 5.3.3
- **Vite** 5.0.10
- **Material-UI** 5.15.3
- **Redux Toolkit** 2.0.1
- **Jest** + **Playwright** (テスト)

### Infrastructure
- **Docker** + **Docker Compose**
- **PostgreSQL** 16
- **Google Cloud Platform**
  - **Cloud Run** (Backend/Frontend)
  - **Cloud SQL** (PostgreSQL)
  - **Secret Manager**
  - **Artifact Registry**

### DevOps
- **GitHub Actions** (CI/CD)
- **ESLint** + **Prettier** (Linter/Formatter)
- **Husky** + **lint-staged** (Git Hooks)
- **commitlint** (コミットメッセージ検証)

---

## 🚀 次のステップ (Phase 1)

### データベース設計
1. Prisma スキーマ定義
2. マイグレーションファイル作成
3. シードデータ作成

### 認証・認可実装
1. JWT認証実装
2. ユーザー登録・ログイン機能
3. RBAC実装

### 基本UI実装
1. ログイン画面
2. ダッシュボード
3. 共通コンポーネント

---

## 📝 注意事項

### 開発環境セットアップ手順

#### 1. 環境変数設定
```bash
cp .env.example .env
# .env ファイルを編集
```

#### 2. 依存関係インストール
```bash
npm install
```

#### 3. Docker 環境起動
```bash
docker-compose up -d
```

#### 4. ローカル npm 開発
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### CI/CD 設定

#### GitHub Secrets 設定が必要
- `GCP_SA_KEY_STAGING` - ステージング環境サービスアカウントキー
- `GCP_SA_KEY_PRODUCTION` - 本番環境サービスアカウントキー (将来)
- `GCP_PROJECT_NUMBER` - GCP プロジェクト番号 (ステージング)
- `GCP_PROJECT_NUMBER_PROD` - GCP プロジェクト番号 (本番/将来)

#### GCP リソース作成が必要
- Artifact Registry リポジトリ (`spec-manager`)
- サービスアカウント (適切な権限付与)
- Cloud Run サービス (初回は手動作成)

---

## ✅ 完了基準

Phase 0 は以下の条件を全て満たしています:

- [x] プロジェクト構造が完成
- [x] Docker Compose で環境が起動できる
- [x] Linter/Formatter が動作する
- [x] Git hooks が動作する
- [x] CI ワークフローが動作する
- [x] 各ディレクトリに適切な CLAUDE.md が配置されている
- [x] 基本的なエントリーポイントファイルが実装されている

---

## 📝 Phase 0 完了後の改善（2025-11-19）

Phase 0 完了後、Node.js のサポート終了（EOL）対応と環境構築の改善を実施しました。

### Node.js バージョンアップグレード

#### 背景
Node.js 18.x が EOL（End of Life）を迎えるため、Active LTS である Node.js 24.11.1 にアップグレードしました。

#### 実施内容

**1. バージョン管理ファイルの作成**
- `.nvmrc`: NVM用バージョン指定（24.11.1）
- `.node-version`: asdf等のツール用バージョン指定（24.11.1）

**2. package.json の engines フィールド更新**
- ルート `package.json`: `"node": ">=24.11.1", "npm": ">=10.9.0"`
- `backend/package.json`: `"node": ">=24.11.1", "npm": ">=10.9.0"`
- `frontend/package.json`: `"node": ">=24.11.1", "npm": ">=10.9.0"`

**3. Dockerfile の更新**
- Backend Dockerfile: `node:18-alpine` → `node:24.11.1-alpine`（3箇所：development, builder, production）
- Frontend Dockerfile: `node:18-alpine` → `node:24.11.1-alpine`（2箇所：development, builder）

**4. CI/CD の更新**
- `.github/workflows/ci.yml`: `NODE_VERSION: '24.11.1'`

**5. ドキュメント更新**
- `README.md`: セットアップ手順とNode.jsバージョン要件を更新
- `infrastructure/CLAUDE.md`: Dockerfileの推奨ベースイメージを更新

#### 互換性確認
主要パッケージのNode.js 24.11.1 互換性を確認:
- Prisma 5.8.0: ✅ 互換性あり
- TypeScript 5.3.3: ✅ 互換性あり
- Express 4.18.2: ✅ 互換性あり
- bcrypt 5.1.1: ✅ 互換性あり（ネイティブモジュール、Node.js 24対応）

### 環境変数管理の改善

#### backend/.env.example の作成
開発環境用の環境変数テンプレートを作成し、以下の設定を網羅:
- Database Configuration（ローカル/Docker両対応）
- Server Configuration
- JWT Configuration
- Session Configuration
- CORS Configuration
- Rate Limiting
- Security Configuration
- Export Configuration
- Logging Configuration
- Feature Flags

#### backend/.env.test の作成
テスト環境専用の環境変数ファイルを作成し、リポジトリに含めることで以下を実現:
- テスト実行時の環境変数自動読み込み（`backend/tests/setup.ts`で設定）
- テスト用PostgreSQLデータベース（spec_management_test）への接続設定
- テスト環境に最適化された設定値（例: `BCRYPT_SALT_ROUNDS=4`, `LOG_LEVEL=error`）
- セキュリティ上安全なテスト専用シークレット値

#### .gitignore の更新
```gitignore
# Do NOT ignore example and test env files
!.env.example
!.env.test
```

### Docker 構成の改善

#### docker-compose.yml の更新
**1. 非推奨フィールドの削除**
- `version: '3.9'` を削除（Docker Compose v2では不要）

**2. サービス名の変更**
- `db` → `postgres`（より明確なサービス名）
- 全サービスの `depends_on` を更新

**3. 環境変数の修正**
- DATABASE_URL のホスト名を `@db:` → `@postgres:` に統一

#### infrastructure/docker/postgres/init.sql の更新
テストデータベースの自動作成を追加:
```sql
CREATE DATABASE spec_management_test
    WITH
    OWNER = spec_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_TYPE = 'C'
    TEMPLATE = template0;
GRANT ALL PRIVILEGES ON DATABASE spec_management_test TO spec_user;
```

### クロスプラットフォーム対応の改善

#### Husky インストールスクリプトの修正
Windows環境でのエラー回避のため、prepare スクリプトを変更:

**変更前**:
```json
"prepare": "husky install"
```

**変更後**:
```json
"prepare": "node -e \"try { require('husky').install() } catch (e) {}\""
```

これにより、Windows/Linux/macOS すべてで動作するようになりました。

### Prisma セットアップの改善

#### backend/package.json の更新
Prisma Client の自動生成を実現:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

これにより、`npm install` 実行時に自動的に Prisma Client が生成されます。

#### tsconfig-paths の追加
TypeScript パスマッピング（`@/*`エイリアス）の実行時解決のため、tsconfig-paths を追加:
```json
{
  "devDependencies": {
    "tsconfig-paths": "^4.2.0"
  }
}
```

### レート制限戦略の改善

#### テスト環境での緩和設定
テスト実行時にレート制限エラー（429）を回避しつつ、レート制限機能のテストも可能にするため、環境別の設定を実装:

**backend/src/middleware/rateLimiter.ts の更新**:
- **テスト環境**: generalLimiter（1秒/1000リクエスト）、authLimiter（1秒/100リクエスト）
- **本番環境**: generalLimiter（15分/100リクエスト）、authLimiter（15分/5リクエスト）

**backend/tests/integration/middleware/rateLimiter.test.ts の更新**:
- 環境別の期待値を検証するテストに修正

この設計により、以下を両立:
1. テスト実行時に429エラーが発生しない（緩い制限）
2. レート制限機能自体のテストが可能（完全無効化ではない）
3. 本番環境ではセキュリティを確保（厳格な制限）

### 影響範囲まとめ

#### 更新ファイル一覧
**新規作成**:
- `.nvmrc`
- `.node-version`
- `backend/.env.example`
- `backend/.env.test`

**更新**:
- `package.json`（root）
- `backend/package.json`
- `frontend/package.json`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `.github/workflows/ci.yml`
- `docker-compose.yml`
- `infrastructure/docker/postgres/init.sql`
- `.gitignore`
- `backend/tests/setup.ts`
- `backend/src/middleware/rateLimiter.ts`
- `backend/tests/integration/middleware/rateLimiter.test.ts`
- `README.md`
- `infrastructure/CLAUDE.md`

#### テスト結果
全てのテストが成功することを確認:
```bash
npm run test:backend
# 全テストパス（rateLimiter, auth, health等）
```

#### 技術的な意思決定
1. **既存パッケージバージョンの維持**: Prisma 5.8.0、bcrypt 5.1.1等は互換性があるため、破壊的変更を避けるためバージョン固定
2. **条件分岐による環境別設定**: `process.env.NODE_ENV === 'test'` による条件分岐でレート制限を制御（skip関数ではなく）
3. **.env.test のリポジトリ管理**: テスト用の安全なデフォルト値のため、リポジトリにコミット
4. **チーム全体でのNode.jsバージョン統一**: .nvmrc と .node-version の両方を提供

---

**担当者**: Claude
**レビュアー**: Repository Owner
**承認日**: 2025-11-19
**改善実施日**: 2025-11-19
