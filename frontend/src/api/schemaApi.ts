import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Schema {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
}

export interface Category {
  id: string;
  schemaId: string;
  name: string;
  description?: string;
  displayOrder: number;
  fields: Field[];
}

export interface Field {
  id: string;
  categoryId: string;
  fieldName: string;
  dataType: 'TEXT' | 'TEXTAREA' | 'DATE' | 'RADIO' | 'CHECKBOX' | 'LIST';
  isRequired: boolean;
  placeholderText?: string;
  options?: string[];
  listTargetEntity?: string;
  displayOrder: number;
}

export const schemaApi = {
  /**
   * スキーマを取得
   */
  getSchema: async (schemaId: string, token: string): Promise<Schema> => {
    const response = await axios.get(`${API_URL}/api/schema/${schemaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * カテゴリを作成
   */
  createCategory: async (
    data: {
      schemaId: string;
      name: string;
      description?: string;
      displayOrder: number;
    },
    token: string
  ) => {
    const response = await axios.post(`${API_URL}/api/schema/categories`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * カテゴリを更新
   */
  updateCategory: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      displayOrder?: number;
    },
    token: string
  ) => {
    const response = await axios.put(
      `${API_URL}/api/schema/categories/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data;
  },

  /**
   * カテゴリを削除
   */
  deleteCategory: async (id: string, token: string) => {
    await axios.delete(`${API_URL}/api/schema/categories/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * フィールドを作成
   */
  createField: async (
    data: {
      categoryId: string;
      fieldName: string;
      dataType: 'TEXT' | 'TEXTAREA' | 'DATE' | 'RADIO' | 'CHECKBOX' | 'LIST';
      isRequired: boolean;
      options?: string[];
      listTargetEntity?: string;
      placeholderText?: string;
      displayOrder: number;
    },
    token: string
  ) => {
    const response = await axios.post(`${API_URL}/api/schema/fields`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * フィールドを更新
   */
  updateField: async (
    id: string,
    data: {
      fieldName?: string;
      dataType?: 'TEXT' | 'TEXTAREA' | 'DATE' | 'RADIO' | 'CHECKBOX' | 'LIST';
      isRequired?: boolean;
      options?: string[];
      listTargetEntity?: string;
      placeholderText?: string;
      displayOrder?: number;
    },
    token: string
  ) => {
    const response = await axios.put(`${API_URL}/api/schema/fields/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * フィールドを削除
   */
  deleteField: async (id: string, token: string) => {
    await axios.delete(`${API_URL}/api/schema/fields/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * スキーマをデフォルトにリセット
   */
  resetSchema: async (schemaId: string, token: string) => {
    const response = await axios.post(
      `${API_URL}/api/schema/reset`,
      { schemaId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data;
  },
};
