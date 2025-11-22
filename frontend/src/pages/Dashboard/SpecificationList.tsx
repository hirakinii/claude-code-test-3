import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Pagination,
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Specification } from '../../api/specificationApi';
import StatusBadge from '../../components/StatusBadge';

interface SpecificationListProps {
  specifications: Specification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  onPageChange: (page: number) => void;
  onStatusChange: (status?: 'DRAFT' | 'REVIEW' | 'SAVED') => void;
  onDelete: (id: string) => void;
}

function SpecificationList({
  specifications,
  pagination,
  onPageChange,
  onStatusChange,
  onDelete,
}: SpecificationListProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = (id: string) => {
    navigate(`/specifications/${id}/edit`);
  };

  const handleView = (id: string) => {
    navigate(`/specifications/${id}`);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value === '') {
      onStatusChange(undefined);
    } else {
      onStatusChange(value as 'DRAFT' | 'REVIEW' | 'SAVED');
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('この仕様書を削除しますか？')) {
      onDelete(id);
    }
  };

  if (specifications.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          仕様書がありません。「新規作成」ボタンから作成してください。
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">ステータス</InputLabel>
          <Select
            labelId="status-filter-label"
            label="ステータス"
            defaultValue=""
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="">すべて</MenuItem>
            <MenuItem value="DRAFT">編集中</MenuItem>
            <MenuItem value="REVIEW">確認中</MenuItem>
            <MenuItem value="SAVED">保存済み</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>件名</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>バージョン</TableCell>
              <TableCell>更新日時</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {specifications.map((spec) => (
              <TableRow key={spec.id} hover>
                <TableCell>{spec.title || '（無題）'}</TableCell>
                <TableCell>
                  <StatusBadge status={spec.status} />
                </TableCell>
                <TableCell>{spec.version}</TableCell>
                <TableCell>{formatDate(spec.updatedAt)}</TableCell>
                <TableCell align="right">
                  {spec.status === 'SAVED' ? (
                    <IconButton
                      aria-label="view"
                      onClick={() => handleView(spec.id)}
                      title="詳細を表示"
                    >
                      <ViewIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      aria-label="edit"
                      onClick={() => handleEdit(spec.id)}
                      title="編集"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => handleDeleteClick(spec.id)}
                    title="削除"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

export default SpecificationList;
