# Infrastructure Development Guide

このディレクトリは、仕様書作成支援アプリケーションのインフラストラクチャ設定を含みます。

---

## 開発原則

### 1. Infrastructure as Code (IaC)
- **Terraform 使用必須**
- **全てのインフラをコード化**
- **バージョン管理の徹底**

### 2. 環境分離
- **ステージング環境と本番環境を完全分離**
- **環境ごとに異なる GCP プロジェクトを使用**
- **リソース名に環境名を含める**

### 3. セキュリティファースト
- **最小権限の原則**
- **プライベートネットワークの使用**
- **Secret Manager での機密情報管理**

### 4. コスト最適化
- **不要なリソースの自動削除**
- **適切なリソースサイジング**
- **予算アラートの設定**

---

## Google Cloud プロジェクト情報

### プロジェクト ID
- **開発/ステージング**: `spec-manager-test`
- **本番**: `spec-manager-prod` (将来作成予定)

### リージョン
- **プライマリ**: `asia-northeast1` (東京)
- **バックアップ**: `asia-northeast2` (大阪) ※本番環境のみ

---

## Terraform ルール

### ディレクトリ構造
```
terraform/
├── main.tf                 # メイン設定
├── variables.tf            # 変数定義
├── outputs.tf              # 出力定義
├── versions.tf             # プロバイダーバージョン
├── modules/                # モジュール
│   ├── cloud-run/
│   ├── cloud-sql/
│   ├── secret-manager/
│   └── vpc/
└── environments/           # 環境別設定
    ├── staging/
    │   ├── main.tf
    │   ├── terraform.tfvars.example
    │   └── backend.tf
    └── production/
        ├── main.tf
        ├── terraform.tfvars.example
        └── backend.tf
```

### 基本ルール
1. **モジュール化を徹底**
   - 再利用可能な単位でモジュール化
   - 各モジュールは独立して動作

2. **State ファイル管理**
   - GCS バックエンドを使用
   - State ロックを有効化
   - 環境ごとに異なる State ファイル

3. **変更前に必ず plan を実行**
   ```bash
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

4. **リソース命名規則**
   ```
   {project}-{resource}-{environment}
   例: spec-manager-backend-staging
   ```

---

## Google Cloud リソース

### Cloud Run
- **Backend API デプロイ**
- **Frontend デプロイ**
- **自動スケーリング**: 0-100 インスタンス
- **CPU/メモリ**: 1 vCPU / 2GB RAM

#### 設定例
```hcl
resource "google_cloud_run_service" "backend" {
  name     = "spec-manager-backend-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/backend:latest"

        resources {
          limits = {
            cpu    = "1000m"
            memory = "2Gi"
          }
        }

        env {
          name  = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = "database-url"
              key  = "latest"
            }
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "100"
      }
    }
  }
}
```

### Cloud SQL
- **データベース**: PostgreSQL 16
- **マシンタイプ**: db-f1-micro (ステージング), db-n1-standard-2 (本番)
- **ストレージ**: 10GB〜自動拡張
- **バックアップ**: 毎日自動バックアップ
- **高可用性**: 本番環境のみ有効

#### 設定例
```hcl
resource "google_sql_database_instance" "postgres" {
  name             = "spec-manager-db-${var.environment}"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_size         = 10
    disk_autoresize   = true

    backup_configuration {
      enabled            = true
      start_time         = "03:00"
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
  }
}
```

### Secret Manager
- **機密情報の一元管理**
- **アクセス制御の実装**
- **バージョン管理**

#### 管理対象
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`

#### 設定例
```hcl
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret-${var.environment}"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}
```

### VPC (Virtual Private Cloud)
- **プライベートネットワーク構築**
- **Cloud SQL との接続**
- **ファイアウォールルール設定**

#### 設定例
```hcl
resource "google_compute_network" "vpc" {
  name                    = "spec-manager-vpc-${var.environment}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "spec-manager-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}
```

### IAM (Identity and Access Management)
- **サービスアカウントの作成**
- **最小権限の付与**
- **ロールの適切な設定**

#### サービスアカウント
```hcl
resource "google_service_account" "backend" {
  account_id   = "spec-manager-backend-${var.environment}"
  display_name = "Backend Service Account (${var.environment})"
}

resource "google_project_iam_member" "backend_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_secret" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}
```

---

## Docker 設定

### Backend Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Frontend Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage (Nginx)
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose (ローカル開発環境)
- データベース、Backend、Frontend の統合環境
- ボリュームマウントによるホットリロード
- pgAdmin によるデータベース管理

---

## デプロイメント

