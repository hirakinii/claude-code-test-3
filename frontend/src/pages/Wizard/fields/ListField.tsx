import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  TextField,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  SchemaField,
  WizardFormData,
  DeliverableInput,
  ContractorRequirementInput,
  BasicBusinessRequirementInput,
  BusinessTaskInput,
} from '../../../types/wizard';

type SubEntityData =
  | DeliverableInput[]
  | ContractorRequirementInput[]
  | BasicBusinessRequirementInput[]
  | BusinessTaskInput[];

interface ListFieldProps {
  field: SchemaField;
  formData: WizardFormData;
  onSubEntityChange: (entityType: string, data: SubEntityData) => void;
}

function ListField({ field, formData, onSubEntityChange }: ListFieldProps) {
  const entityType = field.listTargetEntity;

  if (!entityType) return null;

  // Get entity data based on type
  const getEntityData = (): SubEntityData => {
    switch (entityType) {
      case 'Deliverable':
        return formData.deliverables;
      case 'ContractorRequirement':
        return formData.contractorRequirements;
      case 'BasicBusinessRequirement':
        return formData.basicBusinessRequirements;
      case 'BusinessTask':
        return formData.businessTasks;
      default:
        return [];
    }
  };

  const getEntityKey = (): string => {
    switch (entityType) {
      case 'Deliverable':
        return 'deliverables';
      case 'ContractorRequirement':
        return 'contractorRequirements';
      case 'BasicBusinessRequirement':
        return 'basicBusinessRequirements';
      case 'BusinessTask':
        return 'businessTasks';
      default:
        return '';
    }
  };

  const items = getEntityData();
  const entityKey = getEntityKey();

  const handleAdd = () => {
    const newItem = createEmptyItem(entityType);
    onSubEntityChange(entityKey, [...items, newItem] as SubEntityData);
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onSubEntityChange(entityKey, newItems);
  };

  const handleItemChange = (index: number, key: string, value: string) => {
    const newItems = [...items] as Record<string, unknown>[];
    newItems[index] = { ...newItems[index], [key]: value };
    onSubEntityChange(entityKey, newItems as SubEntityData);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">
          {field.fieldName}
          {field.isRequired && <span style={{ color: 'red' }}> *</span>}
        </Typography>
        <Button startIcon={<AddIcon />} onClick={handleAdd} size="small">
          追加
        </Button>
      </Box>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          項目がありません。「追加」ボタンで項目を追加してください。
        </Typography>
      ) : (
        items.map((item, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle2">#{index + 1}</Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemove(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            {renderEntityFields(
              entityType,
              item as Record<string, string>,
              index,
              handleItemChange,
            )}
          </Paper>
        ))
      )}
    </Box>
  );
}

// Create empty item based on entity type
function createEmptyItem(
  entityType: string,
): DeliverableInput | ContractorRequirementInput | BasicBusinessRequirementInput | BusinessTaskInput | Record<string, never> {
  switch (entityType) {
    case 'Deliverable':
      return { name: '', quantity: 1, description: '' };
    case 'ContractorRequirement':
    case 'BasicBusinessRequirement':
      return { category: '', description: '' };
    case 'BusinessTask':
      return { title: '', detailedSpec: '' };
    default:
      return {};
  }
}

// Render form fields based on entity type
function renderEntityFields(
  entityType: string,
  item: Record<string, string>,
  index: number,
  onChange: (index: number, key: string, value: string) => void,
) {
  switch (entityType) {
    case 'Deliverable':
      return (
        <>
          <TextField
            fullWidth
            label="納品物名"
            value={item.name || ''}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="数量"
            type="number"
            value={item.quantity || '1'}
            onChange={(e) => onChange(index, 'quantity', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="説明"
            value={item.description || ''}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            multiline
            rows={2}
          />
        </>
      );

    case 'ContractorRequirement':
    case 'BasicBusinessRequirement':
      return (
        <>
          <TextField
            fullWidth
            label="カテゴリ"
            value={item.category || ''}
            onChange={(e) => onChange(index, 'category', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="内容"
            value={item.description || ''}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            multiline
            rows={2}
          />
        </>
      );

    case 'BusinessTask':
      return (
        <>
          <TextField
            fullWidth
            label="タスク名"
            value={item.title || ''}
            onChange={(e) => onChange(index, 'title', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="詳細仕様"
            value={item.detailedSpec || ''}
            onChange={(e) => onChange(index, 'detailedSpec', e.target.value)}
            multiline
            rows={3}
          />
        </>
      );

    default:
      return null;
  }
}

export default ListField;
