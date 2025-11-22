import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { specificationApi } from '../../api/specificationApi';

interface CreateSpecificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

function CreateSpecificationModal({
  open,
  onClose,
  onSuccess,
  token,
}: CreateSpecificationModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      const specification = await specificationApi.createSpecification(
        undefined,
        token,
      );

      onSuccess();
      // 作成後、編集画面へ遷移
      navigate(`/specifications/${specification.id}/edit`);
    } catch (err) {
      setError('仕様書の作成に失敗しました');
      console.error('Failed to create specification:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>新規仕様書の作成</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" sx={{ mt: 1 }}>
          新しい仕様書を作成します。作成後、ウィザード画面で内容を入力してください。
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          作成
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateSpecificationModal;
