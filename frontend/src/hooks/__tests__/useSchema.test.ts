/**
 * useSchema.test.ts
 * useSchemaカスタムフックのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSchema } from '../useSchema';
import { schemaApi, Schema } from '../../api/schemaApi';

// schemaApi のモック
vi.mock('../../api/schemaApi');

describe('useSchema', () => {
  const mockSchemaId = 'schema-1';
  const mockToken = 'test-token';
  const mockSchema: Schema = {
    id: 'schema-1',
    name: 'Test Schema',
    isDefault: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    categories: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch schema on mount', async () => {
    vi.mocked(schemaApi.getSchema).mockResolvedValue(mockSchema);

    const { result } = renderHook(() => useSchema(mockSchemaId, mockToken));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.schema).toEqual(mockSchema);
      expect(result.current.error).toBeNull();
    });

    expect(schemaApi.getSchema).toHaveBeenCalledWith(mockSchemaId, mockToken);
  });

  it('should set error when token is empty', async () => {
    const { result } = renderHook(() => useSchema(mockSchemaId, ''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        '認証が必要です。ログインしてください。',
      );
      expect(result.current.schema).toBeNull();
    });

    expect(schemaApi.getSchema).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    vi.mocked(schemaApi.getSchema).mockRejectedValue(
      new Error('Network error'),
    );

    const { result } = renderHook(() => useSchema(mockSchemaId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.schema).toBeNull();
    });
  });

  it('should handle non-Error exceptions', async () => {
    vi.mocked(schemaApi.getSchema).mockRejectedValue('String error');

    const { result } = renderHook(() => useSchema(mockSchemaId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch schema');
      expect(result.current.schema).toBeNull();
    });
  });

  it('should refetch schema when refetch is called', async () => {
    vi.mocked(schemaApi.getSchema).mockResolvedValue(mockSchema);

    const { result } = renderHook(() => useSchema(mockSchemaId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // refetch を呼び出し
    act(() => {
      void result.current.refetch();
    });

    await waitFor(() => {
      expect(schemaApi.getSchema).toHaveBeenCalledTimes(2);
    });
  });

  it('should update schema when schemaId changes', async () => {
    vi.mocked(schemaApi.getSchema).mockResolvedValue(mockSchema);

    const { result, rerender } = renderHook(
      ({ schemaId, token }) => useSchema(schemaId, token),
      {
        initialProps: { schemaId: mockSchemaId, token: mockToken },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.schema).toEqual(mockSchema);
    });

    // schemaIdを変更
    const newSchemaId = 'schema-2';
    const newSchema: Schema = {
      ...mockSchema,
      id: newSchemaId,
      name: 'New Schema',
    };
    vi.mocked(schemaApi.getSchema).mockResolvedValue(newSchema);

    rerender({ schemaId: newSchemaId, token: mockToken });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.schema).toEqual(newSchema);
    });

    expect(schemaApi.getSchema).toHaveBeenCalledWith(newSchemaId, mockToken);
  });

  it('should reset loading state on refetch', async () => {
    vi.mocked(schemaApi.getSchema).mockResolvedValue(mockSchema);

    const { result } = renderHook(() => useSchema(mockSchemaId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // refetch を呼び出し
    act(() => {
      void result.current.refetch();
    });

    // loadingがtrueに戻ることを確認
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
