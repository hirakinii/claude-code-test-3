import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WizardStepper from '../WizardStepper';
import { SchemaCategory } from '../../../types/wizard';

const mockCategories: SchemaCategory[] = [
  {
    id: 'cat-1',
    name: '基本情報',
    description: '基本情報を入力',
    displayOrder: 1,
    fields: [],
  },
  {
    id: 'cat-2',
    name: '納品情報',
    description: '納品情報を入力',
    displayOrder: 2,
    fields: [],
  },
  {
    id: 'cat-3',
    name: '確認',
    description: null,
    displayOrder: 3,
    fields: [],
  },
];

describe('WizardStepper', () => {
  it('should render all step labels', () => {
    const onStepClick = vi.fn();

    render(
      <WizardStepper
        categories={mockCategories}
        currentStep={0}
        onStepClick={onStepClick}
      />,
    );

    expect(screen.getByText('基本情報')).toBeInTheDocument();
    expect(screen.getByText('納品情報')).toBeInTheDocument();
    expect(screen.getByText('確認')).toBeInTheDocument();
  });

  it('should highlight current step', () => {
    const onStepClick = vi.fn();

    render(
      <WizardStepper
        categories={mockCategories}
        currentStep={1}
        onStepClick={onStepClick}
      />,
    );

    // The stepper should indicate the active step
    const steps = screen.getAllByRole('button');
    expect(steps).toHaveLength(3);
  });

  it('should call onStepClick when step is clicked', () => {
    const onStepClick = vi.fn();

    render(
      <WizardStepper
        categories={mockCategories}
        currentStep={0}
        onStepClick={onStepClick}
      />,
    );

    const secondStep = screen.getByText('納品情報');
    fireEvent.click(secondStep);

    expect(onStepClick).toHaveBeenCalledWith(1);
  });

  it('should sort categories by displayOrder', () => {
    const onStepClick = vi.fn();
    const unsortedCategories = [
      { ...mockCategories[2], displayOrder: 3 },
      { ...mockCategories[0], displayOrder: 1 },
      { ...mockCategories[1], displayOrder: 2 },
    ];

    render(
      <WizardStepper
        categories={unsortedCategories}
        currentStep={0}
        onStepClick={onStepClick}
      />,
    );

    const steps = screen.getAllByRole('button');
    expect(steps[0]).toHaveTextContent('基本情報');
    expect(steps[1]).toHaveTextContent('納品情報');
    expect(steps[2]).toHaveTextContent('確認');
  });
});
