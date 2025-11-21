/**
 * FieldForm.test.tsx
 * FieldFormコンポーネントのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FieldForm from '../FieldForm';
import { schemaApi, Field } from '../../../api/schemaApi';

// schemaApi のモック
vi.mock('../../../api/schemaApi');

describe('FieldForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockToken = 'test-token';
  const mockCategoryId = 'cat-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form for creating new field', () => {
    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    expect(screen.getByText('フィールド追加')).toBeInTheDocument();
    expect(screen.getByLabelText('フィールド名')).toBeInTheDocument();
    // MUIのSelectはgetByLabelTextで取得できないため、comboboxで確認
    expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument();
    expect(screen.getByLabelText('必須項目')).toBeInTheDocument();
  });

  it('should render form for editing existing field', () => {
    const field: Field = {
      id: 'field-1',
      categoryId: mockCategoryId,
      fieldName: 'Existing Field',
      dataType: 'TEXT',
      isRequired: true,
      placeholderText: 'Placeholder',
      displayOrder: 5,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
        field={field}
      />
    );

    expect(screen.getByText('フィールド編集')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Field')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Placeholder')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    // react-hook-formのバリデーションエラーが非同期で表示されるのを待つ
    await waitFor(() => {
      const fieldNameError = screen.queryByText('フィールド名は必須です');
      const displayOrderError = screen.queryByText('表示順序は必須です');
      expect(fieldNameError || displayOrderError).toBeTruthy();
    });
  });

  it('should show options field for RADIO dataType', async () => {
    const user = userEvent.setup();

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    // データ型をRADIOに変更 (最初のcomboboxがデータ型のSelect)
    const dataTypeSelect = screen.getAllByRole('combobox')[0];
    await user.click(dataTypeSelect);
    const radioOption = screen.getByRole('option', { name: 'ラジオボタン' });
    await user.click(radioOption);

    // オプションフィールドが表示される
    await waitFor(() => {
      expect(screen.getByLabelText('オプション（JSON配列）')).toBeInTheDocument();
    });
  });

  it('should show options field for CHECKBOX dataType', async () => {
    const user = userEvent.setup();

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    // データ型をCHECKBOXに変更
    const dataTypeSelect = screen.getAllByRole('combobox')[0];
    await user.click(dataTypeSelect);
    const checkboxOption = screen.getByRole('option', { name: 'チェックボックス' });
    await user.click(checkboxOption);

    // オプションフィールドが表示される
    await waitFor(() => {
      expect(screen.getByLabelText('オプション（JSON配列）')).toBeInTheDocument();
    });
  });

  it('should show listTargetEntity field for LIST dataType', async () => {
    const user = userEvent.setup();

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    // データ型をLISTに変更
    const dataTypeSelect = screen.getAllByRole('combobox')[0];
    await user.click(dataTypeSelect);
    const listOption = screen.getByRole('option', { name: '動的リスト' });
    await user.click(listOption);

    // listTargetEntityフィールドが表示される
    await waitFor(() => {
      expect(screen.getByLabelText('参照先エンティティ')).toBeInTheDocument();
    });
  });

  it('should validate JSON format for options', async () => {
    const user = userEvent.setup();
    window.alert = vi.fn();

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    await user.type(screen.getByLabelText('フィールド名'), 'Test Field');

    // データ型をRADIOに変更
    const dataTypeSelect = screen.getAllByRole('combobox')[0];
    await user.click(dataTypeSelect);
    const radioOption = screen.getByRole('option', { name: 'ラジオボタン' });
    await user.click(radioOption);

    await waitFor(() => {
      expect(screen.getByLabelText('オプション（JSON配列）')).toBeInTheDocument();
    });

    // 不正なJSON形式を入力
    const optionsInput = screen.getByLabelText('オプション（JSON配列）');
    fireEvent.change(optionsInput, { target: { value: 'invalid json' } });

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('オプションのJSON形式が正しくありません');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should validate listTargetEntity for LIST dataType', async () => {
    const user = userEvent.setup();

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    await user.type(screen.getByLabelText('フィールド名'), 'Test Field');

    // データ型をLISTに変更
    const dataTypeSelect = screen.getAllByRole('combobox')[0];
    await user.click(dataTypeSelect);
    const listOption = screen.getByRole('option', { name: '動的リスト' });
    await user.click(listOption);

    await waitFor(() => {
      expect(screen.getByLabelText('参照先エンティティ')).toBeInTheDocument();
    });

    // listTargetEntityを空のままsubmit（react-hook-formがバリデーションエラーを表示）
    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('動的リストでは参照先エンティティは必須です')).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should create new field with TEXT dataType', async () => {
    const user = userEvent.setup();
    vi.mocked(schemaApi.createField).mockResolvedValue({
      id: 'new-field',
      categoryId: mockCategoryId,
      fieldName: 'New Field',
      dataType: 'TEXT',
      isRequired: false,
      placeholderText: 'Enter text',
      displayOrder: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    await user.type(screen.getByLabelText('フィールド名'), 'New Field');
    await user.type(screen.getByLabelText('プレースホルダー'), 'Enter text');

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(schemaApi.createField).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldName: 'New Field',
          dataType: 'TEXT',
          isRequired: false,
          placeholderText: 'Enter text',
          displayOrder: 1,
          categoryId: mockCategoryId,
        }),
        mockToken
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should create new field with RADIO dataType and options', async () => {
    const user = userEvent.setup();
    vi.mocked(schemaApi.createField).mockResolvedValue({
      id: 'new-field',
      categoryId: mockCategoryId,
      fieldName: 'New Radio Field',
      dataType: 'RADIO',
      isRequired: true,
      placeholderText: '',
      displayOrder: 1,
      options: ['Option 1', 'Option 2'],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    await user.type(screen.getByLabelText('フィールド名'), 'New Radio Field');

    // データ型をRADIOに変更
    const dataTypeSelect = screen.getAllByRole('combobox')[0];
    await user.click(dataTypeSelect);
    const radioOption = screen.getByRole('option', { name: 'ラジオボタン' });
    await user.click(radioOption);

    await waitFor(() => {
      expect(screen.getByLabelText('オプション（JSON配列）')).toBeInTheDocument();
    });

    // JSONオプションを入力
    const optionsInput = screen.getByLabelText('オプション（JSON配列）');
    fireEvent.change(optionsInput, { target: { value: '["Option 1", "Option 2"]' } });

    // 必須項目チェック
    await user.click(screen.getByLabelText('必須項目'));

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(schemaApi.createField).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldName: 'New Radio Field',
          dataType: 'RADIO',
          isRequired: true,
          options: ['Option 1', 'Option 2'],
          categoryId: mockCategoryId,
        }),
        mockToken
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should update existing field', async () => {
    const user = userEvent.setup();
    const field: Field = {
      id: 'field-1',
      categoryId: mockCategoryId,
      fieldName: 'Existing Field',
      dataType: 'TEXT',
      isRequired: true,
      placeholderText: '',
      displayOrder: 5,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };

    vi.mocked(schemaApi.updateField).mockResolvedValue({
      ...field,
      fieldName: 'Updated Field',
    });

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
        field={field}
      />
    );

    const fieldNameInput = screen.getByLabelText('フィールド名');
    await user.clear(fieldNameInput);
    await user.type(fieldNameInput, 'Updated Field');

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(schemaApi.updateField).toHaveBeenCalledWith(
        'field-1',
        expect.objectContaining({
          fieldName: 'Updated Field',
          dataType: 'TEXT',
          isRequired: true,
        }),
        mockToken
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle API error on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(schemaApi.createField).mockRejectedValue(new Error('API Error'));
    window.alert = vi.fn();

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    await user.type(screen.getByLabelText('フィールド名'), 'New Field');

    const submitButton = screen.getByRole('button', { name: '保存' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('フィールドの保存に失敗しました');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should close dialog and reset form on cancel', async () => {
    const user = userEvent.setup();

    render(
      <FieldForm
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        categoryId={mockCategoryId}
        token={mockToken}
      />
    );

    await user.type(screen.getByLabelText('フィールド名'), 'New Field');

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
