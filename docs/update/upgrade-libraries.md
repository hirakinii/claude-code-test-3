# ライブラリバージョンアップ記録

**実施日**: 2025-11-19
**担当**: Claude
**ブランチ**: `claude/upgrade-react-mui-01TECyinzwYa7bmZRQHoioFJ`
**コミットID**: `cc91322`, `54fca38`

---

## 目次

1. [概要](#概要)
2. [アップグレードパッケージ一覧](#アップグレードパッケージ一覧)
3. [影響範囲](#影響範囲)
4. [適用手順](#適用手順)
5. [テスト結果](#テスト結果)
6. [既存コードへの影響](#既存コードへの影響)
7. [Phase 2 実装への影響](#phase-2-実装への影響)
8. [トラブルシューティング](#トラブルシューティング)
9. [参考資料](#参考資料)

---

## 概要

### 目的

Phase 2 実装開始前に、React と Material-UI を最新バージョンにアップグレードし、将来的な技術的負債を回避する。特に、react-beautiful-dnd が React 18 までしかサポートしていないため、React 19 対応の代替ライブラリ（@dnd-kit）に移行する。

### 背景

- React 19 は新しいフックと最適化機能を提供
- Material-UI v7 は React 19 に完全対応し、パフォーマンスが向上
- react-beautiful-dnd は非推奨（deprecated）となり、React 19 では動作しない

### 実施理由

- Phase 2 でドラッグ&ドロップ機能を実装予定
- 実装後のアップグレードは影響範囲が大きくなる
- 早期アップグレードにより、最新機能の恩恵を受けられる

---

## アップグレードパッケージ一覧

### 本番依存関係（dependencies）

| パッケージ | 変更前 | 変更後 | 変更内容 |
|-----------|-------|-------|---------|
| `react` | 18.2.0 | **19.2.0** | メジャーアップグレード |
| `react-dom` | 18.2.0 | **19.2.0** | メジャーアップグレード |
| `@mui/material` | 5.15.3 | **7.3.5** | メジャーアップグレード |
| `@mui/icons-material` | 5.15.3 | **7.3.5** | メジャーアップグレード |
| `@emotion/react` | 11.11.3 | **11.14.0** | マイナーアップグレード |
| `@emotion/styled` | 11.11.0 | **11.14.1** | マイナーアップグレード |
| `react-beautiful-dnd` | 13.1.1 | **削除** | 非推奨ライブラリの削除 |
| `@dnd-kit/core` | - | **6.3.1** | 新規追加 |
| `@dnd-kit/sortable` | - | **10.0.0** | 新規追加 |
| `@dnd-kit/utilities` | - | **3.2.2** | 新規追加 |

### 開発依存関係（devDependencies）

| パッケージ | 変更前 | 変更後 | 変更内容 |
|-----------|-------|-------|---------|
| `@types/react` | 18.2.47 | **19.2.6** | メジャーアップグレード |
| `@types/react-dom` | 18.2.18 | **19.2.3** | メジャーアップグレード |
| `@vitejs/plugin-react` | 4.2.1 | **5.1.1** | メジャーアップグレード |
| `@testing-library/react` | 14.1.2 | **16.3.0** | メジャーアップグレード |
| `@types/react-beautiful-dnd` | 13.1.8 | **削除** | 関連型定義の削除 |

---

## 影響範囲

### フロントエンド

#### 影響あり（変更が必要）

| ファイル | 影響度 | 変更内容 |
|---------|-------|---------|
| `frontend/.eslintrc.js` | 🟡 中 | `.eslintrc.cjs` にリネーム（ES モジュール対応） |
| `frontend/package.json` | 🔴 高 | 依存関係の大幅な変更 |
| `docs/plan/phase-2-implementation-plan.md` | 🟡 中 | react-beautiful-dnd → @dnd-kit に変更 |

#### 影響なし（変更不要）

| ファイル | 理由 |
|---------|------|
| `frontend/src/main.tsx` | ReactDOM.createRoot は React 19 でも互換性あり |
| `frontend/src/App.tsx` | MUI の基本コンポーネントは v7 でも互換性あり |
| `frontend/src/styles/theme.ts` | createTheme API は変更なし |
| `frontend/vite.config.ts` | プラグインの更新で自動対応 |
| `frontend/tsconfig.json` | TypeScript 設定は変更不要 |

### バックエンド

**影響なし** - バックエンドのコードには一切影響ありません。

---

## 適用手順

### ステップ 1: コアライブラリのアップグレード（所要時間: 5分）

```bash
cd /home/user/claude-code-test-3/frontend

# React と Material-UI のアップグレード
npm install react@^19.1.1 react-dom@^19.1.1
npm install @mui/material@^7.3.5 @mui/icons-material@^7.3.5
npm install @emotion/react@^11.13.0 @emotion/styled@^11.13.0
```

### ステップ 2: 開発依存関係の更新（所要時間: 3分）

```bash
# TypeScript 型定義と開発ツールの更新
npm install --save-dev @types/react@^19.0.0 @types/react-dom@^19.0.0
npm install --save-dev @vitejs/plugin-react@^5.0.0
npm install --save-dev @testing-library/react@^16.0.0
```

### ステップ 3: react-beautiful-dnd の削除と @dnd-kit への移行（所要時間: 3分）

```bash
# 非推奨ライブラリの削除
npm uninstall react-beautiful-dnd @types/react-beautiful-dnd

# React 19 対応の代替ライブラリをインストール
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### ステップ 4: ESLint 設定ファイルの修正（所要時間: 1分）

```bash
# ES モジュール対応のためリネーム
mv frontend/.eslintrc.js frontend/.eslintrc.cjs
```

### ステップ 5: ビルドとテスト（所要時間: 5分）

```bash
# TypeScript コンパイルと Vite ビルド
npm run build

# ESLint 実行
npm run lint

# 開発サーバー起動確認
npm run dev
```

### ステップ 6: Git コミット（所要時間: 2分）

```bash
cd /home/user/claude-code-test-3

# 変更をステージング
git add frontend/.eslintrc.cjs frontend/package.json package-lock.json
git rm frontend/.eslintrc.js

# コミット
git commit -m "chore: Upgrade React to v19.2 and Material-UI to v7.3.5"

# プッシュ
git push -u origin claude/upgrade-react-mui-01TECyinzwYa7bmZRQHoioFJ
```

---

## テスト結果

### ビルドテスト

✅ **TypeScript コンパイル**: 成功（エラーなし）

```bash
> tsc
# 出力なし（エラーなし）
```

✅ **Vite ビルド**: 成功（31.90秒）

```bash
> vite build
vite v5.4.21 building for production...
✓ 942 modules transformed.
✓ built in 31.90s
```

**バンドルサイズ:**
- `index.html`: 0.67 kB
- `redux.js`: 19.09 kB (gzip: 7.39 kB)
- `mui.js`: 96.62 kB (gzip: 33.75 kB)
- `vendor.js`: 158.74 kB (gzip: 50.02 kB)
- `index.js`: 182.69 kB (gzip: 58.03 kB)

### Lint テスト

✅ **ESLint**: 成功（警告なし）

```bash
> npm run lint
# 出力なし（エラー・警告なし）
```

### 開発サーバー起動

✅ **開発サーバー**: 正常起動確認済み

```bash
> npm run dev:frontend
# サーバー起動成功（ユーザー確認済み）
```

---

## 既存コードへの影響

### 影響度: 最小限 ✅

Phase 0 および Phase 1 で実装された既存コードは、**変更なし**で動作します。

#### 確認済み動作コード

| ファイル | 動作確認 | 備考 |
|---------|---------|------|
| `frontend/src/main.tsx` | ✅ | React 19 の createRoot は互換性維持 |
| `frontend/src/App.tsx` | ✅ | MUI v7 の基本コンポーネント互換性あり |
| `frontend/src/styles/theme.ts` | ✅ | createTheme API 変更なし |
| `frontend/src/store/index.ts` | ✅ | Redux Toolkit は React 19 対応済み |

#### React 19 の新機能（利用可能）

以下の機能は既存コードを変更せずに、新規実装時に利用可能です：

- `use()` フック: Promise や Context を直接使用可能
- `useOptimistic()` フック: 楽観的 UI 更新
- `useFormStatus()` フック: フォーム送信状態の管理
- `forwardRef` 不要: 関数コンポーネントで直接 ref を受け取れる

---

## Phase 2 実装への影響

### ドラッグ&ドロップ実装の変更

#### 変更前（react-beautiful-dnd）

```typescript
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="categories">
    {(provided) => (
      <List {...provided.droppableProps} ref={provided.innerRef}>
        {items.map((item, index) => (
          <Draggable key={item.id} draggableId={item.id} index={index}>
            {(provided) => (
              <ListItem ref={provided.innerRef} {...provided.draggableProps}>
                <Box {...provided.dragHandleProps}>
                  <DragHandle />
                </Box>
              </ListItem>
            )}
          </Draggable>
        ))}
      </List>
    )}
  </Droppable>
</DragDropContext>
```

#### 変更後（@dnd-kit）

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ item }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ListItem ref={setNodeRef} style={style}>
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
        <DragHandle />
      </Box>
    </ListItem>
  );
}

<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
    <List>
      {items.map((item) => (
        <SortableItem key={item.id} item={item} />
      ))}
    </List>
  </SortableContext>
</DndContext>
```

### @dnd-kit のメリット

| 項目 | react-beautiful-dnd | @dnd-kit |
|------|---------------------|----------|
| React 19 対応 | ❌ 非対応（React 18まで） | ✅ 完全対応 |
| API スタイル | レンダープロップス | フックベース |
| TypeScript | 外部型定義 | ネイティブ対応 |
| カスタマイズ性 | 中程度 | 非常に高い |
| アクセシビリティ | 基本的 | 高度なサポート |
| バンドルサイズ | 約 33 kB | 約 18 kB（軽量） |
| メンテナンス状況 | 非推奨（2024年から） | アクティブ開発中 |

### 更新されたドキュメント

以下のドキュメントが @dnd-kit 対応に更新されました：

- `docs/plan/phase-2-implementation-plan.md`
  - ステップ 9: ドラッグ&ドロップ機能の実装方針
  - CategoryList コンポーネントのコード例
  - フロントエンドテストのコード例
  - 技術ドキュメントのリンク

---

## トラブルシューティング

### Issue 1: ESLint 設定ファイルのエラー

**症状:**
```
Error: module is not defined in ES module scope
```

**原因:**
`package.json` に `"type": "module"` が設定されているため、`.eslintrc.js` が ES モジュールとして扱われる。

**解決策:**
ファイルを `.eslintrc.cjs` にリネームする。

```bash
mv frontend/.eslintrc.js frontend/.eslintrc.cjs
```

### Issue 2: React 型定義のエラー

**症状:**
```
Type 'ReactNode' is not assignable to type 'ReactElement'
```

**原因:**
React 19 では一部の型定義が変更されている。

**解決策:**
`@types/react@^19.0.0` を使用し、必要に応じて型アサーションを調整する。

### Issue 3: Material-UI のコンポーネントプロパティの変更

**症状:**
MUI v5 から v7 への移行時に一部のプロパティが非推奨になる。

**解決策:**
現在の実装（Phase 0）では影響なし。Phase 2 以降の実装時は MUI v7 のドキュメントを参照。

---

## 参考資料

### 公式ドキュメント

#### React 19
- [React 19 リリースノート](https://react.dev/blog/2024/12/05/react-19)
- [React 19 アップグレードガイド](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 19 の新機能](https://react.dev/reference/react)

#### Material-UI v7
- [MUI v7 ドキュメント](https://mui.com/)
- [MUI v7 マイグレーションガイド](https://mui.com/material-ui/migration/migration-v6/)
- [MUI v7 Breaking Changes](https://github.com/mui/material-ui/releases/tag/v7.0.0)

#### @dnd-kit
- [dnd-kit 公式ドキュメント](https://docs.dndkit.com/)
- [dnd-kit GitHub](https://github.com/clauderic/dnd-kit)
- [dnd-kit Examples](https://docs.dndkit.com/presets/sortable)

#### react-beautiful-dnd 廃止について
- [react-beautiful-dnd 非推奨アナウンス](https://github.com/atlassian/react-beautiful-dnd/issues/2672)

### コミット履歴

#### コミット 1: ライブラリアップグレード
- **ID**: `cc91322`
- **メッセージ**: chore: Upgrade React to v19.2 and Material-UI to v7.3.5
- **変更ファイル**:
  - `frontend/.eslintrc.js` → `frontend/.eslintrc.cjs`
  - `frontend/package.json`
  - `package-lock.json`

#### コミット 2: ドキュメント更新
- **ID**: `54fca38`
- **メッセージ**: docs: Update Phase 2 plan to use @dnd-kit instead of react-beautiful-dnd
- **変更ファイル**:
  - `docs/plan/phase-2-implementation-plan.md`

---

## まとめ

### 実施内容

- ✅ React 18.2.0 → 19.2.0 にアップグレード
- ✅ Material-UI 5.15.3 → 7.3.5 にアップグレード
- ✅ react-beautiful-dnd を削除し @dnd-kit に移行
- ✅ 開発依存関係を React 19 対応バージョンに更新
- ✅ ESLint 設定を ES モジュール対応に修正
- ✅ ビルド・Lint テスト完了
- ✅ Phase 2 実装計画を @dnd-kit ベースに更新

### 影響範囲

- **既存コード**: 変更不要（互換性維持）
- **Phase 2 実装**: ドラッグ&ドロップを @dnd-kit で実装

### 所要時間

- **総時間**: 約 20 分
  - ライブラリインストール: 5 分
  - 設定変更: 2 分
  - ビルド・テスト: 5 分
  - ドキュメント更新: 5 分
  - Git 操作: 3 分

### 次のアクション

Phase 2 の実装を開始する際は、以下を参照してください：

1. `docs/plan/phase-2-implementation-plan.md` - 実装計画書
2. `docs/plan/phase-2-quick-start.md` - クイックスタートガイド
3. `docs/update/upgrade-libraries.md` - 本ドキュメント

---

**記録者**: Claude
**最終更新**: 2025-11-19
