# Phase 3 実装計画書：仕様書管理（ダッシュボード）

**作成日**: 2025-11-22
**対象フェーズ**: Phase 3 - 仕様書管理（ダッシュボード）
**見積もり期間**: 2-3日
**前提条件**:
- Phase 2.5（ログイン機能とフロントエンドテスト）が完了していること
- 認証基盤（AuthContext, ProtectedRoute）が実装済み
- Prisma スキーマに Specification モデルが定義済み

---

## 目次

1. [実装概要](#実装概要)
2. [データモデル確認](#データモデル確認)
3. [アーキテクチャ設計](#アーキテクチャ設計)
4. [実装の優先順位と順序](#実装の優先順位と順序)
5. [バックエンドAPI実装](#バックエンドapi実装)
6. [フロントエンド実装](#フロントエンド実装)
7. [テスト実装](#テスト実装)
8. [セキュリティチェックリスト](#セキュリティチェックリスト)
9. [完了基準](#完了基準)
10. [次のステップ](#次のステップ)

---

## 実装概要

### 目的

仕様書作成者が自身の仕様書を一覧表示・管理できるダッシュボード機能を実装します。これにより、ユーザーはログイン後に自分の仕様書を確認し、新規作成や編集を開始できるようになります。

### Phase 3 の成果物

#### バックエンド
- 仕様書一覧取得 API（ページネーション、フィルタリング、ソート対応）
- 新規仕様書作成 API（シェルレコードの作成）
- 仕様書詳細取得 API
- ユニットテスト・統合テスト（カバレッジ80%以上）

#### フロントエンド
- ダッシュボードページ（トップページ）
- 仕様書一覧テーブル（Material-UI Table）
- 新規作成ボタン・モーダル
- ステータスバッジ表示
- ナビゲーションヘッダー
- コンポーネントテスト・E2E テスト

---

## データモデル確認

### Specification モデル（Prisma スキーマより）

```prisma
model Specification {
  id        String              @id @default(uuid()) @db.Uuid
  authorId  String              @map("author_user_id") @db.Uuid
  schemaId  String              @map("schema_id") @db.Uuid
  title     String?             /// 非正規化: パフォーマンスのため件名をキャッシュ
  status    SpecificationStatus @default(DRAFT)
  version   String              @default("1.0")
  createdAt DateTime            @default(now()) @map("created_at")
  updatedAt DateTime            @updatedAt @map("updated_at")

  author User   @relation(fields: [authorId], references: [id])
  schema Schema @relation(fields: [schemaId], references: [id])

  // 関連エンティティ
  content                   SpecificationContent[]
  deliverables              Deliverable[]
  contractorRequirements    ContractorRequirement[]
  basicBusinessRequirements BasicBusinessRequirement[]
  businessTasks             BusinessTask[]
}

enum SpecificationStatus {
  DRAFT  /// 編集中
  REVIEW /// 確認中
  SAVED  /// 保存済み
}
```

### 一覧表示に必要なフィールド

| フィールド | 説明 | 表示形式 |
|-----------|------|---------|
| `id` | 仕様書ID | 非表示（内部リンク用） |
| `title` | 件名 | テキスト（「無題」表示対応） |
| `status` | ステータス | バッジ（色分け） |
| `version` | バージョン | テキスト |
| `updatedAt` | 更新日時 | 日付フォーマット |
| `createdAt` | 作成日時 | 日付フォーマット |

---

## アーキテクチャ設計

### API エンドポイント設計

| メソッド | パス | 説明 | 権限 |
|---------|------|------|------|
| GET | `/api/specifications` | 仕様書一覧取得 | 認証済みユーザー |
| POST | `/api/specifications` | 新規仕様書作成（シェル） | 認証済みユーザー |
| GET | `/api/specifications/:id` | 仕様書詳細取得 | 作成者のみ |
| DELETE | `/api/specifications/:id` | 仕様書削除 | 作成者のみ |

### バックエンド構造

```
backend/src/
├── controllers/
│   └── specificationController.ts  # 新規作成
├── services/
│   └── specificationService.ts     # 新規作成
├── routes/
│   └── specification.ts            # 新規作成
└── types/
    └── requests.ts                 # 型定義追加
```

### フロントエンド構造

```
frontend/src/
├── pages/
│   └── Dashboard/                  # 新規作成
│       ├── index.tsx               # ダッシュボードページ
│       ├── SpecificationList.tsx   # 仕様書一覧
│       ├── SpecificationCard.tsx   # 仕様書カード（オプション）
│       ├── CreateSpecificationModal.tsx  # 新規作成モーダル
│       └── __tests__/              # テスト
├── components/
│   ├── Layout/                     # 新規作成
│   │   ├── Header.tsx              # ヘッダー
│   │   └── Navigation.tsx          # ナビゲーション
│   └── StatusBadge.tsx             # ステータスバッジ
├── hooks/
│   └── useSpecifications.ts        # 新規作成
└── api/
    └── specificationApi.ts         # 新規作成
```

---

## 実装の優先順位と順序

### TDD の原則に従った実装順序

Phase 3 では TDD（テスト駆動開発）を徹底します。

1. **テスト仕様の策定** → テストコード作成（RED）
2. **最小実装** → テストが通る最小限のコード（GREEN）
3. **リファクタリング** → コード品質の改善（REFACTOR）

### 実装ステップ

#### ステップ 1: バックエンド基盤（0.5日）

- [ ] Specification サービスの作成
- [ ] Specification コントローラーの作成
- [ ] ルート定義と登録
- [ ] リクエスト/レスポンス型定義

#### ステップ 2: 仕様書一覧 API（0.5日）

- [ ] テスト作成
  - ページネーションテスト
  - フィルタリングテスト（ステータス別）
  - ソートテスト（更新日時順）
  - 権限チェックテスト（自分の仕様書のみ）
- [ ] 実装
  - `GET /api/specifications` エンドポイント
  - クエリパラメータ処理（page, limit, status, sort）
  - author_user_id によるフィルタリング

#### ステップ 3: 新規仕様書作成 API（0.5日）

- [ ] テスト作成
  - シェルレコード作成テスト
  - バリデーションテスト
  - 権限チェックテスト
- [ ] 実装
  - `POST /api/specifications` エンドポイント
  - デフォルトスキーマの自動設定
  - 即時 ID 返却

#### ステップ 4: 仕様書詳細・削除 API（0.5日）

- [ ] テスト作成
  - 詳細取得テスト
  - 権限チェックテスト（作成者のみ）
  - 削除テスト
- [ ] 実装
  - `GET /api/specifications/:id` エンドポイント
  - `DELETE /api/specifications/:id` エンドポイント

#### ステップ 5: フロントエンド基盤（0.5日）

- [ ] Specification API クライアントの作成
- [ ] useSpecifications カスタムフックの作成
- [ ] レイアウトコンポーネントの作成（Header, Navigation）
- [ ] ルーティング設定の更新

#### ステップ 6: ダッシュボード UI（1日）

- [ ] ダッシュボードページ実装
- [ ] 仕様書一覧テーブル実装
- [ ] ステータスバッジコンポーネント実装
- [ ] 新規作成モーダル実装
- [ ] ナビゲーション（設定画面へのリンク）

#### ステップ 7: テスト実装（0.5日）

- [ ] バックエンド統合テスト
- [ ] フロントエンドコンポーネントテスト
- [ ] E2E テスト（Playwright）

---

## バックエンドAPI実装

### 1. 仕様書一覧取得 API

#### エンドポイント

```
GET /api/specifications
```

#### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|----------|------|
| `page` | number | 1 | ページ番号 |
| `limit` | number | 10 | 1ページあたりの件数（最大100） |
| `status` | string | - | ステータスフィルタ（DRAFT, REVIEW, SAVED） |
| `sort` | string | `-updatedAt` | ソート順（`-` プレフィックスで降順） |

#### リクエスト例

```
GET /api/specifications?page=1&limit=10&status=DRAFT&sort=-updatedAt
Headers:
  Authorization: Bearer {token}
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "仕様書の件名",
        "status": "DRAFT",
        "version": "1.0",
        "createdAt": "2025-11-22T00:00:00.000Z",
        "updatedAt": "2025-11-22T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### 実装（Service）

```typescript
// backend/src/services/specificationService.ts

export interface GetSpecificationsParams {
  userId: string;
  page?: number;
  limit?: number;
  status?: SpecificationStatus;
  sort?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getSpecifications(
  params: GetSpecificationsParams
): Promise<PaginatedResult<Specification>> {
  const { userId, page = 1, limit = 10, status, sort = '-updatedAt' } = params;

  // ソート順の解析
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';

  // Where 条件の構築
  const where: Prisma.SpecificationWhereInput = {
    authorId: userId,
    ...(status && { status }),
  };

  // トータル件数の取得
  const total = await prisma.specification.count({ where });

  // データ取得
  const items = await prisma.specification.findMany({
    where,
    orderBy: { [sortField]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      title: true,
      status: true,
      version: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

### 2. 新規仕様書作成 API

#### エンドポイント

```
POST /api/specifications
```

#### リクエストボディ

```json
{
  "schemaId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
}
```

**注意**: `schemaId` は省略可能。省略時はデフォルトスキーマを使用。

#### レスポンス

```json
{
  "success": true,
  "data": {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "title": null,
    "status": "DRAFT",
    "version": "1.0",
    "schemaId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "createdAt": "2025-11-22T00:00:00.000Z",
    "updatedAt": "2025-11-22T00:00:00.000Z"
  }
}
```

#### 実装（Service）

```typescript
// backend/src/services/specificationService.ts

const DEFAULT_SCHEMA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

export async function createSpecification(data: {
  userId: string;
  schemaId?: string;
}): Promise<Specification> {
  const schemaId = data.schemaId || DEFAULT_SCHEMA_ID;

  // スキーマの存在確認
  const schema = await prisma.schema.findUnique({
    where: { id: schemaId },
  });

  if (!schema) {
    throw new Error('Schema not found');
  }

  // 仕様書シェルの作成
  const specification = await prisma.specification.create({
    data: {
      authorId: data.userId,
      schemaId,
      status: 'DRAFT',
      version: '1.0',
    },
  });

  logger.info('Specification created', { specificationId: specification.id });
  return specification;
}
```

---

### 3. 仕様書詳細取得 API

#### エンドポイント

```
GET /api/specifications/:id
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "title": "仕様書の件名",
    "status": "DRAFT",
    "version": "1.0",
    "schemaId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "createdAt": "2025-11-22T00:00:00.000Z",
    "updatedAt": "2025-11-22T12:00:00.000Z",
    "author": {
      "id": "user-uuid",
      "fullName": "山田太郎",
      "email": "yamada@example.com"
    }
  }
}
```

#### 実装（Service）

```typescript
// backend/src/services/specificationService.ts

export async function getSpecificationById(
  specificationId: string,
  userId: string
): Promise<Specification> {
  const specification = await prisma.specification.findUnique({
    where: { id: specificationId },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!specification) {
    throw new Error('Specification not found');
  }

  // 権限チェック: 作成者のみアクセス可能
  if (specification.authorId !== userId) {
    throw new Error('Access denied');
  }

  return specification;
}
```

---

### 4. 仕様書削除 API

#### エンドポイント

```
DELETE /api/specifications/:id
```

#### レスポンス

```json
{
  "success": true,
  "message": "Specification deleted successfully"
}
```

#### 実装（Service）

```typescript
// backend/src/services/specificationService.ts

export async function deleteSpecification(
  specificationId: string,
  userId: string
): Promise<{ success: boolean }> {
  const specification = await prisma.specification.findUnique({
    where: { id: specificationId },
  });

  if (!specification) {
    throw new Error('Specification not found');
  }

  // 権限チェック: 作成者のみ削除可能
  if (specification.authorId !== userId) {
    throw new Error('Access denied');
  }

  // カスケード削除（関連データも削除）
  await prisma.specification.delete({
    where: { id: specificationId },
  });

  logger.info('Specification deleted', { specificationId });
  return { success: true };
}
```

---

### 5. ルート定義

```typescript
// backend/src/routes/specification.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getSpecificationsHandler,
  createSpecificationHandler,
  getSpecificationByIdHandler,
  deleteSpecificationHandler,
} from '../controllers/specificationController';

const router = Router();

// すべてのエンドポイントに認証を要求
router.use(requireAuth);

// 仕様書一覧取得
router.get('/', getSpecificationsHandler);

// 新規仕様書作成
router.post('/', createSpecificationHandler);

// 仕様書詳細取得
router.get('/:id', getSpecificationByIdHandler);

// 仕様書削除
router.delete('/:id', deleteSpecificationHandler);

export default router;
```

```typescript
// backend/src/server.ts への追加
import specificationRouter from './routes/specification';

// ...

app.use('/api/specifications', specificationRouter);
```

---

## フロントエンド実装

### 1. API クライアント

```typescript
// frontend/src/api/specificationApi.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Specification {
  id: string;
  title: string | null;
  status: 'DRAFT' | 'REVIEW' | 'SAVED';
  version: string;
  schemaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSpecifications {
  items: Specification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetSpecificationsParams {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'REVIEW' | 'SAVED';
  sort?: string;
}

export const specificationApi = {
  getSpecifications: async (
    params: GetSpecificationsParams,
    token: string
  ): Promise<PaginatedSpecifications> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await axios.get(
      `${API_URL}/api/specifications?${queryParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data;
  },

  createSpecification: async (
    schemaId?: string,
    token?: string
  ): Promise<Specification> => {
    const response = await axios.post(
      `${API_URL}/api/specifications`,
      { schemaId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data;
  },

  getSpecificationById: async (
    id: string,
    token: string
  ): Promise<Specification> => {
    const response = await axios.get(`${API_URL}/api/specifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  deleteSpecification: async (id: string, token: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/specifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
```

---

### 2. カスタムフック

```typescript
// frontend/src/hooks/useSpecifications.ts
import { useState, useEffect, useCallback } from 'react';
import {
  specificationApi,
  PaginatedSpecifications,
  GetSpecificationsParams,
} from '../api/specificationApi';

export function useSpecifications(token: string) {
  const [data, setData] = useState<PaginatedSpecifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<GetSpecificationsParams>({
    page: 1,
    limit: 10,
    sort: '-updatedAt',
  });

  const fetchSpecifications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('認証が必要です');
      return;
    }

    try {
      setLoading(true);
      const result = await specificationApi.getSpecifications(params, token);
      setData(result);
      setError(null);
    } catch (err) {
      setError('仕様書の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [token, params]);

  useEffect(() => {
    fetchSpecifications();
  }, [fetchSpecifications]);

  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const setStatus = (status?: 'DRAFT' | 'REVIEW' | 'SAVED') => {
    setParams((prev) => ({ ...prev, status, page: 1 }));
  };

  return {
    specifications: data?.items || [],
    pagination: data?.pagination || null,
    loading,
    error,
    refetch: fetchSpecifications,
    setPage,
    setStatus,
  };
}
```

---

### 3. ダッシュボードページ

```typescript
// frontend/src/pages/Dashboard/index.tsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSpecifications } from '../../hooks/useSpecifications';
import SpecificationList from './SpecificationList';
import CreateSpecificationModal from './CreateSpecificationModal';
import Header from '../../components/Layout/Header';

function Dashboard() {
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();
  const {
    specifications,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setStatus,
  } = useSpecifications(token || '');
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const handleCreateSuccess = () => {
    setOpenCreateModal(false);
    refetch();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Typography variant="h4" component="h1">
              仕様書一覧
            </Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateModal(true)}
                sx={{ mr: 2 }}
              >
                新規作成
              </Button>
              {isAdmin && (
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/settings/schema')}
                >
                  設定
                </Button>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <SpecificationList
            specifications={specifications}
            pagination={pagination}
            onPageChange={setPage}
            onStatusChange={setStatus}
            onRefresh={refetch}
          />
        </Box>

        <CreateSpecificationModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
          onSuccess={handleCreateSuccess}
          token={token || ''}
        />
      </Container>
    </>
  );
}

export default Dashboard;
```

---

### 4. 仕様書一覧コンポーネント

```typescript
// frontend/src/pages/Dashboard/SpecificationList.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Pagination,
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Specification } from '../../api/specificationApi';
import StatusBadge from '../../components/StatusBadge';

interface SpecificationListProps {
  specifications: Specification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  onPageChange: (page: number) => void;
  onStatusChange: (status?: 'DRAFT' | 'REVIEW' | 'SAVED') => void;
  onRefresh: () => void;
}

function SpecificationList({
  specifications,
  pagination,
  onPageChange,
  onStatusChange,
  onRefresh,
}: SpecificationListProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = (id: string) => {
    navigate(`/specifications/${id}/edit`);
  };

  const handleView = (id: string) => {
    navigate(`/specifications/${id}`);
  };

  if (specifications.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          仕様書がありません。「新規作成」ボタンから作成してください。
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>ステータス</InputLabel>
          <Select
            label="ステータス"
            defaultValue=""
            onChange={(e) =>
              onStatusChange(
                e.target.value as 'DRAFT' | 'REVIEW' | 'SAVED' | undefined
              )
            }
          >
            <MenuItem value="">すべて</MenuItem>
            <MenuItem value="DRAFT">編集中</MenuItem>
            <MenuItem value="REVIEW">確認中</MenuItem>
            <MenuItem value="SAVED">保存済み</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>件名</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>バージョン</TableCell>
              <TableCell>更新日時</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {specifications.map((spec) => (
              <TableRow key={spec.id} hover>
                <TableCell>{spec.title || '（無題）'}</TableCell>
                <TableCell>
                  <StatusBadge status={spec.status} />
                </TableCell>
                <TableCell>{spec.version}</TableCell>
                <TableCell>{formatDate(spec.updatedAt)}</TableCell>
                <TableCell align="right">
                  {spec.status === 'SAVED' ? (
                    <IconButton
                      aria-label="view"
                      onClick={() => handleView(spec.id)}
                    >
                      <ViewIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      aria-label="edit"
                      onClick={() => handleEdit(spec.id)}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => {
                      if (window.confirm('この仕様書を削除しますか？')) {
                        // 削除処理
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

export default SpecificationList;
```

---

### 5. ステータスバッジコンポーネント

```typescript
// frontend/src/components/StatusBadge.tsx
import React from 'react';
import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: 'DRAFT' | 'REVIEW' | 'SAVED';
}

const statusConfig = {
  DRAFT: { label: '編集中', color: 'warning' as const },
  REVIEW: { label: '確認中', color: 'info' as const },
  SAVED: { label: '保存済み', color: 'success' as const },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return <Chip label={config.label} color={config.color} size="small" />;
}

export default StatusBadge;
```

---

### 6. 新規作成モーダル

```typescript
// frontend/src/pages/Dashboard/CreateSpecificationModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { specificationApi } from '../../api/specificationApi';

interface CreateSpecificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

function CreateSpecificationModal({
  open,
  onClose,
  onSuccess,
  token,
}: CreateSpecificationModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      const specification = await specificationApi.createSpecification(
        undefined,
        token
      );

      onSuccess();
      // 作成後、編集画面へ遷移
      navigate(`/specifications/${specification.id}/edit`);
    } catch (err) {
      setError('仕様書の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新規仕様書の作成</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <p>新しい仕様書を作成します。作成後、ウィザード画面で内容を入力してください。</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          作成
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateSpecificationModal;
```

---

### 7. App.tsx へのルート追加

```typescript
// frontend/src/App.tsx の更新
// 以下のルートを追加

const Dashboard = lazy(() => import('./pages/Dashboard'));

// Routes 内に追加
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// ルートパスをダッシュボードにリダイレクト
<Route path="/" element={<Navigate to="/dashboard" replace />} />
```

---

## テスト実装

### バックエンドテスト

#### ユニットテスト（specificationService.test.ts）

```typescript
describe('SpecificationService', () => {
  describe('getSpecifications', () => {
    it('should return paginated specifications for user', async () => {
      // テスト実装
    });

    it('should filter by status', async () => {
      // テスト実装
    });

    it('should sort by updatedAt descending by default', async () => {
      // テスト実装
    });

    it('should return only user own specifications', async () => {
      // テスト実装
    });
  });

  describe('createSpecification', () => {
    it('should create shell specification with default schema', async () => {
      // テスト実装
    });

    it('should throw error for non-existent schema', async () => {
      // テスト実装
    });
  });

  describe('getSpecificationById', () => {
    it('should return specification by id', async () => {
      // テスト実装
    });

    it('should throw error for non-existent specification', async () => {
      // テスト実装
    });

    it('should throw error when accessing other user specification', async () => {
      // テスト実装
    });
  });

  describe('deleteSpecification', () => {
    it('should delete specification', async () => {
      // テスト実装
    });

    it('should cascade delete related data', async () => {
      // テスト実装
    });

    it('should throw error when deleting other user specification', async () => {
      // テスト実装
    });
  });
});
```

#### 統合テスト（specification.test.ts）

```typescript
describe('Specification API', () => {
  describe('GET /api/specifications', () => {
    it('should return 200 with paginated list', async () => {
      // テスト実装
    });

    it('should return 401 without auth', async () => {
      // テスト実装
    });

    it('should filter by status query param', async () => {
      // テスト実装
    });
  });

  describe('POST /api/specifications', () => {
    it('should create specification and return 201', async () => {
      // テスト実装
    });

    it('should return 401 without auth', async () => {
      // テスト実装
    });
  });

  describe('GET /api/specifications/:id', () => {
    it('should return specification details', async () => {
      // テスト実装
    });

    it('should return 403 for other user specification', async () => {
      // テスト実装
    });

    it('should return 404 for non-existent specification', async () => {
      // テスト実装
    });
  });

  describe('DELETE /api/specifications/:id', () => {
    it('should delete specification and return 200', async () => {
      // テスト実装
    });

    it('should return 403 for other user specification', async () => {
      // テスト実装
    });
  });
});
```

### フロントエンドテスト

#### コンポーネントテスト（Dashboard.test.tsx）

```typescript
describe('Dashboard', () => {
  it('should render specification list', async () => {
    // テスト実装
  });

  it('should show empty state when no specifications', async () => {
    // テスト実装
  });

  it('should open create modal on button click', async () => {
    // テスト実装
  });

  it('should show settings button only for admin', async () => {
    // テスト実装
  });
});
```

#### E2E テスト（dashboard.spec.ts）

```typescript
test.describe('Dashboard', () => {
  test('should display specification list after login', async ({ page }) => {
    // テスト実装
  });

  test('should create new specification', async ({ page }) => {
    // テスト実装
  });

  test('should filter specifications by status', async ({ page }) => {
    // テスト実装
  });

  test('should navigate to settings for admin', async ({ page }) => {
    // テスト実装
  });
});
```

---

## セキュリティチェックリスト

### 認証・認可

- [ ] すべてのエンドポイントに `requireAuth` ミドルウェアを適用
- [ ] 仕様書アクセス時に作成者チェックを実施
- [ ] JWTトークンの検証が正しく行われているか
- [ ] 他ユーザーの仕様書にアクセスできないことを確認

### 入力バリデーション

- [ ] ページネーションパラメータの範囲検証（page >= 1, limit <= 100）
- [ ] ステータス値の ENUM 検証
- [ ] UUID 形式の検証

### SQLインジェクション対策

- [ ] Prisma ORM を使用（パラメータ化クエリ）
- [ ] 動的クエリを使用していないか確認

### その他

- [ ] エラーメッセージに機密情報が含まれていないか確認
- [ ] ログに機密情報が含まれていないか確認

---

## 完了基準

### 機能面

- [ ] 仕様書一覧取得 API が動作する
- [ ] 新規仕様書作成 API が動作する
- [ ] 仕様書詳細取得 API が動作する
- [ ] 仕様書削除 API が動作する
- [ ] ダッシュボード画面が表示される
- [ ] 仕様書一覧テーブルが表示される
- [ ] ステータスフィルタが動作する
- [ ] ページネーションが動作する
- [ ] 新規作成モーダルが動作する
- [ ] 管理者のみ設定ボタンが表示される

### テスト

- [ ] バックエンドユニットテストが 80% 以上のカバレッジ
- [ ] バックエンド統合テストがすべてパス
- [ ] フロントエンドコンポーネントテストがすべてパス
- [ ] E2E テストがすべてパス

### セキュリティ

- [ ] セキュリティチェックリストがすべて完了
- [ ] 他ユーザーの仕様書にアクセスできないことを確認
- [ ] バリデーションが適切に機能することを確認

### ドキュメント

- [ ] README.md の更新（Phase 3 完了の記載）
- [ ] コード内のコメントが適切に記載されている

---

## 次のステップ

Phase 3 完了後、以下のステップに進みます：

1. **コードレビュー**: リポジトリオーナーによるレビュー
2. **統合テストの実行**: CI/CD パイプラインでの自動テスト
3. **Phase 4へ**: ウィザード機能（コア）の実装

---

## 参考資料

### Phase 2 の実装パターン

- `backend/src/services/schemaService.ts` - Service パターン
- `backend/src/controllers/schemaController.ts` - Controller パターン
- `backend/src/routes/schema.ts` - Route 定義パターン
- `frontend/src/pages/SchemaSettings/` - ページ構造パターン
- `frontend/src/hooks/useSchema.ts` - カスタムフックパターン
- `frontend/src/api/schemaApi.ts` - API クライアントパターン

### Prisma スキーマ

- `backend/prisma/schema.prisma` - データモデル定義

### 技術ドキュメント

- [Prisma Documentation](https://www.prisma.io/docs)
- [Material-UI Table](https://mui.com/material-ui/react-table/)
- [Material-UI Pagination](https://mui.com/material-ui/react-pagination/)

---

**作成者**: Claude
**最終更新**: 2025-11-22
**バージョン**: 1.0.0
