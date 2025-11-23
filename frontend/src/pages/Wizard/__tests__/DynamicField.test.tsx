import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DynamicField from '../DynamicField';
import { SchemaField, WizardFormData } from '../../../types/wizard';

const mockFormData: WizardFormData = {
  content: {},
  deliverables: [],
  contractorRequirements: [],
  basicBusinessRequirements: [],
  businessTasks: [],
};

const createMockField = (
  overrides: Partial<SchemaField> = {},
): SchemaField => ({
  id: 'test-field-id',
  fieldName: 'Test Field',
  dataType: 'TEXT',
  isRequired: false,
  options: null,
  placeholderText: null,
  listTargetEntity: null,
  displayOrder: 1,
  ...overrides,
});

describe('DynamicField', () => {
  it('should render TextField for TEXT type', () => {
    const field = createMockField({ dataType: 'TEXT', fieldName: 'Text Field' });
    const onChange = vi.fn();
    const onSubEntityChange = vi.fn();

    render(
      <DynamicField
        field={field}
        value={null}
        formData={mockFormData}
        onChange={onChange}
        onSubEntityChange={onSubEntityChange}
      />,
    );

    expect(screen.getByLabelText('Text Field')).toBeInTheDocument();
  });

  it('should render TextAreaField for TEXTAREA type', () => {
    const field = createMockField({
      dataType: 'TEXTAREA',
      fieldName: 'TextArea Field',
    });
    const onChange = vi.fn();
    const onSubEntityChange = vi.fn();

    render(
      <DynamicField
        field={field}
        value={null}
        formData={mockFormData}
        onChange={onChange}
        onSubEntityChange={onSubEntityChange}
      />,
    );

    expect(screen.getByLabelText('TextArea Field')).toBeInTheDocument();
  });

  it('should render DateField for DATE type', () => {
    const field = createMockField({ dataType: 'DATE', fieldName: 'Date Field' });
    const onChange = vi.fn();
    const onSubEntityChange = vi.fn();

    render(
      <DynamicField
        field={field}
        value={null}
        formData={mockFormData}
        onChange={onChange}
        onSubEntityChange={onSubEntityChange}
      />,
    );

    expect(screen.getByLabelText('Date Field')).toBeInTheDocument();
  });

  it('should render RadioField for RADIO type', () => {
    const field = createMockField({
      dataType: 'RADIO',
      fieldName: 'Radio Field',
      options: ['Option A', 'Option B'],
    });
    const onChange = vi.fn();
    const onSubEntityChange = vi.fn();

    render(
      <DynamicField
        field={field}
        value={null}
        formData={mockFormData}
        onChange={onChange}
        onSubEntityChange={onSubEntityChange}
      />,
    );

    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('should render CheckboxField for CHECKBOX type', () => {
    const field = createMockField({
      dataType: 'CHECKBOX',
      fieldName: 'Checkbox Field',
      options: ['Check A', 'Check B'],
    });
    const onChange = vi.fn();
    const onSubEntityChange = vi.fn();

    render(
      <DynamicField
        field={field}
        value={[]}
        formData={mockFormData}
        onChange={onChange}
        onSubEntityChange={onSubEntityChange}
      />,
    );

    expect(screen.getByText('Check A')).toBeInTheDocument();
    expect(screen.getByText('Check B')).toBeInTheDocument();
  });

  it('should render ListField for LIST type', () => {
    const field = createMockField({
      dataType: 'LIST',
      fieldName: 'List Field',
      listTargetEntity: 'Deliverable',
    });
    const onChange = vi.fn();
    const onSubEntityChange = vi.fn();

    render(
      <DynamicField
        field={field}
        value={null}
        formData={mockFormData}
        onChange={onChange}
        onSubEntityChange={onSubEntityChange}
      />,
    );

    expect(screen.getByText('List Field')).toBeInTheDocument();
    expect(screen.getByText('追加')).toBeInTheDocument();
  });

  it('should call onChange when text input changes', () => {
    const field = createMockField({ dataType: 'TEXT', fieldName: 'Input Field' });
    const onChange = vi.fn();
    const onSubEntityChange = vi.fn();

    render(
      <DynamicField
        field={field}
        value=""
        formData={mockFormData}
        onChange={onChange}
        onSubEntityChange={onSubEntityChange}
      />,
    );

    const input = screen.getByLabelText('Input Field');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(onChange).toHaveBeenCalledWith('test-field-id', 'new value');
  });

  it('should display required indicator for required fields', () => {
    const field = createMockField({
      dataType: 'TEXT',
      fieldName: 'Required Field',
      isRequired: true,
    });
    const onChange = vi.fn();
    const onSubEntityChange = vi.fn();

    render(
      <DynamicField
        field={field}
        value=""
        formData={mockFormData}
        onChange={onChange}
        onSubEntityChange={onSubEntityChange}
      />,
    );

    // Required fields should have an asterisk
    const label = screen.getByLabelText(/Required Field/);
    expect(label).toBeRequired();
  });
});
