import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardForm } from '../hooks/useWizardForm';

describe('useWizardForm', () => {
  it('should initialize with empty form data', () => {
    const { result } = renderHook(() => useWizardForm());

    expect(result.current.formData).toEqual({
      content: {},
      deliverables: [],
      contractorRequirements: [],
      basicBusinessRequirements: [],
      businessTasks: [],
    });
  });

  it('should update field value', () => {
    const { result } = renderHook(() => useWizardForm());

    act(() => {
      result.current.updateField('field-1', 'test value');
    });

    expect(result.current.formData.content['field-1']).toBe('test value');
  });

  it('should update field value with array', () => {
    const { result } = renderHook(() => useWizardForm());

    act(() => {
      result.current.updateField('field-2', ['option1', 'option2']);
    });

    expect(result.current.formData.content['field-2']).toEqual([
      'option1',
      'option2',
    ]);
  });

  it('should update sub-entity deliverables', () => {
    const { result } = renderHook(() => useWizardForm());

    act(() => {
      result.current.updateSubEntity('deliverables', [
        { name: 'Test Deliverable', quantity: 1, description: 'Description' },
      ]);
    });

    expect(result.current.formData.deliverables).toHaveLength(1);
    expect(result.current.formData.deliverables[0].name).toBe('Test Deliverable');
  });

  it('should update sub-entity businessTasks', () => {
    const { result } = renderHook(() => useWizardForm());

    act(() => {
      result.current.updateSubEntity('businessTasks', [
        { title: 'Task 1', detailedSpec: 'Spec details' },
      ]);
    });

    expect(result.current.formData.businessTasks).toHaveLength(1);
    expect(result.current.formData.businessTasks[0].title).toBe('Task 1');
  });

  it('should reset form data', () => {
    const { result } = renderHook(() => useWizardForm());

    act(() => {
      result.current.updateField('field-1', 'test value');
      result.current.updateSubEntity('deliverables', [
        { name: 'Test', quantity: 1 },
      ]);
    });

    expect(result.current.formData.content['field-1']).toBe('test value');
    expect(result.current.formData.deliverables).toHaveLength(1);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual({
      content: {},
      deliverables: [],
      contractorRequirements: [],
      basicBusinessRequirements: [],
      businessTasks: [],
    });
  });

  it('should set form data directly', () => {
    const { result } = renderHook(() => useWizardForm());

    const newFormData = {
      content: { 'field-1': 'value' },
      deliverables: [{ name: 'Del', quantity: 2 }],
      contractorRequirements: [],
      basicBusinessRequirements: [],
      businessTasks: [],
    };

    act(() => {
      result.current.setFormData(newFormData);
    });

    expect(result.current.formData).toEqual(newFormData);
  });
});
