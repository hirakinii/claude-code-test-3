# Backend Development Guide

このディレクトリは、仕様書作成支援アプリケーションのバックエンドAPI実装を含みます。

---

## 開発原則

### 1. TDD (Test-Driven Development)
- **テストを先に書く**: 機能実装前にテストケースを作成
- **早期エラー検知**: 開発中の問題を早期発見
- **リファクタリング安全性**: テストがあることで安全にリファクタリング可能

### 2. セキュリティファースト
- **全APIエンドポイントで認証・認可チェック**
- **入力値の厳格なバリデーション**
- **セキュリティヘッダーの適用** (Helmet.js)
- **レート制限の実装**

### 3. 型安全性
- **TypeScript Strict モード必須**
- **any 型の使用は最小限に**
- **明示的な型定義**

---

## API設計ルール

### RESTful 原則
```
GET    /api/specifications       # 一覧取得
GET    /api/specifications/:id   # 詳細取得
POST   /api/specifications       # 新規作成
PUT    /api/specifications/:id   # 更新
DELETE /api/specifications/:id   # 削除
```

### HTTPステータスコード
- `200 OK`: 成功
- `201 Created`: 作成成功
- `204 No Content`: 削除成功
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 権限エラー
- `404 Not Found`: リソース未検出
- `409 Conflict`: 競合エラー
- `500 Internal Server Error`: サーバーエラー

### エラーレスポンス統一フォーマット
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "email",
        "message": "メールアドレスの形式が正しくありません"
      }
    ]
  }
}
```

### ページネーション
```typescript
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasNext": true
  }
}
```

---

## データベース操作

### Prisma 使用必須
- ORM として Prisma を使用
- Raw SQL は原則禁止（特殊ケースのみ許可）
- マイグレーションファイルは必ず作成
- シードデータはバージョン管理

### トランザクション処理
```typescript
await prisma.$transaction(async (tx) => {
  await tx.specification.create({ ... });
  await tx.auditLog.create({ ... });
});
```

### マイグレーション
```bash
# 開発環境
npm run prisma:migrate

# 本番環境
npm run prisma:migrate:prod
```

---

## セキュリティチェックリスト

### 認証・認可
- [ ] パスワードは bcrypt でハッシュ化（saltRounds: 12）
- [ ] JWT トークンは環境変数で管理
- [ ] トークンの有効期限を適切に設定
- [ ] リフレッシュトークンの実装

### 入力値検証
- [ ] 全APIエンドポイントでバリデーション実装
- [ ] Joi または Zod を使用
- [ ] SQLインジェクション対策（ORM使用）
- [ ] XSS対策（入力サニタイゼーション）
- [ ] パストラバーサル対策

### レート制限
- [ ] express-rate-limit を実装
- [ ] 認証エンドポイントは特に厳格に設定
- [ ] IPベースの制限

### CORS設定
- [ ] 許可するオリジンを環境変数で管理
- [ ] 本番環境では厳格に設定

---

## テスト要件

### カバレッジ目標
- **全体カバレッジ: 80% 以上**
- **ビジネスロジック: 90% 以上**

### テスト種別

#### ユニットテスト
- Services, Utils の各関数
- ビジネスロジックの網羅的テスト

#### 統合テスト
- API エンドポイントのテスト
- データベース操作のテスト
- 認証・認可のテスト

#### テスト実行
```bash
# 全テスト実行
npm test

# カバレッジ付き実行
npm run test:coverage

# 監視モード
npm run test:watch

# 統合テストのみ
npm run test:integration
```

---

## ディレクトリ構造

```
backend/
├── src/
│   ├── index.ts              # アプリケーションエントリーポイント
│   ├── app.ts                # Express アプリケーション設定
│   ├── server.ts             # サーバー起動ロジック
│   ├── config/               # 設定ファイル
│   │   ├── database.ts       # Prisma クライアント
│   │   ├── jwt.ts            # JWT 設定
│   │   └── env.ts            # 環境変数管理
│   ├── middleware/           # ミドルウェア
│   │   ├── auth.ts           # 認証
│   │   ├── rbac.ts           # ロールベースアクセス制御
│   │   ├── errorHandler.ts  # エラーハンドリング
│   │   ├── rateLimiter.ts   # レート制限
│   │   └── validator.ts     # リクエストバリデーション
│   ├── routes/               # ルート定義
│   ├── controllers/          # コントローラー
│   ├── services/             # ビジネスロジック
│   ├── repositories/         # データアクセス層
│   ├── models/               # TypeScript 型定義
│   ├── utils/                # ユーティリティ
│   └── types/                # 型定義
├── prisma/
│   ├── schema.prisma         # Prisma スキーマ
│   ├── migrations/           # マイグレーション
│   └── seeds/                # シードデータ
└── tests/
    ├── unit/                 # ユニットテスト
    ├── integration/          # 統合テスト
    └── fixtures/             # テストデータ
```

---

## コーディング規約

### 命名規則
- **ファイル名**: camelCase.ts
- **クラス名**: PascalCase
- **関数名**: camelCase
- **定数**: UPPER_SNAKE_CASE
- **型・インターフェース**: PascalCase

### 関数設計
```typescript
/**
 * 仕様書を作成する
 * @param userId - ユーザーID
 * @param data - 仕様書データ
 * @returns 作成された仕様書
 * @throws {ValidationError} バリデーションエラー時
 */
export async function createSpecification(
  userId: string,
  data: CreateSpecificationDto
): Promise<Specification> {
  // 実装
}
```

### エラーハンドリング
```typescript
// カスタムエラークラスを使用
throw new ValidationError('入力値が不正です', {
  field: 'email',
  message: 'メールアドレスの形式が正しくありません'
});
```

---

## 環境変数

### 必須環境変数
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

---

## デバッグ

### ログ出力
```typescript
import { logger } from './utils/logger';

logger.info('仕様書を作成しました', { specificationId });
logger.error('エラーが発生しました', { error });
```

### VSCode デバッグ設定
`.vscode/launch.json` を使用してデバッグ可能

---

## パフォーマンス最適化

### データベースクエリ
- **N+1問題の回避**: include, select を適切に使用
- **インデックスの適切な設定**
- **不要なデータの取得を避ける**

### キャッシング
- Redis を使用（Phase 2以降）
- セッション情報のキャッシング

---

## 禁止事項

### 🚫 絶対禁止
1. **any 型の濫用**: やむを得ない場合のみ使用
2. **console.log でのデバッグ**: logger を使用
3. **ハードコーディング**: 環境変数を使用
4. **同期処理**: 非同期処理を使用
5. **直接的なデータベース操作**: Repository パターンを使用

---

## 参考資料

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**更新日**: 2025-11-19
**バージョン**: 1.0.0
