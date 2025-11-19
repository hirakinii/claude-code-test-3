# プロジェクト憲法 (CLAUDE.md)

## プロジェクト概要

このプロジェクトは**仕様書作成・管理を支援する Web アプリケーション**を開発します。

ユーザーが効率的に仕様書を作成、編集、管理し、チーム間での共有や変更履歴の追跡を可能にするプラットフォームを提供します。

---

## 開発原則

### 1. セキュリティファースト
- 全ての機能実装前にセキュリティ検証を実施
- OWASP Top 10 の脆弱性に対する対策を必須とする
- 定期的なセキュリティ監査を実施

### 2. スケーラビリティ設計
- **1万ユーザー同時接続**を想定した設計
- 水平スケーリングが可能なアーキテクチャ
- パフォーマンステストを定期的に実施

### 3. 監査可能性
- 全ての変更をログ記録し、追跡可能にする
- データベースの変更履歴を記録
- ユーザーアクションの監査ログを保持

### 4. テスト駆動開発 (TDD)
- 早い段階でのエラー検知
- 開発の効率化、負担軽減
- カバレッジ目標: 80% 以上

---

## 技術スタック

### Backend
- **Node.js** + **TypeScript** + **Express**
- API設計: RESTful または GraphQL
- 認証: JWT ベース

### Database
- **PostgreSQL** (MySQL は使用禁止)
- ORM: Prisma または TypeORM
- マイグレーション管理を必須とする

### Frontend
- **React** + **TypeScript**
- 状態管理: Redux または Context API
- UI ライブラリ: Material-UI または Tailwind CSS

### ローカル実行環境
- **npm** と **Docker** の両方で実行可能にする
- `docker-compose.yml` を提供
- 環境変数は `.env.example` をテンプレートとして提供

### インフラストラクチャ
- **Google Cloud** (AWS、Azure など他クラウド禁止)
- CI/CD: Cloud Build または GitHub Actions
- コンテナ: Cloud Run または GKE
- データベース: Cloud SQL (PostgreSQL)

---

## プロジェクト構成

```
./
├── CLAUDE.md                # プロジェクト全体の憲法 (このファイル)
├── backend/
│   ├── CLAUDE.md            # バックエンド、API開発専用ルール
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── CLAUDE.md            # フロントエンド、UI/UX開発ガイド
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/
│   ├── CLAUDE.md            # インフラ・デプロイ設定
│   ├── terraform/           # IaC 設定
│   └── docker/              # Docker 設定
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 禁止事項

### 🚫 絶対禁止
1. **APIキーのハードコーディング厳禁**
   - 環境変数または Secret Manager を使用すること
   - コードレビューで必ずチェック

2. **本番環境での直接データベース操作禁止**
   - 必ずマイグレーションスクリプトを使用
   - 緊急時も記録を残すこと

3. **未テストコードのデプロイ禁止**
   - 全ての PR にテストを含めること
   - CI/CD パイプラインでテストが通らない場合はデプロイ不可

4. **技術スタック制限違反**
   - MySQL の使用禁止 (PostgreSQL のみ)
   - Google Cloud 以外のクラウドサービス使用禁止

---

## コーディング規約

### TypeScript
- Strict モードを有効化
- ESLint + Prettier を使用
- 型定義は明示的に行う (any 型の使用は最小限に)

### Git ワークフロー
- ブランチ命名規則: `feature/`, `bugfix/`, `hotfix/`
- コミットメッセージ: [Conventional Commits](https://www.conventionalcommits.org/) に従う
- PR には必ず説明を記載

### コードレビュー
- 全ての変更は PR 経由で行う
- 最低 1 名のレビュー承認が必要
- セキュリティチェックリストを確認

---

## 環境変数管理

### 必須環境変数
```bash
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
PORT=3000

# Frontend
REACT_APP_API_URL=http://localhost:3000
```

### 環境別設定
- **開発環境**: `.env.development`
- **テスト環境**: `.env.test`
- **本番環境**: Secret Manager (ハードコード禁止)

---

## セキュリティチェックリスト

- [ ] 入力値のバリデーション
- [ ] SQL インジェクション対策
- [ ] XSS 対策
- [ ] CSRF トークン実装
- [ ] 認証・認可の実装
- [ ] HTTPS の強制
- [ ] レート制限の実装
- [ ] ログイン試行回数の制限
- [ ] 機密情報のマスキング
- [ ] 依存関係の脆弱性スキャン

---

## テスト戦略

### ユニットテスト
- Jest + Testing Library
- カバレッジ: 80% 以上

### 統合テスト
- API エンドポイントのテスト
- データベース操作のテスト

### E2E テスト
- Playwright または Cypress
- 主要なユーザーフローをカバー

### パフォーマンステスト
- k6 または Apache JMeter
- 1万ユーザー同時接続のシミュレーション

---

## デプロイメント

### ステージング環境
- 自動デプロイ: `develop` ブランチへのマージ時
- テスト実行後にデプロイ

### 本番環境
- 手動承認が必要
- `main` ブランチへのマージ後
- ロールバック手順を事前に確認

---

## ドキュメント

### 必須ドキュメント
- **README.md**: プロジェクトのセットアップ手順
- **API ドキュメント**: Swagger/OpenAPI
- **アーキテクチャ図**: システム設計の概要
- **変更履歴**: CHANGELOG.md

---

## 連絡先・サポート

- **プロジェクトオーナー**: [未設定]
- **技術リード**: [未設定]
- **セキュリティ担当**: [未設定]

---

## 更新履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|-----------|---------|--------|
| 2025-11-19 | 1.0.0 | 初版作成 | Claude |

---

## ライセンス

このプロジェクトのライセンスについては、`LICENSE` ファイルを参照してください。
