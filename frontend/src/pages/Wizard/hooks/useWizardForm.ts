import { useState, useCallback } from 'react';
import {
  WizardFormData,
  FieldValue,
  DeliverableInput,
  ContractorRequirementInput,
  BasicBusinessRequirementInput,
  BusinessTaskInput,
} from '../../../types/wizard';

type SubEntityType =
  | 'deliverables'
  | 'contractorRequirements'
  | 'basicBusinessRequirements'
  | 'businessTasks';

type SubEntityData =
  | DeliverableInput[]
  | ContractorRequirementInput[]
  | BasicBusinessRequirementInput[]
  | BusinessTaskInput[];

const initialFormData: WizardFormData = {
  content: {},
  deliverables: [],
  contractorRequirements: [],
  basicBusinessRequirements: [],
  businessTasks: [],
};

export function useWizardForm() {
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);

  const updateField = useCallback((fieldId: string, value: FieldValue) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [fieldId]: value,
      },
    }));
  }, []);

  const updateSubEntity = useCallback(
    (entityType: SubEntityType, data: SubEntityData) => {
      setFormData((prev) => ({
        ...prev,
        [entityType]: data,
      }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  return {
    formData,
    setFormData,
    updateField,
    updateSubEntity,
    resetForm,
  };
}

export default useWizardForm;
