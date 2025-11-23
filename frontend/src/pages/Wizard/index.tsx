import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { schemaApi } from '../../api/schemaApi';
import { specificationApi } from '../../api/specificationApi';
import { Schema } from '../../types/wizard';
import WizardStepper from './WizardStepper';
import StepContent from './StepContent';
import useWizardForm from './hooks/useWizardForm';
import useAutoSave from './hooks/useAutoSave';
import Header from '../../components/Layout/Header';

const DEFAULT_SCHEMA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function WizardPage() {
  const { id: specificationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { formData, setFormData, updateField, updateSubEntity } =
    useWizardForm();

  const { isSaving: isAutoSaving, lastSaved, clearLocalStorage, loadFromLocalStorage } =
    useAutoSave(specificationId || '', formData);

  // Load schema and content
  useEffect(() => {
    const loadData = async () => {
      if (!token || !specificationId) return;

      try {
        setLoading(true);

        // Get schema
        const schemaData = await schemaApi.getSchema(DEFAULT_SCHEMA_ID, token);
        setSchema(schemaData);

        // Get existing content
        const contentData = await specificationApi.getSpecificationContent(
          specificationId,
          token,
        );

        // Try to restore from localStorage
        const localData = loadFromLocalStorage();
        if (localData) {
          // Use local data if available
          setFormData(localData);
        } else {
          // Otherwise use server data
          setFormData({
            content: contentData.content,
            deliverables: contentData.deliverables,
            contractorRequirements: contentData.contractorRequirements,
            basicBusinessRequirements: contentData.basicBusinessRequirements,
            businessTasks: contentData.businessTasks,
          });
        }

        setError(null);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, specificationId]);

  const handleNext = () => {
    if (schema && currentStep < schema.categories.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSave = async () => {
    if (!token || !specificationId) return;

    try {
      setSaving(true);
      await specificationApi.saveSpecification(specificationId, formData, token);

      // Clear localStorage after successful save
      clearLocalStorage();

      setSaveMessage('保存しました');
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save:', err);
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!schema) {
    return <Alert severity="error">スキーマの読み込みに失敗しました</Alert>;
  }

  // Sort categories by display order
  const sortedCategories = [...schema.categories].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const currentCategory = sortedCategories[currentStep];
  const isLastStep = currentStep === sortedCategories.length - 1;
  const isConfirmStep = currentCategory.fields.length === 0;

  return (
    <>
      <Header />
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            仕様書作成
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <WizardStepper
            categories={sortedCategories}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />

          <Box sx={{ mt: 4 }}>
            <StepContent
              category={currentCategory}
              formData={formData}
              onFieldChange={updateField}
              onSubEntityChange={updateSubEntity}
              isConfirmStep={isConfirmStep}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              前へ
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isAutoSaving && (
                <Typography variant="caption" color="text.secondary">
                  自動保存中...
                </Typography>
              )}
              {lastSaved && !isAutoSaving && (
                <Typography variant="caption" color="text.secondary">
                  最終保存: {lastSaved.toLocaleTimeString()}
                </Typography>
              )}

              {isLastStep ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : '保存'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  次へ
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Snackbar
          open={!!saveMessage}
          autoHideDuration={3000}
          onClose={() => setSaveMessage(null)}
          message={saveMessage}
        />
      </Container>
    </>
  );
}

export default WizardPage;
