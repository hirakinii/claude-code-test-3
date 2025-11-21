/**
 * Request body type definitions
 * These types define the expected structure of request bodies for API endpoints
 */

import { DataType } from '@prisma/client';

// ============================================
// Auth Request Bodies
// ============================================

export interface LoginRequestBody {
  email: string;
  password: string;
}

// ============================================
// Schema Request Bodies
// ============================================

export interface CreateCategoryRequestBody {
  schemaId: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface UpdateCategoryRequestBody {
  name?: string;
  description?: string;
  displayOrder?: number;
}

export interface CreateFieldRequestBody {
  categoryId: string;
  fieldName: string;
  dataType: DataType;
  isRequired?: boolean;
  options?: string[] | null;
  listTargetEntity?: string | null;
  placeholderText?: string | null;
  displayOrder: number;
}

export interface UpdateFieldRequestBody {
  fieldName?: string;
  dataType?: DataType;
  isRequired?: boolean;
  options?: string[] | null;
  listTargetEntity?: string | null;
  placeholderText?: string | null;
  displayOrder?: number;
}

export interface ResetSchemaRequestBody {
  schemaId: string;
}
