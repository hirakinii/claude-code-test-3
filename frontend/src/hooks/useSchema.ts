import { useState, useEffect, useCallback } from 'react';
import { schemaApi, Schema } from '../api/schemaApi';

export function useSchema(schemaId: string, token: string) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await schemaApi.getSchema(schemaId, token);
      setSchema(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch schema';
      setError(errorMessage);
      console.error('Failed to fetch schema:', err);
    } finally {
      setLoading(false);
    }
  }, [schemaId, token]);

  useEffect(() => {
    if (!token) {
      // 認証トークンがない場合
      setLoading(false);
      setError('認証が必要です。ログインしてください。');
      return;
    }

    if (schemaId && token) {
      fetchSchema();
    }
  }, [schemaId, token, fetchSchema]);

  return {
    schema,
    loading,
    error,
    refetch: fetchSchema,
  };
}
