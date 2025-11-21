/**
 * ProtectedRoute.test.tsx
 * ProtectedRoute コンポーネントのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import * as AuthContext from '../../contexts/AuthContext';

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>;
  const LoginPage = () => <div>Login Page</div>;
  const UnauthorizedPage = () => <div>Unauthorized Page</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '1', email: 'test@example.com', fullName: 'Test User', roles: ['CREATOR'] },
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isAdmin: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
      isAdmin: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to unauthorized page when user is not admin but admin is required', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '1', email: 'creator@example.com', fullName: 'Creator User', roles: ['CREATOR'] },
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isAdmin: false,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAdmin>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    // /unauthorized にリダイレクトされる
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user is admin and admin is required', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: '1', email: 'admin@example.com', fullName: 'Admin User', roles: ['ADMINISTRATOR', 'CREATOR'] },
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isAdmin: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAdmin>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
