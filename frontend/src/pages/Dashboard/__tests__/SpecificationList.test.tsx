import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import SpecificationList from '../SpecificationList';
import { Specification } from '../../../api/specificationApi';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSpecifications: Specification[] = [
  {
    id: '1',
    title: 'テスト仕様書1',
    status: 'DRAFT',
    version: '1.0',
    schemaId: 'schema-1',
    createdAt: '2025-11-22T00:00:00.000Z',
    updatedAt: '2025-11-22T12:00:00.000Z',
  },
  {
    id: '2',
    title: 'テスト仕様書2',
    status: 'SAVED',
    version: '2.0',
    schemaId: 'schema-1',
    createdAt: '2025-11-21T00:00:00.000Z',
    updatedAt: '2025-11-21T12:00:00.000Z',
  },
  {
    id: '3',
    title: null,
    status: 'REVIEW',
    version: '1.1',
    schemaId: 'schema-1',
    createdAt: '2025-11-20T00:00:00.000Z',
    updatedAt: '2025-11-20T12:00:00.000Z',
  },
];

const mockPagination = {
  page: 1,
  limit: 10,
  total: 3,
  totalPages: 1,
};

const defaultProps = {
  specifications: mockSpecifications,
  pagination: mockPagination,
  onPageChange: vi.fn(),
  onStatusChange: vi.fn(),
  onDelete: vi.fn(),
};

const renderWithRouter = (ui: React.ReactNode) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('SpecificationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render specification list', () => {
    renderWithRouter(<SpecificationList {...defaultProps} />);

    expect(screen.getByText('テスト仕様書1')).toBeInTheDocument();
    expect(screen.getByText('テスト仕様書2')).toBeInTheDocument();
    expect(screen.getByText('（無題）')).toBeInTheDocument();
  });

  it('should display status badges', () => {
    renderWithRouter(<SpecificationList {...defaultProps} />);

    expect(screen.getByText('編集中')).toBeInTheDocument();
    expect(screen.getByText('保存済み')).toBeInTheDocument();
    expect(screen.getByText('確認中')).toBeInTheDocument();
  });

  it('should display version numbers', () => {
    renderWithRouter(<SpecificationList {...defaultProps} />);

    expect(screen.getByText('1.0')).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument();
    expect(screen.getByText('1.1')).toBeInTheDocument();
  });

  it('should show empty message when no specifications', () => {
    renderWithRouter(
      <SpecificationList {...defaultProps} specifications={[]} />,
    );

    expect(
      screen.getByText(
        '仕様書がありません。「新規作成」ボタンから作成してください。',
      ),
    ).toBeInTheDocument();
  });

  it('should show edit button for DRAFT status', () => {
    renderWithRouter(<SpecificationList {...defaultProps} />);

    const editButtons = screen.getAllByLabelText('edit');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('should show view button for SAVED status', () => {
    renderWithRouter(<SpecificationList {...defaultProps} />);

    const viewButtons = screen.getAllByLabelText('view');
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  it('should call onDelete when delete button is clicked and confirmed', () => {
    window.confirm = vi.fn().mockReturnValue(true);

    renderWithRouter(<SpecificationList {...defaultProps} />);

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(defaultProps.onDelete).toHaveBeenCalledWith('1');
  });

  it('should not call onDelete when delete is cancelled', () => {
    window.confirm = vi.fn().mockReturnValue(false);

    renderWithRouter(<SpecificationList {...defaultProps} />);

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(defaultProps.onDelete).not.toHaveBeenCalled();
  });

  it('should show pagination when multiple pages exist', () => {
    const pagination = {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    };

    renderWithRouter(
      <SpecificationList {...defaultProps} pagination={pagination} />,
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should hide pagination when only one page', () => {
    renderWithRouter(<SpecificationList {...defaultProps} />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
