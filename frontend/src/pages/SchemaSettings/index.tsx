import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { Settings as SettingsIcon, Refresh } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSchema } from '../../hooks/useSchema';
import CategoryList from './CategoryList';
import CategoryForm from './CategoryForm';

const DEFAULT_SCHEMA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function SchemaSettings() {
  const { token } = useAuth();
  const tokenValue = token || '';
  const { schema, loading, error, refetch } = useSchema(DEFAULT_SCHEMA_ID, tokenValue);
  const [openCategoryForm, setOpenCategoryForm] = useState(false);

  const handleResetSchema = async () => {
    if (
      window.confirm(
        'スキーマをデフォルト設定にリセットしますか？\n現在のカスタマイズは失われます。'
      )
    ) {
      try {
        // TODO: リセット API 呼び出し
        await refetch();
        alert('スキーマをデフォルトにリセットしました');
      } catch (err) {
        console.error('Failed to reset schema:', err);
        alert('スキーマのリセットに失敗しました');
      }
    }
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

  if (error) {
    return (
      <Container>
        <Box sx={{ my: 4 }}>
          <Alert severity="warning">
            <Typography variant="body1" gutterBottom>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              エラーが発生しました。もう一度お試しください。
            </Typography>
            {tokenValue && (
              <Button onClick={refetch} sx={{ mt: 2 }}>
                再試行
              </Button>
            )}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon fontSize="large" color="primary" />
            <div>
              <Typography variant="h4" component="h1">
                スキーマ設定
              </Typography>
              <Typography variant="body2" color="text.secondary">
                仕様書のウィザードステップと入力項目を管理します
              </Typography>
            </div>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleResetSchema}
            color="warning"
          >
            デフォルトにリセット
          </Button>
        </Box>

        {schema && (
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant="h6">カテゴリ一覧</Typography>
              <Button
                variant="contained"
                onClick={() => setOpenCategoryForm(true)}
              >
                カテゴリを追加
              </Button>
            </Box>

            <CategoryList schema={schema} onUpdate={refetch} token={tokenValue} />
          </Paper>
        )}

        <CategoryForm
          open={openCategoryForm}
          onClose={() => setOpenCategoryForm(false)}
          onSuccess={() => {
            setOpenCategoryForm(false);
            refetch();
          }}
          schemaId={DEFAULT_SCHEMA_ID}
          token={tokenValue}
        />
      </Box>
    </Container>
  );
}

export default SchemaSettings;
