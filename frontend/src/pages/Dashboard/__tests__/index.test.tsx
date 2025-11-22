import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../index';
import * as AuthContext from '../../../contexts/AuthContext';
import * as specificationApi from '../../../api/specificationApi';

vi.mock('../../../api/specificationApi', () => ({
  specificationApi: {
    getSpecifications: vi.fn(),
    createSpecification: vi.fn(),
    deleteSpecification: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSpecifications = {
  items: [
    {
      id: '1',
      title: 'テスト仕様書',
      status: 'DRAFT' as const,
      version: '1.0',
      schemaId: 'schema-1',
      createdAt: '2025-11-22T00:00:00.000Z',
      updatedAt: '2025-11-22T12:00:00.000Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
};

const mockAuthContext = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    roles: ['CREATOR'],
  },
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: true,
  isAdmin: false,
};

const renderWithProviders = (ui: React.ReactNode) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock useAuth to return authenticated state
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthContext);
    (
      specificationApi.specificationApi.getSpecifications as ReturnType<
        typeof vi.fn
      >
    ).mockResolvedValue(mockSpecifications);
  });

  it('should render dashboard title', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('仕様書一覧')).toBeInTheDocument();
    });
  });

  it('should render new specification button', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('新規作成')).toBeInTheDocument();
    });
  });

  it('should render specification list', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('テスト仕様書')).toBeInTheDocument();
    });
  });

  it('should show loading spinner initially', () => {
    (
      specificationApi.specificationApi.getSpecifications as ReturnType<
        typeof vi.fn
      >
    ).mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<Dashboard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error message when API fails', async () => {
    (
      specificationApi.specificationApi.getSpecifications as ReturnType<
        typeof vi.fn
      >
    ).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('仕様書の取得に失敗しました'),
      ).toBeInTheDocument();
    });
  });

  it('should open create modal when new button clicked', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('新規作成')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('新規作成'));

    expect(screen.getByText('新規仕様書の作成')).toBeInTheDocument();
  });

  it('should show header with app title', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('仕様書作成支援アプリ')).toBeInTheDocument();
    });
  });
});
