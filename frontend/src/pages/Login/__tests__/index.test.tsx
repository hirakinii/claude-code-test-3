/**
 * Login.test.tsx
 * ログインページのコンポーネントテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../index';
import * as AuthContext from '../../../contexts/AuthContext';

// AuthContext のモック
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

// react-router-dom のモック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // AuthContext のモック
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: vi.fn(),
      isAuthenticated: false,
      isAdmin: false,
    });
  });

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'ログイン' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ログイン/i }),
    ).toBeInTheDocument();
  });

  it('should show validation error for empty email', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email format', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    const emailInput = screen.getByLabelText('メールアドレス');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('有効なメールアドレスを入力してください'),
      ).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('パスワードは8文字以上である必要があります'),
      ).toBeInTheDocument();
    });
  });

  it('should call login function with correct credentials', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin123!' } });

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'Admin123!');
      expect(mockNavigate).toHaveBeenCalledWith('/settings/schema');
    });
  });

  it('should show error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Login failed'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should display test account information', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    expect(screen.getByText(/管理者: admin@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/作成者: creator@example.com/)).toBeInTheDocument();
  });
});
