import React from 'react';
import {
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from '@mui/material';
import { SchemaField, FieldValue } from '../../../types/wizard';

interface CheckboxFieldProps {
  field: SchemaField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}

function CheckboxField({ field, value, onChange }: CheckboxFieldProps) {
  const options = field.options || [];
  const selectedValues = (value as string[]) || [];

  const handleChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, option]);
    } else {
      onChange(selectedValues.filter((v) => v !== option));
    }
  };

  return (
    <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
      <FormLabel component="legend" required={field.isRequired}>
        {field.fieldName}
      </FormLabel>
      <FormGroup>
        {options.map((option) => (
          <FormControlLabel
            key={option}
            control={
              <Checkbox
                checked={selectedValues.includes(option)}
                onChange={(e) => handleChange(option, e.target.checked)}
              />
            }
            label={option}
          />
        ))}
      </FormGroup>
      {options.length === 0 && (
        <FormHelperText>選択肢が設定されていません</FormHelperText>
      )}
    </FormControl>
  );
}

export default CheckboxField;