### ステージング環境
- **トリガー**: `develop` ブランチへのマージ
- **自動デプロイ**: GitHub Actions
- **承認不要**

#### ワークフロー
1. コードプッシュ
2. テスト実行
3. Docker イメージビルド
4. GCR へプッシュ
5. Cloud Run へデプロイ

### 本番環境
- **トリガー**: `main` ブランチへのマージ後、手動実行
- **デプロイ**: GitHub Actions (手動承認必須)
- **ロールバック手順**: 以前のリビジョンへ切り替え

#### ワークフロー
1. `main` ブランチへマージ
2. 手動で GitHub Actions ワークフロー実行
3. 承認待ち
4. 承認後、デプロイ実行
5. ヘルスチェック確認

### ロールバック手順
```bash
# 以前のリビジョンを確認
gcloud run revisions list --service=spec-manager-backend-prod

# 特定のリビジョンへロールバック
gcloud run services update-traffic spec-manager-backend-prod \
  --to-revisions=spec-manager-backend-prod-00001-abc=100
```

---

## モニタリング・ログ

### Cloud Monitoring
- **アラート設定**
  - CPU使用率 > 80%
  - メモリ使用率 > 80%
  - エラーレート > 5%
  - レスポンスタイム > 3秒

### Cloud Logging
- **ログレベル**: INFO, WARN, ERROR
- **ログ保持期間**: 30日
- **ログエクスポート**: BigQuery (オプション)

### アップタイムチェック
- **エンドポイント**: `/health`
- **間隔**: 1分
- **タイムアウト**: 10秒

---

## セキュリティ

### ファイアウォールルール
- **Ingress**: Cloud Run からのアクセスのみ許可
- **Egress**: 必要最小限のアウトバウンドを許可

### SSL/TLS
- **Cloud Run**: 自動的に HTTPS 対応
- **カスタムドメイン**: Cloud Load Balancing + Managed SSL

### セキュリティスキャン
- **Container Analysis**: 脆弱性スキャン
- **Binary Authorization**: イメージの検証

---

## コスト管理

### 予算設定
```hcl
resource "google_billing_budget" "budget" {
  billing_account = var.billing_account
  display_name    = "spec-manager-budget-${var.environment}"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "JPY"
      units         = "10000"  # 月額10,000円
    }
  }

  threshold_rules {
    threshold_percent = 0.5  # 50%
  }

  threshold_rules {
    threshold_percent = 0.9  # 90%
  }
}
```

### コスト削減施策
1. **Cloud Run のスケールダウン**: 最小インスタンス数を0に
2. **Cloud SQL の自動停止**: 開発環境は夜間停止
3. **ログ保持期間の最適化**: 30日で十分

---

## CI/CD パイプライン

### GitHub Actions
- **CI**: テスト、Lint、ビルド
- **CD**: デプロイ（ステージング自動、本番手動）

### Cloud Build (オプション)
- Google Cloud ネイティブのCI/CD
- GitHub との統合
- Artifact Registry への保存

---

## トラブルシューティング

### Cloud Run が起動しない
```bash
# ログ確認
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# サービス詳細確認
gcloud run services describe spec-manager-backend-staging
```

### Cloud SQL 接続エラー
```bash
# 接続テスト
gcloud sql connect spec-manager-db-staging --user=postgres

# プライベートIP確認
gcloud sql instances describe spec-manager-db-staging
```

### Secret Manager アクセスエラー
```bash
# IAM ロール確認
gcloud projects get-iam-policy spec-manager-test \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*backend*"
```

---

## 環境変数

### Terraform 変数
```hcl
# terraform.tfvars
project_id      = "spec-manager-test"
region          = "asia-northeast1"
environment     = "staging"
db_tier         = "db-f1-micro"
min_instances   = 0
max_instances   = 10
```

---

## 禁止事項

### 🚫 絶対禁止
1. **手動でのリソース作成**: 必ず Terraform を使用
2. **本番環境での直接操作**: 緊急時も記録を残す
3. **パブリック IP の使用**: プライベートネットワークを使用
4. **ルートアカウントの使用**: サービスアカウントを使用
5. **機密情報のハードコーディング**: Secret Manager を使用

---

## 運用チェックリスト

### デプロイ前
- [ ] Terraform plan を実行し、変更内容を確認
- [ ] テストが全て通過
- [ ] セキュリティスキャン実施
- [ ] バックアップ確認

### デプロイ後
- [ ] ヘルスチェック確認
- [ ] ログ確認（エラーなし）
- [ ] モニタリングダッシュボード確認
- [ ] 主要機能の動作確認

---

## 参考資料

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

---

**更新日**: 2025-11-19
**バージョン**: 1.0.0
