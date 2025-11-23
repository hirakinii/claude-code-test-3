import React from 'react';
import { SchemaField, FieldValue, WizardFormData } from '../../types/wizard';
import TextField from './fields/TextField';
import TextAreaField from './fields/TextAreaField';
import DateField from './fields/DateField';
import RadioField from './fields/RadioField';
import CheckboxField from './fields/CheckboxField';
import ListField from './fields/ListField';

interface DynamicFieldProps {
  field: SchemaField;
  value: FieldValue;
  formData: WizardFormData;
  onChange: (fieldId: string, value: FieldValue) => void;
  onSubEntityChange: (entityType: string, data: unknown[]) => void;
}

function DynamicField({
  field,
  value,
  formData,
  onChange,
  onSubEntityChange,
}: DynamicFieldProps) {
  const commonProps = {
    field,
    value,
    onChange: (newValue: FieldValue) => onChange(field.id, newValue),
  };

  switch (field.dataType) {
    case 'TEXT':
      return <TextField {...commonProps} />;

    case 'TEXTAREA':
      return <TextAreaField {...commonProps} />;

    case 'DATE':
      return <DateField {...commonProps} />;

    case 'RADIO':
      return <RadioField {...commonProps} />;

    case 'CHECKBOX':
      return <CheckboxField {...commonProps} />;

    case 'LIST':
      return (
        <ListField
          field={field}
          formData={formData}
          onSubEntityChange={onSubEntityChange}
        />
      );

    default:
      return null;
  }
}

export default DynamicField;
