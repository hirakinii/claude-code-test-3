import { useState } from 'react';
import { Container, Typography, Box, Button, CircularProgress, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useSpecifications } from '../../hooks/useSpecifications';
import SpecificationList from './SpecificationList';
import CreateSpecificationModal from './CreateSpecificationModal';
import Header from '../../components/Layout/Header';

function Dashboard() {
  const { token } = useAuth();
  const {
    specifications,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setStatus,
    deleteSpecification,
  } = useSpecifications(token);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const handleCreateSuccess = () => {
    setOpenCreateModal(false);
    void refetch();
  };

  const handleDelete = (id: string) => {
    void (async () => {
      const success = await deleteSpecification(id);
      if (success) {
        void refetch();
      }
    })();
  };

  if (loading) {
    return (
      <>
        <Header />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="calc(100vh - 64px)"
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Typography variant="h4" component="h1">
              仕様書一覧
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateModal(true)}
            >
              新規作成
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <SpecificationList
            specifications={specifications}
            pagination={pagination}
            onPageChange={setPage}
            onStatusChange={setStatus}
            onDelete={handleDelete}
          />
        </Box>

        <CreateSpecificationModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
          onSuccess={handleCreateSuccess}
          token={token || ''}
        />
      </Container>
    </>
  );
}

export default Dashboard;
