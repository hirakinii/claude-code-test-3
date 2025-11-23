# 仕様書作成支援アプリ 実装計画書

* **作成日**: 2025-11-19
* **バージョン**: 1.7.0
* **ステータス**: Phase 4 完了
* **最終更新**: 2025-11-23

---

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック（確定版）](#技術スタック確定版)
3. [技術選定の評価結果](#技術選定の評価結果)
4. [実装フェーズ](#実装フェーズ)
5. [開発方針](#開発方針)
6. [見積もり](#見積もり)
7. [次のステップ](#次のステップ)

---

## プロジェクト概要

### アプリケーション概要

仕様書作成・管理を支援する Web アプリケーション。ユーザーが効率的に仕様書を作成、編集、管理し、チーム間での共有や変更履歴の追跡を可能にするプラットフォームを提供します。

### アーキテクチャの特徴

本アプリケーションは**メタモデル・アーキテクチャ**を採用します。これにより、管理者がウィザードの項目を動的に変更可能となります。

- **スキーマ（定義）層**: 管理者が管理する仕様書の「型」や「テンプレート」を定義（Schema, Schema_Category, Schema_Field）
- **インスタンス（データ）層**: 作成者が入力する個々の仕様書の「値」を格納（Specification, Specification_Content）

### コア機能

1. **動的ウィザード**: スキーマ定義に基づいて自動生成される入力フォーム
2. **ローカル自動保存**: データ消失防止のための自動保存機能
3. **RBAC**: ロールベースアクセス制御（仕様書作成者/仕様書管理者）
4. **エクスポート**: PDF/Word/Markdown形式での仕様書出力
5. **バージョン管理**: 必須項目の入力状況に応じたメジャー/マイナーバージョン管理

---

## 技術スタック（確定版）

### Backend
- **言語・フレームワーク**: Node.js + TypeScript + Express
- **ORM**: **Prisma** ✅
  - 理由: 型安全性、マイグレーション管理の優秀さ
- **データベース**: PostgreSQL（MySQL使用禁止）
- **認証**: JWT（OAuth2.0は次マイルストーン）

### Frontend
- **言語・フレームワーク**: React + TypeScript
- **状態管理**: Redux または Context API
- **UI ライブラリ**: **Material-UI** ✅
- **テストフレームワーク**: React Testing Library

### エクスポート機能
- **PDF生成**: **Puppeteer** ✅（Chrome Headless）
- **Word生成**: **docx** ✅（評価結果は次セクション参照）
- **Markdown生成**: カスタム実装

### インフラストラクチャ
- **クラウドプラットフォーム**: Google Cloud（他クラウド使用禁止）
- **コンテナ実行**: **Cloud Run** ✅
- **データベース**: Cloud SQL (PostgreSQL)
- **機密情報管理**: Secret Manager
- **CI/CD**: GitHub Actions または Cloud Build
- **環境**: 本番 + ステージング ✅

### ローカル開発環境
- **npm** と **Docker** の両方で実行可能
- Docker Compose を使用した統合環境

---

## 技術選定の評価結果

### Word生成ライブラリの評価

#### **officegen**
| 評価項目 | 評価 | 理由 |
|---------|------|------|
| 日本語対応 | ⭐⭐ (2/5) | 日本語対応の具体的な情報が不明確。実績も見つからず |
| メンテナンス継続性 | ⭐ (1/5) | **過去12ヶ月間新バージョンのリリースなし**。事実上の開発停止状態 |
| 開発元の将来性 | ⭐ (1/5) | discontinued project の可能性が高い |
| **総合点** | **4/15** | |

#### **docx** ✅ **採用決定**
| 評価項目 | 評価 | 理由 |
|---------|------|------|
| 日本語対応 | ⭐⭐⭐⭐⭐ (5/5) | **`eastAsia`フォントパラメータを明示的にサポート**。日本語レジュメ生成の実績あり |
| メンテナンス継続性 | ⭐⭐⭐⭐⭐ (5/5) | **2025年に複数リリース**（v9.1.1〜v9.5.1）。活発な開発が継続中 |
| 開発元の将来性 | ⭐⭐⭐⭐⭐ (5/5) | 週間36万ダウンロード、5.1K stars、122名のコントリビューター。強固なコミュニティ |
| **総合点** | **15/15** | |

**選定理由**:
- 日本語（東アジア言語）への明示的なサポート
- 活発なメンテナンスと強固なコミュニティ
- 長期的な安定性が期待できる

---

## 実装フェーズ

### **Phase 0: プロジェクト基盤構築** (1-2日)

**目的**: 開発環境のセットアップと基本的なプロジェクト構造の構築

- [x] ドキュメント整備済み
- [x] プロジェクト構造作成
  - `backend/` ディレクトリとサブディレクトリ構築
  - `frontend/` ディレクトリとサブディレクトリ構築
  - `infrastructure/` ディレクトリとサブディレクトリ構築
  - 各ディレクトリに `CLAUDE.md` を配置
- [x] 開発環境セットアップ
  - `docker-compose.yml` 作成（PostgreSQL, Backend, Frontend）
  - `.env.example` 作成（環境変数テンプレート）
  - npm 開発環境セットアップスクリプト
- [x] CI/CD基本設定
  - GitHub Actions ワークフロー作成
  - ビルド・テスト自動化
  - デプロイパイプライン（ステージング/本番）
- [x] Linter/Formatter設定
  - ESLint設定（backend/frontend）
  - Prettier設定
  - Git hooks（pre-commit）

---

### **Phase 1: バックエンド基盤** (3-5日)

**目的**: データベース設計、認証・認可基盤、基本APIフレームワークの構築

#### **1.1 データベース設計実装**

**テスト仕様（TDD）**:
- スキーマ層テーブル（Schema, Schema_Category, Schema_Field）の作成確認
- インスタンス層テーブル（Specification, Specification_Content, User等）の作成確認
- 外部キー制約の検証
- デフォルトスキーマのシードデータ投入確認

**実装内容**:
- [x] Prisma初期化とスキーマ定義
- [x] マイグレーション作成（スキーマ層）
  - `Schema` テーブル
  - `Schema_Category` テーブル
  - `Schema_Field` テーブル（data_type ENUM定義含む）
- [x] マイグレーション作成（インスタンス層）
  - `User` テーブル
  - `Role` テーブル
  - `User_Role` テーブル（中間テーブル）
  - `Specification` テーブル
  - `Specification_Content` テーブル（EAVパターン）
  - `Deliverable` テーブル
  - `Contractor_Requirement` テーブル
  - `Basic_Business_Requirement` テーブル
  - `Business_Task` テーブル
- [x] シードデータ作成
  - デフォルトスキーマ（ステップ1〜6の定義）
  - テストユーザー（管理者/作成者）
  - ロールデータ

#### **1.2 認証・認可基盤**

**テスト仕様（TDD）**:
- JWT トークン生成・検証のユニットテスト
- ログイン成功/失敗シナリオテスト
- パスワードハッシュ化の検証
- RBAC: Creator/Admin ロール検証テスト
- 認証ミドルウェアの統合テスト

**セキュリティチェック**:
- [x] パスワードハッシュ化（bcrypt使用）
- [x] JWT Secret の環境変数管理
- [x] トークン有効期限設定
- [x] CSRF対策の検討

**実装内容**:
- [x] JWT認証実装
  - トークン生成ロジック
  - トークン検証ロジック
  - リフレッシュトークン（オプション）
- [x] RBAC実装
  - Creator/Adminロールの定義
  - ロール検証ロジック
- [x] ミドルウェア作成
  - 認証ミドルウェア（`requireAuth`）
  - ロール検証ミドルウェア（`requireRole`）

#### **1.3 基本APIフレームワーク**

**テスト仕様（TDD）**:
- ヘルスチェックエンドポイントのテスト
- CORS設定の検証
- エラーハンドリングのテスト（400, 401, 403, 404, 500）
- セキュリティヘッダーの検証

**セキュリティチェック**:
- [x] CORS設定の適切性
- [x] レート制限の実装
- [x] セキュリティヘッダー（helmet使用）
- [x] リクエストサイズ制限

**実装内容**:
- [x] Express基本設定
  - CORS設定
  - セキュリティヘッダー（helmet）
  - リクエストボディパーサー
  - レート制限（express-rate-limit）
- [x] エラーハンドリング
  - グローバルエラーハンドラー
  - カスタムエラークラス
  - エラーレスポンス標準化
- [x] ロギング設定
  - Winston または Pino
  - リクエスト/レスポンスログ
  - エラーログ
- [x] ヘルスチェックエンドポイント
  - `GET /health` - アプリケーション状態
  - `GET /health/db` - データベース接続確認

---

### **Phase 2: スキーマ管理機能（管理者向け）** (3-4日)

**目的**: 管理者が仕様書テンプレートを動的に編集できる機能の実装

#### **2.1 スキーマAPI実装**

**テスト仕様（TDD）**:
- スキーマ取得APIのテスト
- カテゴリCRUD操作のテスト
- フィールドCRUD操作のテスト
- デフォルト復元のトランザクションテスト
- 権限チェック（管理者のみアクセス可能）のテスト

**セキュリティチェック**:
- [x] 管理者ロール検証（全エンドポイント）
- [x] 入力値バリデーション（field_name, data_type等）
- [x] SQLインジェクション対策（ORMによる保護確認）
- [x] XSS対策（入力サニタイゼーション）

**実装内容**:
- [x] `GET /api/schema/:schemaId` - スキーマ定義取得
  - カテゴリとフィールドを display_order でソート
  - JOIN最適化
- [x] `POST /api/schema/categories` - カテゴリ追加
  - バリデーション実装
- [x] `PUT /api/schema/categories/:id` - カテゴリ編集
  - 存在確認
  - display_order 更新
- [x] `DELETE /api/schema/categories/:id` - カテゴリ削除
  - カスケード削除（関連フィールド）
- [x] `POST /api/schema/fields` - フィールド追加
  - data_type ENUM検証
  - options JSON検証
- [x] `PUT /api/schema/fields/:id` - フィールド編集
- [x] `DELETE /api/schema/fields/:id` - フィールド削除
- [x] `POST /api/schema/reset` - デフォルト復元
  - トランザクション処理
  - シードデータからの復元

#### **2.2 設定画面（フロントエンド）**

**テスト仕様（TDD）**:
- コンポーネントレンダリングテスト
- CRUD操作のインタラクションテスト
- ドラッグ&ドロップ機能のテスト
- フォームバリデーションのテスト
- エラーハンドリング表示のテスト

**実装内容**:
- [x] スキーマ設定画面UI実装
  - Material-UI データテーブル
  - モーダルダイアログ
- [x] カテゴリCRUD操作
  - 追加フォーム
  - 編集フォーム
  - 削除確認ダイアログ
- [x] フィールドCRUD操作
  - データ型選択（セレクトボックス）
  - 必須フラグ（チェックボックス）
  - オプション設定（JSON入力）
- [x] ドラッグ&ドロップによる順序変更
  - @dnd-kit 使用（react-beautiful-dnd の代替）
  - display_order 自動更新

---

### **Phase 2.5: ログイン機能とフロントエンドテスト完成** (2日)

**目的**: Phase 2 の完全な完了を達成し、Phase 3 へのスムーズな移行を可能にする

#### **背景**

Phase 2 実装評価により、以下の状況が明らかになりました：

**完了項目（75%）:**
- ✅ バックエンドAPI実装（100%）
- ✅ バックエンドテスト（100%）
- ✅ フロントエンドUI実装（100%）

**未完了項目（25%）:**
- ❌ ログインページ（未実装）
- ❌ フロントエンドコンポーネントテスト（0%）
- ❌ E2Eテスト（0%）

フロントエンドテストがブロックされている主な理由は**ログインページが未実装**であり、認証フローをテストできないためです。

#### **2.5.1 ログイン機能実装**

**テスト仕様（TDD）**:
- ログインフォームのバリデーションテスト
- 認証状態管理のテスト
- ProtectedRouteのリダイレクトテスト
- 管理者権限チェックのテスト

**セキュリティチェック**:
- [x] JWT トークンのセキュアな保存（localStorage）
- [x] 認証エラーハンドリング
- [x] パスワード入力の最小文字数検証
- [x] メールアドレスフォーマット検証

**実装内容**:
- [x] ログインページUI実装
  - Material-UI使用
  - react-hook-form使用
  - バリデーション（email形式、パスワード長）
  - エラーメッセージ表示
- [x] AuthContext実装
  - ログイン状態管理（token, user）
  - ログイン/ログアウト関数
  - localStorage への永続化
  - isAuthenticated, isAdmin フラグ
- [x] ProtectedRoute実装
  - 認証状態の確認
  - 未認証時の /login へリダイレクト
  - 管理者権限チェック（requireAdmin）
- [x] App.tsx の更新
  - AuthProvider でラップ
  - ProtectedRoute を適用
  - /login ルート追加
- [x] authApi.ts の実装
  - login 関数実装
  - レスポンス型定義

#### **2.5.2 フロントエンドコンポーネントテスト実装**

**テスト仕様（TDD）**:
- コンポーネントレンダリングテスト
- CRUD操作のインタラクションテスト
- フォームバリデーションのテスト
- カスタムフックのテスト
- エラーハンドリング表示のテスト

**実装内容**:
- [x] テスト環境セットアップ
  - @testing-library/react v16.3.0
  - @testing-library/jest-dom v6.6.3
  - @testing-library/user-event v14.5.2
  - @vitest/coverage-v8
  - vitest v4.0.12
- [x] ログイン機能のテスト
  - `Login/index.test.tsx`（7テスト）
  - `ProtectedRoute.test.tsx`（3テスト）
- [x] スキーマ管理のテスト
  - `CategoryList.test.tsx`（9テスト）
  - `CategoryForm.test.tsx`（10テスト）
  - `FieldList.test.tsx`（9テスト）
  - `FieldForm.test.tsx`（14テスト）
  - `useSchema.test.ts`（7テスト）

**テスト実績**:
- 総テスト数: 59（目標30+を196%達成）
- 合格率: 100%
- カバレッジ: 主要コンポーネント 85-100%（目標80%+達成）

#### **2.5.3 E2Eテスト実装**

**テスト仕様（TDD）**:
- ログインフローのE2Eテスト
- スキーマ設定画面のE2Eテスト
- CRUD操作のE2Eテスト
- ドラッグ&ドロップのE2Eテスト

**実装内容**:
- [x] Playwrightセットアップ
  - @playwright/test v1.49.1
  - playwright.config.ts設定
  - フロントエンドポート設定（3000番）
  - バックエンド自動起動設定
- [x] ログインE2Eテスト（10テスト実装）
  - 正常ログイン（管理者・作成者）
  - 認証失敗
  - バリデーションエラー
  - ログイン状態の永続化
- [x] スキーマ設定E2Eテスト（11テスト実装）
  - カテゴリCRUD操作
  - フィールドCRUD操作
  - 管理者権限チェック
  - フォームバリデーション

#### **2.5.4 ドキュメント・CI/CD整備**

**実装内容**:
- [x] Phase 2.5 実装計画書作成
  - `docs/plan/phase-2.5-implementation-plan.md`
- [x] README.md更新
  - Phase 2.5完了の記載
  - テスト実行手順
  - テストアカウント情報
- [x] テスト実行ガイド作成
  - `docs/TESTING.md`（詳細なテスト手順）
- [x] CI/CD統合
  - GitHub Actionsワークフロー作成
  - E2Eテスト自動実行設定
  - Playwright レポートのアーティファクトアップロード

#### **2.5.5 E2Eテスト問題解決とクロスプラットフォーム対応**

**実装日**: 2025-11-21

**問題1: Playwright strict mode violation**
- **原因**: 正規表現パターンが2つのエラーメッセージにマッチ
- **修正**: 2つのアサーションに分割（`login.spec.ts:95`）

**問題2: レート制限によるログイン失敗**
- **原因**: バックエンドが開発モード（5回/15分）で起動していた
- **解決策**:
  - `backend/package.json`に`cross-env`パッケージを追加
  - `dev:e2e`スクリプトを作成（`NODE_ENV=test`でテストモード起動）
  - `frontend/playwright.config.ts`を修正（`npm run dev:e2e`を使用）
- **効果**: テストモードのレート制限（100回/秒）により、全テストが正常実行可能に

**問題3: Windows環境での環境変数設定**
- **原因**: PowerShellで`NODE_ENV=test`構文が認識されない
- **解決策**: `cross-env`パッケージによるクロスプラットフォーム対応
- **対応環境**: Windows (PowerShell/CMD)、Linux、macOS

**実装内容**:
- [x] `login.spec.ts:95`のstrict mode violation修正
- [x] `backend/package.json`に`cross-env`追加
- [x] `backend/package.json`に`dev:e2e`スクリプト追加
- [x] `frontend/playwright.config.ts`修正

**コミット履歴**:
- `a86e026` - chore: Add Playwright entries to .gitignore
- `de938bc` - fix(e2e): Fix strict mode violation in login test
- `35d04b3` - fix(e2e): Configure backend to run in test mode during E2E tests
- `3fb6111` - feat(e2e): Add cross-platform support for E2E test environment

#### **2.5.6 CI/CDパイプライン修正**

**実装日**: 2025-11-22

**問題と解決策**:

| # | 問題 | 原因 | 解決策 |
|---|------|------|--------|
| 1 | npm workspaces非対応 | `cache-dependency-path`がワークスペースの`package-lock.json`を参照 | ルートの`package-lock.json`を参照するよう変更 |
| 2 | シードデータ未投入 | `prisma:seed`ステップがない | `backend-test`ジョブに追加 |
| 3 | TypeScript ESLintエラー（93件） | 厳格な型チェック | 型定義ファイル追加、型注釈追加 |
| 4 | Prettierフォーマットエラー（27ファイル） | コードスタイル不整合 | `npm run format`で修正 |
| 5 | フロントエンドビルド型エラー | `FieldForm.tsx`の型不一致 | payload構築方法を修正 |
| 6 | フロントエンドポート不一致 | CIで5173を使用、実際は3000 | ポート番号を3000に修正 |
| 7 | Playwrightサーバー起動競合 | `reuseExistingServer: false` | `true`に変更 |

**主要な修正ファイル**:
- `.github/workflows/ci.yml` - npm workspaces対応、prisma:seed追加、ポート修正
- `backend/src/types/requests.ts` - 新規作成（リクエストボディの型定義）
- `frontend/tsconfig.json` - テストファイルをexcludeから削除
- `frontend/playwright.config.ts` - reuseExistingServer: true

**CI/CDパイプライン状況**:
- ✅ Backend - Build & Test: 通過
- ✅ Frontend - Build & Test: 通過
- ✅ E2E Tests (Playwright): 通過
- ⚠️ Security Audit: 警告あり
- ⏳ CD (Staging/Production): 未対応

**コミット履歴**:
- `0f04351` - fix(ci): Adapt CI pipeline for npm workspaces monorepo structure
- `1d57953` - fix(lint): Resolve all TypeScript ESLint errors in backend and frontend
- `3cb61b4` - fix(lint): Resolve remaining TypeScript ESLint errors
- `c006765` - style: Fix Prettier formatting issues in backend and frontend
- `091f5e8` - fix(ci): Add prisma:seed step to backend test job
- `a5d9193` - fix(types): Resolve TypeScript build errors in frontend
- `2bb9916` - fix(ci): Correct frontend port from 5173 to 3000 in E2E test
- `2dc15e3` - fix(e2e): Set reuseExistingServer to true in Playwright config

#### **2.5.7 ワークフロートリガー修正とテストカバレッジ改善**

**実装日**: 2025-11-22

**背景**:
- GitHub Actions ワークフローファイルに構文エラーがあり、CI/CD エラーが表示されていた
- バックエンドの Jest カバレッジで一部ファイルのブランチカバレッジが 80% 未満だった
- `claude/**` ブランチへの push 時に不要な CI ワークフローが実行されていた

**問題と解決策**:

| # | 問題 | 原因 | 解決策 |
|---|------|------|--------|
| 1 | cd-staging.yml / cd-production.yml でエラー | `environment.url` で `secrets` コンテキストを使用（GitHub Actions 非対応） | `environment` ブロックをシンプル化、URL 参照を削除 |
| 2 | env.ts ブランチカバレッジ 42.1% | モジュールレベルの環境変数処理がテスト困難 | `createConfig()`, `validateRequiredEnvVars()`, `warnIfDefaultJwtSecret()` 関数に分離してテスタブルに |
| 3 | jwt.ts ブランチカバレッジ 40% | `jwt.decode()` の到達不能 catch ブロック、モジュールレベルコード | デッドコード削除、Istanbul ignore コメント追加、モック化テスト追加 |
| 4 | logger.ts ブランチカバレッジ 40% | 環境依存の分岐、未テストの stream.write | `createTextFormat()` 関数抽出、Istanbul ignore コメント追加、stream.write テスト追加 |
| 5 | ci.yml で `claude/**` ブランチも CI 実行 | push トリガーに `claude/**` が含まれていた | push トリガーから `claude/**` を削除 |

**テストカバレッジ改善結果**:

| ファイル | Before (Branches) | After (Branches) | 改善 |
|---------|-------------------|------------------|------|
| `src/config/env.ts` | 42.1% | **100%** | +57.9% |
| `src/utils/jwt.ts` | 40% | **100%** | +60% |
| `src/utils/logger.ts` | 40% | **80%** | +40% |

**主要な修正ファイル**:
- `.github/workflows/cd-staging.yml` - environment.url の secrets 参照を削除
- `.github/workflows/cd-production.yml` - environment.url の secrets 参照を削除
- `.github/workflows/ci.yml` - push トリガーから `claude/**` を削除
- `backend/src/config/env.ts` - テスタブルな関数に分離
- `backend/src/utils/jwt.ts` - デッドコード削除、Istanbul ignore 追加
- `backend/src/utils/logger.ts` - `createTextFormat()` 関数抽出
- `backend/tests/unit/config/env.test.ts` - 新規作成（18テスト）
- `backend/tests/unit/jwt.test.ts` - モック化、エラーケース追加（10テスト）
- `backend/tests/unit/logger.test.ts` - 新規作成（8テスト）

**コミット履歴**:
- `6a90f60` - fix(ci): Remove secrets from environment.url in CD workflows
- `b5e8e4c` - test(backend): Add comprehensive tests for env.ts and refactor for testability
- `1d72e72` - test(backend): Improve jwt.ts test coverage to 100%
- `68133c0` - test(backend): Add logger.ts tests and improve coverage to 80%+
- `7cee35e` - ci: Remove claude/** branch from CI push triggers

---

### **Phase 3: 仕様書管理（ダッシュボード）** (2-3日)

**目的**: トップページ（ダッシュボード）の実装

#### **3.1 仕様書一覧API**

**テスト仕様（TDD）**:
- 一覧取得のページネーションテスト
- フィルタリング機能のテスト（ステータス別）
- ソート機能のテスト（更新日時順）
- 新規仕様書作成（シェル）のテスト
- 詳細取得のテスト

**セキュリティチェック**:
- [x] ユーザー自身の仕様書のみ取得可能（author_user_id検証）
- [x] SQLインジェクション対策

**実装内容**:
- [x] `GET /api/specifications` - 仕様書一覧取得
  - ページネーション実装
  - author_user_id でフィルタ
  - 非正規化された title 使用（パフォーマンス最適化）
- [x] `POST /api/specifications` - 新規仕様書作成（シェル）
  - 最小限のレコード作成
  - specification_id の即時返却
- [x] `GET /api/specifications/:id` - 仕様書詳細取得
  - 権限チェック（作成者のみ）

#### **3.2 ダッシュボードUI**

**テスト仕様（TDD）**:
- トップページレンダリングテスト
- 一覧テーブル表示テスト
- ステータスバッジの色分けテスト
- 新規作成ボタンのインタラクションテスト
- 編集/詳細ボタンの条件表示テスト
- 管理者のみ設定ボタン表示テスト

**実装内容**:
- [x] トップページ実装
  - レイアウト（ヘッダー、メインコンテンツ）
  - ナビゲーション
- [x] 仕様書一覧テーブル
  - Material-UI Table コンポーネント
  - ステータスバッジ（編集中/確認中/保存済み）
  - バージョン表示
  - 更新日時表示
- [x] 新規作成ボタン
  - モーダルまたはページ遷移
- [x] 編集/詳細ボタン
  - ステータス連動（編集中/確認中 → 編集、保存済み → 詳細）
- [x] 設定ボタン
  - 管理者ロールの場合のみ表示
  - 設定画面への遷移

---

### **Phase 4: ウィザード機能（コア）** (5-7日)

**目的**: 動的ウィザード、ローカル自動保存、動的リスト管理の実装

#### **4.1 動的フォーム生成**

**テスト仕様（TDD）**:
- スキーマ定義からのUI生成テスト
- 各フィールドタイプのレンダリングテスト
- 進捗バーの計算ロジックテスト
- 必須項目バリデーションテスト

**実装内容**:
- [x] スキーマ定義からUIを動的生成するロジック
  - スキーマAPI呼び出し
  - カテゴリごとにステップ生成
  - フィールドごとにフォーム項目生成
- [x] フィールドタイプ別コンポーネント
  - テキスト（TextField）
  - テキストエリア（TextField multiline）
  - 日付（DatePicker）
  - ラジオボタン（RadioGroup）
  - チェックボックス（CheckboxGroup）
  - リスト（動的リストコンポーネント）
- [x] ステップ進捗バー
  - 入力済み項目数 / 総項目数の計算
  - 視覚的な進捗表示

#### **4.2 ローカルストレージ自動保存**

**テスト仕様（TDD）**:
- debounce処理のテスト
- ローカルストレージへの保存テスト
- ページリロード時の復元テスト
- 自動保存インジケータ表示テスト

**実装内容**:
- [x] 入力値の自動保存
  - debounce処理（500ms）
  - localStorage API使用
  - キー: `wizard_data_${specification_id}`
- [x] ページリロード時の復元
  - ウィザード画面ロード時に localStorage 読み込み
  - state に復元
- [x] 自動保存インジケータ表示
  - 保存中アニメーション
  - 保存完了メッセージ

#### **4.3 動的リスト項目管理**

**テスト仕様（TDD）**:
- リスト項目追加のテスト
- リスト項目削除のテスト
- 配列データのstate管理テスト

**実装内容**:
- [x] 「納品物」「業務タスク」等の追加/削除UI
  - 「+ 追加」ボタン
  - 削除ボタン（各項目）
- [x] 配列データのstate管理
  - useState または Redux
  - 配列の追加/削除ロジック

#### **4.4 ステップナビゲーション**

**テスト仕様（TDD）**:
- 次へ/前へボタンのテスト
- 進捗バークリックによるジャンプテスト
- URLパラメータ同期テスト

**実装内容**:
- [x] 次へ/前へボタン
  - ステップ遷移ロジック
  - 最初/最後のステップでのボタン無効化
- [x] 進捗バークリックによるジャンプ
  - クリックイベントハンドラー
  - ステップ番号の管理

---

### **Phase 5: レビュー・保存機能** (3-4日)

**目的**: 最終確認画面、バリデーション、保存APIの実装

#### **5.1 最終確認サマリー表示**

**テスト仕様（TDD）**:
- サマリー画面レンダリングテスト
- 全入力項目の読み取り専用表示テスト
- 必須項目未入力の視覚的強調テスト

**実装内容**:
- [ ] Step 6確認画面実装
  - 全カテゴリのサマリー表示
  - カテゴリごとのセクション分け
- [ ] 全入力項目の読み取り専用表示
  - スキーマ定義とローカルデータのマージ
  - フィールドタイプに応じた表示形式
- [ ] 必須項目未入力の視覚的強調
  - 赤背景表示
  - 警告メッセージ

#### **5.2 バリデーション・保存API**

**テスト仕様（TDD）**:
- 必須項目検証ロジックのテスト
- バージョン管理ロジックのテスト（メジャー/マイナー分岐）
- トランザクション処理のテスト
- title非正規化処理のテスト
- EAVデータ保存のテスト
- 1:Nサブエンティティ保存のテスト

**セキュリティチェック**:
- [ ] ユーザー権限検証（作成者のみ保存可能）
- [ ] 入力値サニタイゼーション
- [ ] SQLインジェクション対策
- [ ] XSS対策

**実装内容**:
- [ ] `PUT /api/specifications/:id` - 仕様書保存
- [ ] 必須項目検証ロジック
  - スキーマから is_required フラグ取得
  - ペイロードと照合
- [ ] バージョン管理ロジック
  - 全必須項目入力済み → メジャーバージョンアップ（例: 2.0）、status='保存済み'
  - 未入力あり → マイナーバージョンアップ（例: 1.2）、status='編集中'
- [ ] トランザクション実装
  - BEGIN TRANSACTION
  - Specification テーブル更新
  - Specification_Content DELETE & INSERT
  - Deliverable, Business_Task等 DELETE & INSERT
  - COMMIT TRANSACTION
- [ ] title非正規化処理
  - ペイロードから「件名」フィールドの値を抽出
  - Specification.title に保存

#### **5.3 クイック編集ナビゲーション**

**テスト仕様（TDD）**:
- サマリー画面の「編集」ボタンテスト
- 該当ステップへのジャンプテスト

**実装内容**:
- [ ] サマリー画面の「編集」ボタン
  - 各カテゴリセクションに配置
  - 該当ステップへのリンク

---

### **Phase 6: 詳細表示・エクスポート機能** (4-5日)

**目的**: 仕様書詳細画面とエクスポート機能の実装

#### **6.1 仕様書詳細画面**

**テスト仕様（TDD）**:
- 詳細データ取得APIのテスト
- 詳細画面レンダリングテスト
- 集計値（業務数等）の表示テスト

**実装内容**:
- [ ] `GET /api/specifications/:id/details` - 詳細データ取得
  - Specification マスターレコード取得
  - Specification_Content 取得（JOIN）
  - Deliverable, Business_Task等 取得（JOIN）
  - 集計値計算（業務数等）
- [ ] 詳細情報画面UI実装
  - メタデータ表示（作成日時、更新日時、バージョン等）
  - EAVデータ表示
  - 1:Nリストデータ表示（テーブル形式）

#### **6.2 エクスポート機能実装**

**テスト仕様（TDD）**:
- PDFエクスポートのテスト
- Wordエクスポートのテスト
- Markdownエクスポートのテスト
- 日本語文字のレンダリングテスト
- ダウンロードレスポンスのテスト

**セキュリティチェック**:
- [ ] ユーザー権限検証（作成者のみエクスポート可能）
- [ ] パストラバーサル対策

**実装内容**:
- [ ] `GET /api/specifications/:id/export?format=pdf` - PDFエクスポート
  - Puppeteer初期化
  - HTMLテンプレート作成
  - PDF生成
  - Content-Type: application/pdf
- [ ] `GET /api/specifications/:id/export?format=docx` - Wordエクスポート
  - docx ライブラリ使用
  - eastAsia フォント設定（日本語対応）
  - セクション構成
  - テーブル生成（納品物、業務タスク等）
  - Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
- [ ] `GET /api/specifications/:id/export?format=md` - Markdownエクスポート
  - カスタムテンプレート実装
  - Markdown記法でのフォーマット
  - Content-Type: text/markdown
- [ ] テンプレート設計
  - ヘッダー（タイトル、バージョン、日付等）
  - セクション構成（カテゴリごと）
  - テーブル（リストデータ）

---

### **Phase 7: テスト実装** (4-5日)

**目的**: カバレッジ80%以上を達成し、セキュリティを検証

#### **7.1 バックエンドテスト**

**目標**: カバレッジ80%以上

**実装内容**:
- [ ] ユニットテスト
  - 各APIエンドポイントのテスト
  - ビジネスロジックのテスト（バージョン管理、バリデーション等）
  - ミドルウェアのテスト（認証、ロール検証）
  - ヘルパー関数のテスト
- [ ] 統合テスト
  - API E2Eテスト（Supertest使用）
  - データベーストランザクションテスト
  - 認証フローの統合テスト
- [ ] カバレッジレポート生成
  - Jest coverage
  - カバレッジ確認（80%以上）

#### **7.2 フロントエンドテスト**

**目標**: カバレッジ80%以上

**実装内容**:
- [ ] コンポーネントテスト
  - React Testing Library
  - 各コンポーネントのレンダリングテスト
  - インタラクションテスト（ボタンクリック、フォーム入力等）
  - スナップショットテスト
- [ ] E2Eテスト
  - Playwright または Cypress
  - 主要なユーザーフローのテスト
    - ログイン → 新規作成 → ウィザード入力 → 保存
    - ダッシュボード → 詳細表示 → エクスポート
    - 設定画面 → スキーマ編集
- [ ] カバレッジレポート生成

#### **7.3 セキュリティテスト**

**実装内容**:
- [ ] OWASPチェックリスト検証
  - [ ] 入力値のバリデーション
  - [ ] SQLインジェクション対策確認
  - [ ] XSS対策確認
  - [ ] CSRF トークン実装確認
  - [ ] 認証・認可の実装確認
  - [ ] HTTPS の強制確認
  - [ ] レート制限の実装確認
  - [ ] ログイン試行回数の制限確認
  - [ ] 機密情報のマスキング確認
  - [ ] 依存関係の脆弱性スキャン（npm audit）
- [ ] 認証・認可テスト
  - 不正なトークンでのアクセステスト
  - ロール検証テスト（Creator/Admin）
  - 他ユーザーのデータアクセステスト（権限外アクセス）
- [ ] 脆弱性スキャン
  - npm audit
  - Snyk または類似ツール

---

### **Phase 8: 最適化・デプロイ準備** (2-3日)

**目的**: パフォーマンス最適化とインフラ構築

#### **8.1 パフォーマンス最適化**

**実装内容**:
- [ ] DBクエリ最適化
  - インデックス追加（specification_id, author_user_id, schema_id等）
  - N+1問題の解決（JOIN最適化）
  - クエリ実行計画の確認（EXPLAIN ANALYZE）
- [ ] フロントエンドバンドルサイズ最適化
  - コード分割（React.lazy, Suspense）
  - Tree shaking
  - バンドルサイズ分析（webpack-bundle-analyzer）
- [ ] 画像・アセット最適化
  - 画像圧縮
  - CDN使用検討

#### **8.2 インフラ構築**

**実装内容**:
- [ ] Terraform設定
  - Cloud SQL（PostgreSQL）設定
  - Cloud Run 設定（backend/frontend）
  - VPC設定
  - IAM設定
- [ ] 環境変数管理
  - Secret Manager設定
  - 環境別設定（ステージング/本番）
- [ ] CI/CDパイプライン完成
  - GitHub Actionsワークフロー
  - ビルド → テスト → デプロイ
  - ステージング環境: developブランチへのマージ時
  - 本番環境: mainブランチへのマージ後、手動承認

#### **8.3 ドキュメント整備**

**実装内容**:
- [ ] API仕様書
  - Swagger/OpenAPI定義
  - 全エンドポイントのドキュメント化
  - リクエスト/レスポンス例
- [ ] README更新
  - セットアップ手順（npm/Docker）
  - 開発手順
  - テスト実行方法
  - デプロイ手順
- [ ] アーキテクチャ図更新
  - システム構成図
  - データモデル図
  - シーケンス図

---

## 開発方針

### 1. テスト駆動開発（TDD）原則

**CLAUDE.md の指示**:
> 各実装に先立ち、機能要件を満たすようなテスト仕様を策定することに留意してください。

**実践方法**:
1. **レッド**: テストを先に書く（失敗することを確認）
2. **グリーン**: テストが通る最小限のコードを実装
3. **リファクタ**: コードを改善

**カバレッジ目標**: 80%以上

### 2. セキュリティファースト

**CLAUDE.md の開発原則**:
> 全ての機能実装前にセキュリティ検証を実施

**OWASP Top 10 対策**:
- A01: アクセス制御の不備 → RBAC実装、JWT検証
- A02: 暗号化の失敗 → パスワードハッシュ化、HTTPS強制
- A03: インジェクション → ORM使用、入力バリデーション
- A04: 安全が確認されない不安全な設計 → セキュリティレビュー
- A05: セキュリティの設定ミス → helmet、CORS設定
- A06: 脆弱で古くなったコンポーネント → npm audit定期実行
- A07: 識別と認証の失敗 → JWT実装、ログイン試行制限
- A08: ソフトウェアとデータの整合性の不具合 → CI/CDパイプライン
- A09: セキュリティログとモニタリングの失敗 → Winston/Pinoログ
- A10: サーバサイドリクエストフォージェリ → 入力検証

### 3. スケーラビリティ設計

**想定負荷**: 1万ユーザー同時接続

**対策**:
- 水平スケーリング可能なアーキテクチャ（Cloud Run）
- データベースインデックス最適化
- クエリ最適化（N+1問題解決）
- ステートレス設計（JWT使用）

### 4. 監査可能性

**要件**:
- 全ての変更をログ記録
- データベースの変更履歴記録
- ユーザーアクションの監査ログ保持

**実装**:
- Winston/Pinoによるロギング
- created_at, updated_at カラム
- 監査ログテーブル（オプション）

---

## 見積もり

### 総開発期間
- **最短**: 約29日（約6週間）
- **最長**: 約40日（約8週間）
- **平均**: 約34日（約7週間）

### フェーズ別見積もり

| フェーズ | 内容 | 期間 | ステータス |
|---------|------|------|-----------|
| Phase 0 | プロジェクト基盤構築 | 1-2日 | ✅ 完了 |
| Phase 1 | バックエンド基盤 | 3-5日 | ✅ 完了 |
| Phase 2 | スキーマ管理機能 | 3-4日 | ✅ 完了 |
| Phase 2.5 | ログイン機能とフロントエンドテスト完成 | 2日 | ✅ 完了 |
| Phase 3 | 仕様書管理（ダッシュボード） | 2-3日 | ✅ 完了 |
| Phase 4 | ウィザード機能（コア） | 5-7日 | ✅ 完了 |
| Phase 5 | レビュー・保存機能 | 3-4日 | ⏸️ 未着手 |
| Phase 6 | 詳細表示・エクスポート機能 | 4-5日 | ⏸️ 未着手 |
| Phase 7 | テスト実装 | 4-5日 | ⏸️ 未着手 |
| Phase 8 | 最適化・デプロイ準備 | 2-3日 | ⏸️ 未着手 |
| **合計** | | **29-40日** | |

### リソース想定
- **バックエンド開発**: 約15-20日
- **フロントエンド開発**: 約12-17日（Phase 2.5含む）
- **テスト実装**: 約4-5日
- **インフラ構築**: 約2-3日

---

## 次のステップ

### 1. 実装計画のレビュー

リポジトリオーナーによるレビュー実施済み。

**レビュー観点**:
- フェーズの優先順位は適切か → OK.
- 見積もりは妥当か → OK.
- 技術選定に問題はないか → OK.
- セキュリティ要件は満たされているか → OK.
- TDD原則の適用方法は明確か → OK.

### 2. レビュー完了後

承認いただければ、**Phase 0: プロジェクト基盤構築**から実装を開始します。

**Phase 0 の成果物**:
- プロジェクト構造（backend/, frontend/, infrastructure/）
- docker-compose.yml
- .env.example
- ESLint/Prettier設定
- GitHub Actions基本ワークフロー

### 3. コミュニケーション

**進捗報告**:
- 各フェーズ完了時に進捗報告
- 問題発生時は即座に報告
- 技術的な判断が必要な場合は確認

**質問・確認事項**:
- 実装中に不明点があれば随時質問
- 仕様の解釈が曖昧な場合は確認

---

## 参考資料

### プロジェクトドキュメント
- [CLAUDE.md](../../CLAUDE.md) - プロジェクト憲法
- [README.md](../../README.md) - プロジェクト概要とセットアップ手順
- [仕様書作成支援アプリ機能仕様書](../spec/仕様書作成支援アプリ機能仕様書.md)
- [データモデル設計](../spec/仕様書作成アプリ データモデル生成.md)
- [シーケンス図](../spec/仕様書作成支援アプリ シーケンス図.md)
- [システム構成図](../spec/spec_manager_system_diagram.md)

### 技術ドキュメント
- [Prisma Documentation](https://www.prisma.io/docs)
- [Material-UI Documentation](https://mui.com/)
- [Puppeteer Documentation](https://pptr.dev/)
- [docx Library Documentation](https://docx.js.org/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)

---

* **作成者**: Claude
* **最終更新**: 2025-11-22
* **バージョン**: 1.6.0
