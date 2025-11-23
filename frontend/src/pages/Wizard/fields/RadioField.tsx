import React from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import { SchemaField, FieldValue } from '../../../types/wizard';

interface RadioFieldProps {
  field: SchemaField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}

function RadioField({ field, value, onChange }: RadioFieldProps) {
  const options = field.options || [];

  return (
    <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
      <FormLabel component="legend" required={field.isRequired}>
        {field.fieldName}
      </FormLabel>
      <RadioGroup
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option}
            value={option}
            control={<Radio />}
            label={option}
          />
        ))}
      </RadioGroup>
      {options.length === 0 && (
        <FormHelperText>選択肢が設定されていません</FormHelperText>
      )}
    </FormControl>
  );
}

export default RadioField;
