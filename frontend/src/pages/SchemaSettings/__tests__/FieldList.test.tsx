/**
 * FieldList.test.tsx
 * FieldListコンポーネントのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FieldList from '../FieldList';
import { Category, schemaApi } from '../../../api/schemaApi';

// schemaApi のモック
vi.mock('../../../api/schemaApi');

// FieldForm のモック
vi.mock('../FieldForm', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="field-form-mock">
        <button onClick={onClose}>Close Form</button>
      </div>
    ) : null,
}));

describe('FieldList', () => {
  const mockOnUpdate = vi.fn();
  const mockToken = 'test-token';

  const mockCategoryWithoutFields: Category = {
    id: 'cat-1',
    schemaId: 'schema-1',
    name: 'Category 1',
    description: 'Description 1',
    displayOrder: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    fields: [],
  };

  const mockCategoryWithFields: Category = {
    id: 'cat-1',
    schemaId: 'schema-1',
    name: 'Category 1',
    description: 'Description 1',
    displayOrder: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    fields: [
      {
        id: 'field-1',
        categoryId: 'cat-1',
        fieldName: 'Field 1',
        dataType: 'TEXT',
        isRequired: true,
        placeholderText: 'Enter text',
        displayOrder: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'field-2',
        categoryId: 'cat-1',
        fieldName: 'Field 2',
        dataType: 'TEXTAREA',
        isRequired: false,
        placeholderText: '',
        displayOrder: 2,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no fields', () => {
    render(
      <FieldList category={mockCategoryWithoutFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    expect(screen.getByText('フィールドがありません')).toBeInTheDocument();
    expect(screen.getByText('フィールドを追加')).toBeInTheDocument();
  });

  it('should render list of fields', () => {
    render(
      <FieldList category={mockCategoryWithFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    expect(screen.getByText('Field 1')).toBeInTheDocument();
    expect(screen.getByText('Field 2')).toBeInTheDocument();
  });

  it('should display field metadata correctly', () => {
    render(
      <FieldList category={mockCategoryWithFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    // データ型が表示される
    expect(screen.getByText('TEXT')).toBeInTheDocument();
    expect(screen.getByText('TEXTAREA')).toBeInTheDocument();

    // 必須フラグが表示される
    expect(screen.getByText('必須')).toBeInTheDocument();

    // 表示順序が表示される
    expect(screen.getByText('順序: 1')).toBeInTheDocument();
    expect(screen.getByText('順序: 2')).toBeInTheDocument();
  });

  it('should open FieldForm when add button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FieldList category={mockCategoryWithoutFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    const addButton = screen.getByText('フィールドを追加');
    await user.click(addButton);

    expect(screen.getByTestId('field-form-mock')).toBeInTheDocument();
  });

  it('should open FieldForm when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FieldList category={mockCategoryWithFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    const editButtons = screen.getAllByLabelText('edit');
    await user.click(editButtons[0]);

    expect(screen.getByTestId('field-form-mock')).toBeInTheDocument();
  });

  it('should close FieldForm when Close Form button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FieldList category={mockCategoryWithoutFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    const addButton = screen.getByText('フィールドを追加');
    await user.click(addButton);

    expect(screen.getByTestId('field-form-mock')).toBeInTheDocument();

    const closeButton = screen.getByText('Close Form');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('field-form-mock')).not.toBeInTheDocument();
    });
  });

  it('should delete field with confirmation', async () => {
    vi.mocked(schemaApi.deleteField).mockResolvedValue(undefined);
    window.confirm = vi.fn(() => true);

    render(
      <FieldList category={mockCategoryWithFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('このフィールドを削除しますか？');
      expect(schemaApi.deleteField).toHaveBeenCalledWith('field-1', mockToken);
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should not delete field when user cancels confirmation', async () => {
    vi.mocked(schemaApi.deleteField).mockResolvedValue(undefined);
    window.confirm = vi.fn(() => false);

    render(
      <FieldList category={mockCategoryWithFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(schemaApi.deleteField).not.toHaveBeenCalled();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  it('should handle delete error', async () => {
    vi.mocked(schemaApi.deleteField).mockRejectedValue(new Error('Delete failed'));
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();

    render(
      <FieldList category={mockCategoryWithFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('フィールドの削除に失敗しました');
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  it('should show correct number of edit and delete buttons', () => {
    render(
      <FieldList category={mockCategoryWithFields} token={mockToken} onUpdate={mockOnUpdate} />
    );

    const editButtons = screen.getAllByLabelText('edit');
    const deleteButtons = screen.getAllByLabelText('delete');

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });
});
