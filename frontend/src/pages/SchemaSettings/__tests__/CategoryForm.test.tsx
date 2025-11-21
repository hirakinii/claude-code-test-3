/**
 * CategoryForm.test.tsx
 * CategoryFormコンポーネントのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryForm from '../CategoryForm';
import { schemaApi } from '../../../api/schemaApi';

// schemaApi のモック
vi.mock('../../../api/schemaApi');

describe('CategoryForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockToken = 'test-token';
  const mockSchemaId = 'schema-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form for creating new category', () => {
    render(
      <CategoryForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        schemaId={mockSchemaId}
        token={mockToken}
      />
    );

    expect(screen.getByText('カテゴリ追加')).toBeInTheDocument();
    expect(screen.getByLabelText('カテゴリ名')).toBeInTheDocument();
    expect(screen.getByLabelText('説明')).toBeInTheDocument();
    expect(screen.getByLabelText('表示順序')).toBeInTheDocument();
  });

  it('should render form for editing existing category', () => {
    const category = {
      id: 'cat-1',
      name: 'Existing Category',
      description: 'Existing Description',
      displayOrder: 5,
    };

    render(
      <CategoryForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        schemaId={mockSchemaId}
        token={mockToken}
        category={category}
      />
    );

    expect(screen.getByText('カテゴリ編集')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    render(
      <CategoryForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        schemaId={mockSchemaId}
        token={mockToken}
      />
    );

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('カテゴリ名は必須です')).toBeInTheDocument();
      expect(screen.getByText('表示順序は必須です')).toBeInTheDocument();
    });
  });

  it('should validate maximum length for name', async () => {
    const user = userEvent.setup();

    render(
      <CategoryForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        schemaId={mockSchemaId}
        token={mockToken}
      />
    );

    const nameInput = screen.getByLabelText('カテゴリ名');
    const longName = 'a'.repeat(201);
    await user.type(nameInput, longName);

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('カテゴリ名は200文字以内で入力してください')).toBeInTheDocument();
    });
  });

  it('should validate minimum value for displayOrder', async () => {
    const user = userEvent.setup();

    render(
      <CategoryForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        schemaId={mockSchemaId}
        token={mockToken}
      />
    );

    const displayOrderInput = screen.getByLabelText('表示順序');
    await user.clear(displayOrderInput);
    await user.type(displayOrderInput, '0');

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('表示順序は1以上の値を入力してください')).toBeInTheDocument();
    });
  });

  it('should create new category on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(schemaApi.createCategory).mockResolvedValue({
      id: 'new-cat',
      schemaId: mockSchemaId,
      name: 'New Category',
      description: 'New Description',
      displayOrder: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      fields: [],
    });

    render(
      <CategoryForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        schemaId={mockSchemaId}
        token={mockToken}
      />
    );

    await user.type(screen.getByLabelText('カテゴリ名'), 'New Category');
    await user.type(screen.getByLabelText('説明'), 'New Description');

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(schemaApi.createCategory).toHaveBeenCalledWith(
        {
          name: 'New Category',
          description: 'New Description',
          displayOrder: 1,
          schemaId: mockSchemaId,
        },
        mockToken
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should update existing category on submit', async () => {
    const user = userEvent.setup();
    const category = {
      id: 'cat-1',
      name: 'Existing Category',
      description: 'Existing Description',
      displayOrder: 5,
    };

    vi.mocked(schemaApi.updateCategory).mockResolvedValue({
      id: 'cat-1',
      schemaId: mockSchemaId,
      name: 'Updated Category',
      description: 'Updated Description',
      displayOrder: 10,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      fields: [],
    });

    render(
      <CategoryForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        schemaId={mockSchemaId}
        token={mockToken}
        category={category}
      />
    );

    const nameInput = screen.getByLabelText('カテゴリ名');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Category');

    const displayOrderInput = screen.getByLabelText('表示順序');
    await user.clear(displayOrderInput);
    await user.type(displayOrderInput, '10');

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(schemaApi.updateCategory).toHaveBeenCalledWith(
        'cat-1',
        {
          name: 'Updated Category',
          description: 'Existing Description',
          displayOrder: 10,
        },
        mockToken
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle API error on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(schemaApi.createCategory).mockRejectedValue(new Error('API Error'));
    window.alert = vi.fn();

    render(
      <CategoryForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        schemaId={mockSchemaId}
        token={mockToken}
      />
    );

    await user.type(screen.getByLabelText('カテゴリ名'), 'New Category');

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('カテゴリの保存に失敗しました');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should close dialog and reset form on cancel', async () => {
    const user = userEvent.setup();

    render(
      <CategoryForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        schemaId={mockSchemaId}
        token={mockToken}
      />
    );

    await user.type(screen.getByLabelText('カテゴリ名'), 'New Category');

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
