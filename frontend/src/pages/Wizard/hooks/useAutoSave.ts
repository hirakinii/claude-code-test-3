import { useEffect, useState, useRef } from 'react';
import { WizardFormData } from '../../../types/wizard';

const DEBOUNCE_DELAY = 500;

export function useAutoSave(specificationId: string, formData: WizardFormData) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);

    // Debounce save
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          `wizard_${specificationId}`,
          JSON.stringify(formData),
        );
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [specificationId, formData]);

  const loadFromLocalStorage = (): WizardFormData | null => {
    try {
      const saved = localStorage.getItem(`wizard_${specificationId}`);
      if (saved) {
        return JSON.parse(saved) as WizardFormData;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  };

  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(`wizard_${specificationId}`);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };

  return {
    isSaving,
    lastSaved,
    loadFromLocalStorage,
    clearLocalStorage,
  };
}

export default useAutoSave;
