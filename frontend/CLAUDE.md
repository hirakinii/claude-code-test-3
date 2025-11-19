# Frontend Development Guide

このディレクトリは、仕様書作成支援アプリケーションのフロントエンドUI実装を含みます。

---

## 開発原則

### 1. コンポーネント設計
- **1コンポーネント1責務**: Single Responsibility Principle
- **再利用可能性**: 汎用的なコンポーネント設計
- **小さなコンポーネント**: 100行以内を目安

### 2. 型安全性
- **TypeScript Strict モード必須**
- **Props は interface で明示的に定義**
- **any 型の使用は最小限に**

### 3. アクセシビリティ
- **WCAG 2.1 AA 準拠**
- **キーボード操作対応**
- **スクリーンリーダー対応**
- **適切な ARIA 属性の使用**

### 4. パフォーマンス
- **初回レンダリング時間: 3秒以内**
- **コード分割によるバンドルサイズ最適化**
- **画像最適化**
- **不要な再レンダリングの防止**

---

## コンポーネント設計ルール

### Props 定義
```typescript
interface ButtonProps {
  /** ボタンのラベル */
  label: string;
  /** クリック時のハンドラー */
  onClick: () => void;
  /** ボタンのバリアント */
  variant?: 'primary' | 'secondary' | 'outlined';
  /** 無効化フラグ */
  disabled?: boolean;
  /** ローディング状態 */
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
}) => {
  // 実装
};
```

### デフォルト値の設定
- Props にはデフォルト値を設定
- undefined チェックを減らす

### コンポーネント分類
1. **Common Components**: 汎用的なUI部品（Button, Input, Modal など）
2. **Layout Components**: レイアウト構造（Header, Sidebar, Footer など）
3. **Feature Components**: 機能特化型（WizardContainer, SchemaEditor など）
4. **Page Components**: ページ単位のコンポーネント

---

## 状態管理

### グローバル状態
- **Redux Toolkit** を使用
- 認証情報、ユーザー情報、共有データを管理

```typescript
// store/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, isAuthenticated: false },
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});
```

### ローカル状態
- **useState** を使用
- コンポーネント内で完結する状態管理

### 副作用
- **useEffect** を使用
- 依存配列を適切に設定

### 自動保存
- **useDebounce** フック + **localStorage**
- 入力途中のデータを保存

---

## カスタムフック

### useAuth
```typescript
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const login = async (email: string, password: string) => {
    const { user, token } = await authService.login(email, password);
    dispatch(authSlice.actions.login({ user, token }));
  };

  const logout = () => {
    dispatch(authSlice.actions.logout());
  };

  return { user, isAuthenticated, login, logout };
};
```

### useLocalStorage
```typescript
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [storedValue, setValue] as const;
};
```

---

## パフォーマンス最適化

### メモ化
```typescript
// コンポーネントのメモ化
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  // 実装
});

// 値のメモ化
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// コールバックのメモ化
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### コード分割
```typescript
// ページ単位での遅延ロード
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const WizardPage = React.lazy(() => import('./pages/WizardPage'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wizard" element={<WizardPage />} />
      </Routes>
    </Suspense>
  );
}
```

### 画像最適化
- WebP 形式の使用
- Lazy Loading の実装
- 適切なサイズの画像を配信

---

## Material-UI 使用ガイド

### テーマ設定
```typescript
// styles/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      'Noto Sans JP',
      'Roboto',
      'sans-serif',
    ].join(','),
  },
});
```

### コンポーネント使用例
```typescript
import { Button, TextField, Box } from '@mui/material';

export const LoginForm: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField label="メールアドレス" type="email" />
      <TextField label="パスワード" type="password" />
      <Button variant="contained">ログイン</Button>
    </Box>
  );
};
```

---

## テスト要件

### カバレッジ目標
- **全体カバレッジ: 80% 以上**
- **重要コンポーネント: 90% 以上**

### テスト種別

#### コンポーネントテスト
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('ラベルが表示される', () => {
    render(<Button label="クリック" onClick={() => {}} />);
    expect(screen.getByText('クリック')).toBeInTheDocument();
  });

  it('クリック時にハンドラーが呼ばれる', () => {
    const handleClick = jest.fn();
    render(<Button label="クリック" onClick={handleClick} />);
    fireEvent.click(screen.getByText('クリック'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### フックテスト
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  it('初期値が設定される', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });
});
```

