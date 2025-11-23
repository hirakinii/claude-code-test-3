import React from 'react';
import { TextField as MuiTextField } from '@mui/material';
import { SchemaField, FieldValue } from '../../../types/wizard';

interface TextAreaFieldProps {
  field: SchemaField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}

function TextAreaField({ field, value, onChange }: TextAreaFieldProps) {
  return (
    <MuiTextField
      fullWidth
      label={field.fieldName}
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      required={field.isRequired}
      placeholder={field.placeholderText || undefined}
      multiline
      rows={4}
      sx={{ mb: 2 }}
    />
  );
}

export default TextAreaField;
