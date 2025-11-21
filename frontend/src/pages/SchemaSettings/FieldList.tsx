import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { Category, schemaApi, Field } from '../../api/schemaApi';
import FieldForm from './FieldForm';

interface FieldListProps {
  category: Category;
  token: string;
  onUpdate: () => void;
}

function FieldList({ category, token, onUpdate }: FieldListProps) {
  const [openFieldForm, setOpenFieldForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  const handleDeleteField = async (fieldId: string) => {
    if (window.confirm('このフィールドを削除しますか？')) {
      try {
        await schemaApi.deleteField(fieldId, token);
        onUpdate();
      } catch (error) {
        // Error logged for debugging purposes
        // console.error('Failed to delete field:', error);
        alert('フィールドの削除に失敗しました');
      }
    }
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setOpenFieldForm(true);
  };

  const handleCloseForm = () => {
    setOpenFieldForm(false);
    setEditingField(null);
  };

  const handleSuccess = () => {
    handleCloseForm();
    onUpdate();
  };

  if (!category.fields || category.fields.length === 0) {
    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="subtitle1">フィールド</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setOpenFieldForm(true)}
          >
            フィールドを追加
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          フィールドがありません
        </Typography>
        <FieldForm
          open={openFieldForm}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
          categoryId={category.id}
          token={token}
          field={editingField}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="subtitle1">フィールド</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setOpenFieldForm(true)}
        >
          フィールドを追加
        </Button>
      </Box>

      <List dense>
        {category.fields.map((field) => (
          <ListItem
            key={field.id}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 0.5,
              bgcolor: 'background.default',
            }}
          >
            <ListItemText
              primary={field.fieldName}
              secondary={
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  <Chip
                    label={field.dataType}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {field.isRequired && (
                    <Chip label="必須" size="small" color="error" />
                  )}
                  <Chip
                    label={`順序: ${field.displayOrder}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              }
            />
            <IconButton
              edge="end"
              aria-label="edit"
              onClick={() => handleEditField(field)}
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => { void handleDeleteField(field.id); }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </ListItem>
        ))}
      </List>

      <FieldForm
        open={openFieldForm}
        onClose={handleCloseForm}
        onSuccess={handleSuccess}
        categoryId={category.id}
        token={token}
        field={editingField}
      />
    </Box>
  );
}

export default FieldList;
