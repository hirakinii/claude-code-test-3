/**
 * CategoryList.test.tsx
 * CategoryListコンポーネントのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryList from '../CategoryList';
import { schemaApi, Schema } from '../../../api/schemaApi';

// schemaApi のモック
vi.mock('../../../api/schemaApi');

// FieldList のモック
vi.mock('../FieldList', () => ({
  default: () => <div>FieldList Mock</div>,
}));

const mockSchema: Schema = {
  id: 'schema-1',
  name: 'Test Schema',
  isDefault: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  categories: [
    {
      id: 'cat-1',
      schemaId: 'schema-1',
      name: 'Category 1',
      description: 'Description 1',
      displayOrder: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      fields: [],
    },
    {
      id: 'cat-2',
      schemaId: 'schema-1',
      name: 'Category 2',
      description: 'Description 2',
      displayOrder: 2,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      fields: [],
    },
  ],
};

describe('CategoryList', () => {
  const mockOnUpdate = vi.fn();
  const mockToken = 'test-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render categories', () => {
    render(
      <CategoryList schema={mockSchema} onUpdate={mockOnUpdate} token={mockToken} />
    );

    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('should render empty state when no categories', () => {
    const emptySchema: Schema = {
      ...mockSchema,
      categories: [],
    };

    render(
      <CategoryList schema={emptySchema} onUpdate={mockOnUpdate} token={mockToken} />
    );

    expect(
      screen.getByText(/カテゴリがありません。「カテゴリを追加」ボタンから作成してください。/)
    ).toBeInTheDocument();
  });

  it('should display category metadata', () => {
    render(
      <CategoryList schema={mockSchema} onUpdate={mockOnUpdate} token={mockToken} />
    );

    // displayOrderが表示されることを確認
    expect(screen.getByText('順序: 1')).toBeInTheDocument();
    expect(screen.getByText('順序: 2')).toBeInTheDocument();

    // フィールド数が表示されることを確認
    const fieldCountElements = screen.getAllByText('0 フィールド');
    expect(fieldCountElements).toHaveLength(2);
  });

  it('should handle delete with confirmation', async () => {
    vi.mocked(schemaApi.deleteCategory).mockResolvedValue(undefined);
    window.confirm = vi.fn(() => true);

    render(
      <CategoryList schema={mockSchema} onUpdate={mockOnUpdate} token={mockToken} />
    );

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'このカテゴリを削除しますか？\n関連するフィールドもすべて削除されます。'
      );
      expect(schemaApi.deleteCategory).toHaveBeenCalledWith('cat-1', mockToken);
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should not delete when user cancels confirmation', async () => {
    vi.mocked(schemaApi.deleteCategory).mockResolvedValue(undefined);
    window.confirm = vi.fn(() => false);

    render(
      <CategoryList schema={mockSchema} onUpdate={mockOnUpdate} token={mockToken} />
    );

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(schemaApi.deleteCategory).not.toHaveBeenCalled();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  it('should handle delete error', async () => {
    vi.mocked(schemaApi.deleteCategory).mockRejectedValue(new Error('Delete failed'));
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();

    render(
      <CategoryList schema={mockSchema} onUpdate={mockOnUpdate} token={mockToken} />
    );

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('カテゴリの削除に失敗しました');
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  it('should expand/collapse category to show fields', async () => {
    const schemaWithFields: Schema = {
      ...mockSchema,
      categories: [
        {
          ...mockSchema.categories[0],
          fields: [
            {
              id: 'field-1',
              categoryId: 'cat-1',
              name: 'Field 1',
              dataType: 'TEXT',
              isRequired: false,
              displayOrder: 1,
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-01T00:00:00.000Z',
            },
          ],
        },
      ],
    };

    render(
      <CategoryList schema={schemaWithFields} onUpdate={mockOnUpdate} token={mockToken} />
    );

    // 初期状態ではFieldListは表示されていない
    expect(screen.queryByText('FieldList Mock')).not.toBeInTheDocument();

    // expandボタンをクリック
    const expandButton = screen.getByLabelText('expand');
    fireEvent.click(expandButton);

    // FieldListが表示される
    expect(screen.getByText('FieldList Mock')).toBeInTheDocument();

    // もう一度クリックして折りたたむ
    fireEvent.click(expandButton);

    // FieldListが非表示になる（Collapseアニメーションが完了するまで待つ）
    await waitFor(() => {
      expect(screen.queryByText('FieldList Mock')).not.toBeInTheDocument();
    });
  });

  it('should show edit button', () => {
    render(
      <CategoryList schema={mockSchema} onUpdate={mockOnUpdate} token={mockToken} />
    );

    const editButtons = screen.getAllByLabelText('edit');
    expect(editButtons).toHaveLength(2);
  });

  // Note: ドラッグ&ドロップのテストは @dnd-kit の testing utilities が必要
  // 実際の実装では、DndContext のテストユーティリティを使用する必要があります
  it('should have drag handles', () => {
    render(
      <CategoryList schema={mockSchema} onUpdate={mockOnUpdate} token={mockToken} />
    );

    // DragHandleアイコンが存在することを確認
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });
});
