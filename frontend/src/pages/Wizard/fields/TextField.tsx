import React from 'react';
import { TextField as MuiTextField } from '@mui/material';
import { SchemaField, FieldValue } from '../../../types/wizard';

interface TextFieldProps {
  field: SchemaField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}

function TextField({ field, value, onChange }: TextFieldProps) {
  return (
    <MuiTextField
      fullWidth
      label={field.fieldName}
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      required={field.isRequired}
      placeholder={field.placeholderText || undefined}
      sx={{ mb: 2 }}
    />
  );
}

export default TextField;