#### E2Eテスト（Playwright）
```typescript
import { test, expect } from '@playwright/test';

test('ログインフロー', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## ディレクトリ構造

```
frontend/
├── src/
│   ├── index.tsx             # アプリケーションエントリーポイント
│   ├── App.tsx               # ルートコンポーネント
│   ├── config/               # 設定ファイル
│   ├── components/           # コンポーネント
│   │   ├── common/           # 汎用コンポーネント
│   │   ├── layout/           # レイアウトコンポーネント
│   │   ├── wizard/           # ウィザード関連
│   │   ├── dashboard/        # ダッシュボード関連
│   │   └── schema/           # スキーマ設定関連
│   ├── pages/                # ページコンポーネント
│   ├── hooks/                # カスタムフック
│   ├── services/             # API サービス
│   ├── store/                # Redux ストア
│   ├── types/                # 型定義
│   ├── utils/                # ユーティリティ
│   └── styles/               # スタイル設定
└── tests/                    # テストファイル
```

---

## API 通信

### Axios インスタンス
```typescript
// services/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（認証トークン付与）
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 認証エラー時はログイン画面にリダイレクト
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### API サービス
```typescript
// services/specificationService.ts
import { apiClient } from './apiClient';

export const specificationService = {
  getAll: async () => {
    const { data } = await apiClient.get('/api/specifications');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/api/specifications/${id}`);
    return data;
  },

  create: async (specification: CreateSpecificationDto) => {
    const { data } = await apiClient.post('/api/specifications', specification);
    return data;
  },
};
```

---

## コーディング規約

### 命名規則
- **ファイル名**: PascalCase.tsx (コンポーネント), camelCase.ts (その他)
- **コンポーネント名**: PascalCase
- **関数名**: camelCase
- **定数**: UPPER_SNAKE_CASE
- **型・インターフェース**: PascalCase

### インポート順序
```typescript
// 1. React 関連
import React, { useState, useEffect } from 'react';

// 2. 外部ライブラリ
import { Box, Button } from '@mui/material';
import { useDispatch } from 'react-redux';

// 3. 内部モジュール
import { useAuth } from '@/hooks/useAuth';
import { Button as CustomButton } from '@/components/common/Button';

// 4. 型定義
import type { User } from '@/types/user';

// 5. スタイル
import './styles.css';
```

---

## アクセシビリティ

### キーボード操作
- Tab キーでフォーカス移動
- Enter/Space でボタン実行
- Esc でモーダルクローズ

### ARIA 属性
```typescript
<button
  aria-label="削除"
  aria-pressed={isPressed}
  aria-disabled={isDisabled}
>
  削除
</button>
```

### セマンティック HTML
```typescript
// 良い例
<main>
  <article>
    <h1>タイトル</h1>
    <section>内容</section>
  </article>
</main>

// 悪い例
<div>
  <div>
    <div>タイトル</div>
    <div>内容</div>
  </div>
</div>
```

---

## 環境変数

### 必須環境変数
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_APP_NAME=仕様書作成支援アプリ
REACT_APP_VERSION=1.0.0
```

### 使用方法
```typescript
const apiUrl = process.env.REACT_APP_API_URL;
```

---

## 禁止事項

### 🚫 絶対禁止
1. **any 型の濫用**: やむを得ない場合のみ使用
2. **console.log でのデバッグ**: 開発時のみ許可、本番環境では削除
3. **インラインスタイルの濫用**: Material-UI の sx prop または CSS を使用
4. **巨大なコンポーネント**: 200行を超える場合は分割
5. **直接的な DOM 操作**: React の宣言的UIを使用

---

## パッケージ管理

### 新規パッケージ追加時
1. 必要性を検討
2. ライセンス確認
3. セキュリティ監査（npm audit）
4. バンドルサイズへの影響確認

---

## デバッグ

### React Developer Tools
- コンポーネントツリーの確認
- Props/State の確認
- パフォーマンスプロファイリング

### Redux DevTools
- アクションの履歴確認
- State の確認
- Time Travel Debugging

---

## 参考資料

- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Testing Library Documentation](https://testing-library.com/react)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**更新日**: 2025-11-19
**バージョン**: 1.0.0
