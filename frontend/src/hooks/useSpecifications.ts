import { useState, useEffect, useCallback } from 'react';
import {
  specificationApi,
  PaginatedSpecifications,
  GetSpecificationsParams,
  Specification,
} from '../api/specificationApi';

interface UseSpecificationsReturn {
  specifications: Specification[];
  pagination: PaginatedSpecifications['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setStatus: (status?: 'DRAFT' | 'REVIEW' | 'SAVED') => void;
  createSpecification: () => Promise<Specification | null>;
  deleteSpecification: (id: string) => Promise<boolean>;
}

export function useSpecifications(
  token: string | null,
): UseSpecificationsReturn {
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
      // eslint-disable-next-line no-console
      console.error('Failed to fetch specifications:', err);
    } finally {
      setLoading(false);
    }
  }, [token, params]);

  useEffect(() => {
    void fetchSpecifications();
  }, [fetchSpecifications]);

  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const setStatus = useCallback((status?: 'DRAFT' | 'REVIEW' | 'SAVED') => {
    setParams((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const createSpecification =
    useCallback(async (): Promise<Specification | null> => {
      if (!token) {
        setError('認証が必要です');
        return null;
      }

      try {
        const newSpec = await specificationApi.createSpecification(
          undefined,
          token,
        );
        await fetchSpecifications();
        return newSpec;
      } catch (err) {
        setError('仕様書の作成に失敗しました');
        // eslint-disable-next-line no-console
        console.error('Failed to create specification:', err);
        return null;
      }
    }, [token, fetchSpecifications]);

  const deleteSpecification = useCallback(
    async (id: string): Promise<boolean> => {
      if (!token) {
        setError('認証が必要です');
        return false;
      }

      try {
        await specificationApi.deleteSpecification(id, token);
        await fetchSpecifications();
        return true;
      } catch (err) {
        setError('仕様書の削除に失敗しました');
        // eslint-disable-next-line no-console
        console.error('Failed to delete specification:', err);
        return false;
      }
    },
    [token, fetchSpecifications],
  );

  return {
    specifications: data?.items || [],
    pagination: data?.pagination || null,
    loading,
    error,
    refetch: fetchSpecifications,
    setPage,
    setStatus,
    createSpecification,
    deleteSpecification,
  };
}
