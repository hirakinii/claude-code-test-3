import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { schemaApi } from '../../api/schemaApi';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schemaId: string;
  token: string;
  category?: {
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
  };
}

interface FormData {
  name: string;
  description: string;
  displayOrder: number;
}

function CategoryForm({
  open,
  onClose,
  onSuccess,
  schemaId,
  token,
  category,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      displayOrder: category?.displayOrder || 1,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (category) {
        // 更新
        await schemaApi.updateCategory(category.id, data, token);
      } else {
        // 新規作成
        await schemaApi.createCategory({ ...data, schemaId }, token);
      }
      reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to save category', error);
      alert('カテゴリの保存に失敗しました');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {category ? 'カテゴリ編集' : 'カテゴリ追加'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            fullWidth
            label="カテゴリ名"
            {...register('name', {
              required: 'カテゴリ名は必須です',
              maxLength: {
                value: 200,
                message: 'カテゴリ名は200文字以内で入力してください',
              },
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
            margin="normal"
            autoFocus
          />
          <TextField
            fullWidth
            label="説明"
            {...register('description', {
              maxLength: {
                value: 1000,
                message: '説明は1000文字以内で入力してください',
              },
            })}
            error={!!errors.description}
            helperText={errors.description?.message}
            multiline
            rows={3}
            margin="normal"
          />
          <TextField
            fullWidth
            label="表示順序"
            type="number"
            {...register('displayOrder', {
              required: '表示順序は必須です',
              min: {
                value: 1,
                message: '表示順序は1以上の値を入力してください',
              },
              valueAsNumber: true,
            })}
            error={!!errors.displayOrder}
            helperText={errors.displayOrder?.message}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button type="submit" variant="contained">
            保存
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CategoryForm;
