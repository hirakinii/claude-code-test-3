import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { SchemaCategory, WizardFormData, FieldValue } from '../../types/wizard';
import DynamicField from './DynamicField';

interface StepContentProps {
  category: SchemaCategory;
  formData: WizardFormData;
  onFieldChange: (fieldId: string, value: FieldValue) => void;
  onSubEntityChange: (entityType: string, data: unknown[]) => void;
  isConfirmStep: boolean;
}

function StepContent({
  category,
  formData,
  onFieldChange,
  onSubEntityChange,
  isConfirmStep,
}: StepContentProps) {
  // Sort fields by display order
  const sortedFields = [...category.fields].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  if (isConfirmStep) {
    return <ConfirmationView formData={formData} />;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {category.name}
      </Typography>
      {category.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {category.description}
        </Typography>
      )}

      <Box>
        {sortedFields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={formData.content[field.id]}
            formData={formData}
            onChange={onFieldChange}
            onSubEntityChange={onSubEntityChange}
          />
        ))}
      </Box>
    </Paper>
  );
}

// Confirmation view for the last step
function ConfirmationView({ formData }: { formData: WizardFormData }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        仕様確認
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        入力内容を確認してください。問題がなければ「保存」ボタンをクリックしてください。
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        入力された内容
      </Typography>

      {/* Content summary */}
      {Object.keys(formData.content).length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="primary">
            フィールド値: {Object.keys(formData.content).length}件
          </Typography>
        </Box>
      )}

      {/* Deliverables summary */}
      {formData.deliverables.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="primary">
            納品物: {formData.deliverables.length}件
          </Typography>
          {formData.deliverables.map((d, i) => (
            <Typography key={i} variant="body2" sx={{ ml: 2 }}>
              - {d.name || '(名称未設定)'}
            </Typography>
          ))}
        </Box>
      )}

      {/* Contractor requirements summary */}
      {formData.contractorRequirements.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="primary">
            受注者要件: {formData.contractorRequirements.length}件
          </Typography>
        </Box>
      )}

      {/* Basic business requirements summary */}
      {formData.basicBusinessRequirements.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="primary">
            業務基本要件: {formData.basicBusinessRequirements.length}件
          </Typography>
        </Box>
      )}

      {/* Business tasks summary */}
      {formData.businessTasks.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="primary">
            業務タスク: {formData.businessTasks.length}件
          </Typography>
          {formData.businessTasks.map((t, i) => (
            <Typography key={i} variant="body2" sx={{ ml: 2 }}>
              - {t.title || '(タスク名未設定)'}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default StepContent;
