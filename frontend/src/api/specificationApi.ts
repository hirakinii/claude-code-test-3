import axios from 'axios';
import {
  SpecificationContentResponse,
  SaveSpecificationResponse,
  WizardFormData,
} from '../types/wizard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Specification {
  id: string;
  title: string | null;
  status: 'DRAFT' | 'REVIEW' | 'SAVED';
  version: string;
  schemaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecificationWithAuthor extends Specification {
  author: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface PaginatedSpecifications {
  items: Specification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetSpecificationsParams {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'REVIEW' | 'SAVED';
  sort?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const specificationApi = {
  /**
   * 仕様書一覧を取得
   */
  getSpecifications: async (
    params: GetSpecificationsParams,
    token: string,
  ): Promise<PaginatedSpecifications> => {
    const queryParams = new URLSearchParams();
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.status) {
      queryParams.append('status', params.status);
    }
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }

    const response = await axios.get<ApiResponse<PaginatedSpecifications>>(
      `${API_URL}/api/specifications?${queryParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data.data;
  },

  /**
   * 新規仕様書を作成
   */
  createSpecification: async (
    schemaId?: string,
    token?: string,
  ): Promise<Specification> => {
    const response = await axios.post<ApiResponse<Specification>>(
      `${API_URL}/api/specifications`,
      { schemaId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data.data;
  },

  /**
   * 仕様書を取得
   */
  getSpecificationById: async (
    id: string,
    token: string,
  ): Promise<SpecificationWithAuthor> => {
    const response = await axios.get<ApiResponse<SpecificationWithAuthor>>(
      `${API_URL}/api/specifications/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data.data;
  },

  /**
   * 仕様書を削除
   */
  deleteSpecification: async (id: string, token: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/specifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * 仕様書コンテンツを取得（ウィザード用）
   */
  getSpecificationContent: async (
    id: string,
    token: string,
  ): Promise<SpecificationContentResponse> => {
    const response = await axios.get<ApiResponse<SpecificationContentResponse>>(
      `${API_URL}/api/specifications/${id}/content`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data.data;
  },

  /**
   * 仕様書を保存（ウィザード用）
   */
  saveSpecification: async (
    id: string,
    formData: WizardFormData,
    token: string,
  ): Promise<SaveSpecificationResponse> => {
    const response = await axios.put<ApiResponse<SaveSpecificationResponse>>(
      `${API_URL}/api/specifications/${id}`,
      formData,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data.data;
  },
};
