import React from 'react';
import { TextField as MuiTextField } from '@mui/material';
import { SchemaField, FieldValue } from '../../../types/wizard';

interface DateFieldProps {
  field: SchemaField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}

function DateField({ field, value, onChange }: DateFieldProps) {
  return (
    <MuiTextField
      fullWidth
      label={field.fieldName}
      type="date"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      required={field.isRequired}
      InputLabelProps={{ shrink: true }}
      sx={{ mb: 2 }}
    />
  );
}

export default DateField;
