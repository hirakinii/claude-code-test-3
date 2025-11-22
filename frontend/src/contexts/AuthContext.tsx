/**
 * AuthContext.tsx
 * 認証状態管理（ログイン状態、トークン、ユーザー情報）
 */

import { createContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/authApi';

interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 初回ロード時にlocalStorageからトークンを復元
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser) as User);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });

    const { token: newToken, user: newUser } = response;

    setToken(newToken);
    setUser(newUser);

    // localStorageに保存
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.roles.includes('ADMINISTRATOR') ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
