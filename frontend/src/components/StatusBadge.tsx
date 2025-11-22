import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: 'DRAFT' | 'REVIEW' | 'SAVED';
}

const statusConfig = {
  DRAFT: { label: '編集中', color: 'warning' as const },
  REVIEW: { label: '確認中', color: 'info' as const },
  SAVED: { label: '保存済み', color: 'success' as const },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return <Chip label={config.label} color={config.color} size="small" />;
}

export default StatusBadge;
