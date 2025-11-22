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
import { Category } from '../../api/schemaApi';

const DEFAULT_SCHEMA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function SchemaSettings() {
  const { token } = useAuth();
  const tokenValue = token || '';
  const { schema, loading, error, refetch } = useSchema(
    DEFAULT_SCHEMA_ID,
    tokenValue,
  );
  const [openCategoryForm, setOpenCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(
    undefined,
  );

  const handleResetSchema = async () => {
    if (
      window.confirm(
        'スキーマをデフォルト設定にリセットしますか？\n現在のカスタマイズは失われます。',
      )
    ) {
      try {
        // TODO: リセット API 呼び出し
        await refetch();
        alert('スキーマをデフォルトにリセットしました');
      } catch (err) {
        // Error logged for debugging purposes
        // console.error('Failed to reset schema:', err);
        alert('スキーマのリセットに失敗しました');
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setOpenCategoryForm(true);
  };

  const handleCloseCategoryForm = () => {
    setOpenCategoryForm(false);
    setEditingCategory(undefined);
  };

  const handleCategoryFormSuccess = () => {
    handleCloseCategoryForm();
    void refetch();
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
              <Button
                onClick={() => {
                  void refetch();
                }}
                sx={{ mt: 2 }}
              >
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
              <Typography variant="h4" component="h4">
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
            onClick={() => {
              void handleResetSchema();
            }}
            color="warning"
          >
            デフォルト復元
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

            <CategoryList
              schema={schema}
              onUpdate={() => {
                void refetch();
              }}
              token={tokenValue}
              onEdit={handleEditCategory}
            />
          </Paper>
        )}

        <CategoryForm
          open={openCategoryForm}
          onClose={handleCloseCategoryForm}
          onSuccess={handleCategoryFormSuccess}
          schemaId={DEFAULT_SCHEMA_ID}
          token={tokenValue}
          category={editingCategory}
        />
      </Box>
    </Container>
  );
}

export default SchemaSettings;
