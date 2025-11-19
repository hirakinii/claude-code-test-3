# 仕様書作成・管理 Web アプリケーション

このプロジェクトは、ユーザーが効率的に仕様書を作成、編集、管理し、チーム間での共有や変更履歴の追跡を可能にする Web アプリケーションです。

## 目次

- [技術スタック](#技術スタック)
- [前提条件](#前提条件)
- [セットアップ](#セットアップ)
  - [npm を使用する場合](#npm-を使用する場合)
  - [Docker を使用する場合](#docker-を使用する場合)
- [開発](#開発)
- [テスト](#テスト)
- [デプロイ](#デプロイ)
- [プロジェクト構成](#プロジェクト構成)
- [コントリビューション](#コントリビューション)
- [ライセンス](#ライセンス)

## 技術スタック

### Backend
- **Node.js** + **TypeScript** + **Express**
- **PostgreSQL** (ORM: Prisma または TypeORM)
- JWT ベースの認証

### Frontend
- **React** + **TypeScript**
- 状態管理: Redux または Context API
- UI ライブラリ: Material-UI または Tailwind CSS

### Infrastructure
- **Google Cloud**
  - Cloud Run または GKE (コンテナ実行)
  - Cloud SQL (PostgreSQL)
  - Secret Manager (機密情報管理)
- **Docker** (ローカル開発・本番環境)

## 前提条件

### npm を使用する場合
- **Node.js**: v24.11.1 以上
- **npm**: v10.9.0 以上
- **PostgreSQL**: v14.x 以上

### Docker を使用する場合
- **Docker**: v24.x 以上
- **Docker Compose**: v2.x 以上

## セットアップ

### npm を使用する場合

#### 1. リポジトリのクローン
```bash
git clone https://github.com/your-org/spec-management-app.git
cd spec-management-app
```

#### 2. 環境変数の設定
```bash
# プロジェクトルートに .env ファイルを作成
cp .env.example .env

# .env ファイルを編集して必要な値を設定
# DATABASE_URL, JWT_SECRET など
```

#### 3. PostgreSQL のセットアップ
```bash
# PostgreSQL サービスが起動していることを確認
# データベースを作成
createdb spec_management_db
```

#### 4. Backend のセットアップ
```bash
cd backend
npm install
npm run migrate  # データベースマイグレーション
npm run seed     # 初期データ投入（オプション）
```

#### 5. Frontend のセットアップ
```bash
cd frontend
npm install
```

#### 6. アプリケーションの起動
```bash
# Backend (別ターミナル)
cd backend
npm run dev

# Frontend (別ターミナル)
cd frontend
npm start
```

アプリケーションが起動したら、ブラウザで http://localhost:3000 にアクセスしてください。

### Docker を使用する場合

#### 1. リポジトリのクローン
```bash
git clone https://github.com/your-org/spec-management-app.git
cd spec-management-app
```

#### 2. 環境変数の設定
```bash
cp .env.example .env
# .env ファイルを編集して必要な値を設定
```

#### 3. Docker Compose で起動
```bash
docker-compose up -d
```

#### 4. データベースマイグレーション
```bash
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed  # 初期データ投入（オプション）
```

アプリケーションが起動したら、ブラウザで http://localhost:3000 にアクセスしてください。

#### Docker Compose の管理コマンド
```bash
# コンテナの停止
docker-compose down

# ログの確認
docker-compose logs -f

# 特定のサービスのログ確認
docker-compose logs -f backend
docker-compose logs -f frontend

# コンテナの再ビルド
docker-compose build

# データベースを含む完全なリセット
docker-compose down -v
docker-compose up -d
```

## 開発

### ディレクトリ構造
```
./
├── CLAUDE.md                # プロジェクト憲法
├── README.md                # このファイル
├── backend/                 # Backend アプリケーション
│   ├── CLAUDE.md
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Frontend アプリケーション
│   ├── CLAUDE.md
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/          # インフラストラクチャ設定
│   ├── CLAUDE.md
│   ├── terraform/
│   └── docker/
├── docker-compose.yml
└── .env.example
```

### コーディング規約
- **TypeScript Strict モード**: 有効化必須
- **Linter**: ESLint
- **Formatter**: Prettier
- **コミットメッセージ**: [Conventional Commits](https://www.conventionalcommits.org/) 形式

### Git ワークフロー
```bash
# 新しいブランチを作成
git checkout -b feature/your-feature-name

# コミット
git add .
git commit -m "feat: add user authentication"

# プッシュ
git push origin feature/your-feature-name

# Pull Request を作成
```

### ブランチ命名規則
- `feature/` - 新機能
- `bugfix/` - バグ修正
- `hotfix/` - 緊急修正
- `refactor/` - リファクタリング

## テスト

### Backend テスト
```bash
cd backend

# ユニットテスト
npm test

# カバレッジ付きテスト
npm run test:coverage

# 統合テスト
npm run test:integration

# テストウォッチモード
npm run test:watch
```

### Frontend テスト
```bash
cd frontend

# ユニットテスト
npm test

# カバレッジ付きテスト
npm run test:coverage

# E2E テスト
npm run test:e2e
```

### テスト基準
- **カバレッジ目標**: 80% 以上
- **全ての PR**: テストが通ること必須
- **CI/CD**: 自動テスト実行

## デプロイ

### ステージング環境
- **自動デプロイ**: `develop` ブランチへのマージ時
- **URL**: https://staging.your-app.com

### 本番環境
- **デプロイ**: `main` ブランチへのマージ後、手動承認が必要
- **URL**: https://your-app.com

### デプロイ手順
```bash
# ステージング環境
git checkout develop
git merge feature/your-feature
git push origin develop

# 本番環境（慎重に実行）
git checkout main
git merge develop
git push origin main
# GitHub Actions または Cloud Build で承認・デプロイ
```

## プロジェクト構成

詳細なプロジェクト構成、開発原則、技術スタック制限については、[CLAUDE.md](./CLAUDE.md) を参照してください。

### 主要な開発原則
1. **セキュリティファースト**: 全機能実装前にセキュリティ検証
2. **スケーラビリティ設計**: 1万ユーザー同時接続を想定
3. **監査可能性**: 全変更をログ記録
4. **テスト駆動**: 早期エラー検知、開発効率化

### 禁止事項
- APIキーのハードコーディング厳禁
- 本番環境での直接データベース操作禁止
- 未テストコードのデプロイ禁止
- MySQL の使用禁止（PostgreSQL のみ）
- Google Cloud 以外のクラウド使用禁止

## トラブルシューティング

### ポートがすでに使用されている
```bash
# プロセスを確認
lsof -i :3000
lsof -i :5432

# プロセスを終了
kill -9 <PID>
```

### データベース接続エラー
```bash
# PostgreSQL サービスの状態確認
sudo systemctl status postgresql

# PostgreSQL サービスの起動
sudo systemctl start postgresql
```

### Docker のディスク容量エラー
```bash
# 未使用の Docker リソースを削除
docker system prune -a
```

## コントリビューション

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

### コードレビュー
- 全ての変更は PR 経由で行う
- 最低 1 名のレビュー承認が必要
- セキュリティチェックリストを確認

## ライセンス

このプロジェクトのライセンスについては、[LICENSE](./LICENSE) ファイルを参照してください。

## サポート

- **Issue Tracker**: https://github.com/your-org/spec-management-app/issues
- **ドキュメント**: https://docs.your-app.com
- **API ドキュメント**: https://api.your-app.com/docs

---

© 2025 Your Organization. All rights reserved.
