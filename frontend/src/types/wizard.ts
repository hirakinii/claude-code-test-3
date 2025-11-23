/**
 * Wizard type definitions
 * Types for the dynamic wizard form system
 */

// Field value type (EAV pattern)
export type FieldValue = string | string[] | null;

// Data types supported by schema fields
export type DataType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'DATE'
  | 'RADIO'
  | 'CHECKBOX'
  | 'LIST';

// Schema field definition
export interface SchemaField {
  id: string;
  fieldName: string;
  dataType: DataType;
  isRequired: boolean;
  options: string[] | null;
  placeholderText: string | null;
  listTargetEntity: string | null;
  displayOrder: number;
}

// Schema category (wizard step)
export interface SchemaCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  fields: SchemaField[];
}

// Schema definition
export interface Schema {
  id: string;
  name: string;
  categories: SchemaCategory[];
}

// Sub-entity input types
export interface DeliverableInput {
  id?: string;
  name: string;
  quantity?: number;
  description?: string;
}

export interface ContractorRequirementInput {
  id?: string;
  category: string;
  description: string;
}

export interface BasicBusinessRequirementInput {
  id?: string;
  category: string;
  description: string;
}

export interface BusinessTaskInput {
  id?: string;
  title: string;
  detailedSpec: string;
}

// Wizard form data
export interface WizardFormData {
  content: Record<string, FieldValue>;
  deliverables: DeliverableInput[];
  contractorRequirements: ContractorRequirementInput[];
  basicBusinessRequirements: BasicBusinessRequirementInput[];
  businessTasks: BusinessTaskInput[];
}

// Specification content response from API
export interface SpecificationContentResponse {
  id: string;
  title: string | null;
  status: 'DRAFT' | 'REVIEW' | 'SAVED';
  version: string;
  schemaId: string;
  content: Record<string, FieldValue>;
  deliverables: DeliverableInput[];
  contractorRequirements: ContractorRequirementInput[];
  basicBusinessRequirements: BasicBusinessRequirementInput[];
  businessTasks: BusinessTaskInput[];
}

// Save specification response
export interface SaveSpecificationResponse {
  id: string;
  title: string | null;
  status: 'DRAFT' | 'REVIEW' | 'SAVED';
  version: string;
  updatedAt: string;
}
