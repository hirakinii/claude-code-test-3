/**
 * authApi.ts
 * 認証API クライアント
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      roles: string[];
    };
  };
}

export const authApi = {
  /**
   * ログイン
   * @param data - ログイン情報（email, password）
   * @returns トークンとユーザー情報
   */
  login: async (data: LoginRequest): Promise<LoginResponse['data']> => {
    const response = await axios.post<LoginResponse>(
      `${API_URL}/api/auth/login`,
      data
    );
    return response.data.data;
  },
};
