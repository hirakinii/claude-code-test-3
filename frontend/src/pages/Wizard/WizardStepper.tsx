import React from 'react';
import { Stepper, Step, StepLabel, StepButton, Box } from '@mui/material';
import { SchemaCategory } from '../../types/wizard';

interface WizardStepperProps {
  categories: SchemaCategory[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

function WizardStepper({
  categories,
  currentStep,
  onStepClick,
}: WizardStepperProps) {
  // Sort categories by display order
  const sortedCategories = [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={currentStep} alternativeLabel>
        {sortedCategories.map((category, index) => (
          <Step key={category.id}>
            <StepButton onClick={() => onStepClick(index)}>
              <StepLabel>{category.name}</StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

export default WizardStepper;
