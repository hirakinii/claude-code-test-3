import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { schemaApi, Field } from '../../api/schemaApi';

interface FieldFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryId: string;
  token: string;
  field?: Field | null;
}

interface FormData {
  fieldName: string;
  dataType: 'TEXT' | 'TEXTAREA' | 'DATE' | 'RADIO' | 'CHECKBOX' | 'LIST';
  isRequired: boolean;
  placeholderText: string;
  displayOrder: number;
  options?: string;
  listTargetEntity?: string;
}

function FieldForm({
  open,
  onClose,
  onSuccess,
  categoryId,
  token,
  field,
}: FieldFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      fieldName: field?.fieldName || '',
      dataType: field?.dataType || 'TEXT',
      isRequired: field?.isRequired || false,
      placeholderText: field?.placeholderText || '',
      displayOrder: field?.displayOrder || 1,
      options: field?.options ? JSON.stringify(field.options) : '',
      listTargetEntity: field?.listTargetEntity || '',
    },
  });

  const dataType = watch('dataType');

  const onSubmit = async (data: FormData) => {
    try {
      interface FieldPayload {
        fieldName: string;
        dataType: 'TEXT' | 'TEXTAREA' | 'DATE' | 'RADIO' | 'CHECKBOX' | 'LIST';
        isRequired: boolean;
        placeholderText: string;
        displayOrder: number;
        categoryId: string;
        options?: string[];
        listTargetEntity?: string;
      }

      const payload: FieldPayload = {
        categoryId,
        fieldName: data.fieldName,
        dataType: data.dataType,
        isRequired: data.isRequired,
        placeholderText: data.placeholderText,
        displayOrder: data.displayOrder,
      };

      // options のパース
      if (data.dataType === 'RADIO' || data.dataType === 'CHECKBOX') {
        try {
          payload.options = data.options
            ? (JSON.parse(data.options) as string[])
            : [];
        } catch {
          alert('オプションのJSON形式が正しくありません');
          return;
        }
      } else {
        payload.options = undefined;
      }

      // listTargetEntity の処理
      if (data.dataType === 'LIST') {
        if (!data.listTargetEntity) {
          alert('参照先エンティティは必須です');
          return;
        }
      } else {
        payload.listTargetEntity = undefined;
      }

      if (field) {
        // 更新
        await schemaApi.updateField(field.id, payload, token);
      } else {
        // 新規作成
        await schemaApi.createField(payload, token);
      }
      reset();
      onSuccess();
    } catch (error) {
      // Error logged for debugging purposes
      // console.error('Failed to save field', error);
      alert('フィールドの保存に失敗しました');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{field ? 'フィールド編集' : 'フィールド追加'}</DialogTitle>
      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e);
        }}
      >
        <DialogContent>
          <TextField
            fullWidth
            label="フィールド名"
            {...register('fieldName', {
              required: 'フィールド名は必須です',
              maxLength: {
                value: 200,
                message: 'フィールド名は200文字以内で入力してください',
              },
            })}
            error={!!errors.fieldName}
            helperText={errors.fieldName?.message}
            margin="normal"
            autoFocus
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>データ型</InputLabel>
            <Controller
              name="dataType"
              control={control}
              rules={{ required: 'データ型は必須です' }}
              render={({ field }) => (
                <Select {...field} label="データ型">
                  <MenuItem value="TEXT">テキスト</MenuItem>
                  <MenuItem value="TEXTAREA">テキストエリア</MenuItem>
                  <MenuItem value="DATE">日付</MenuItem>
                  <MenuItem value="RADIO">ラジオボタン</MenuItem>
                  <MenuItem value="CHECKBOX">チェックボックス</MenuItem>
                  <MenuItem value="LIST">動的リスト</MenuItem>
                </Select>
              )}
            />
          </FormControl>

          <Controller
            name="isRequired"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox {...field} checked={field.value} />}
                label="必須項目"
              />
            )}
          />

          <TextField
            fullWidth
            label="プレースホルダー"
            {...register('placeholderText', {
              maxLength: {
                value: 500,
                message: 'プレースホルダーは500文字以内で入力してください',
              },
            })}
            error={!!errors.placeholderText}
            helperText={errors.placeholderText?.message}
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

          {(dataType === 'RADIO' || dataType === 'CHECKBOX') && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                選択肢設定
              </Typography>
              <TextField
                fullWidth
                label="オプション（JSON配列）"
                {...register('options', {
                  required:
                    'ラジオボタン/チェックボックスではオプションは必須です',
                })}
                error={!!errors.options}
                helperText={
                  errors.options?.message ||
                  '例: ["選択肢1", "選択肢2", "選択肢3"]'
                }
                multiline
                rows={3}
                margin="normal"
              />
            </Box>
          )}

          {dataType === 'LIST' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                リスト設定
              </Typography>
              <TextField
                fullWidth
                label="参照先エンティティ"
                {...register('listTargetEntity', {
                  required: '動的リストでは参照先エンティティは必須です',
                })}
                error={!!errors.listTargetEntity}
                helperText={
                  errors.listTargetEntity?.message ||
                  '例: Deliverable, BusinessTask, ContractorRequirement'
                }
                margin="normal"
              />
            </Box>
          )}
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

export default FieldForm;
