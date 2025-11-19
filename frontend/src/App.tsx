import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, CircularProgress } from '@mui/material';
import { Settings } from '@mui/icons-material';

const SchemaSettings = lazy(() => import('./pages/SchemaSettings'));

function HomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          仕様書作成支援アプリ
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Phase 2: スキーマ管理機能実装完了
        </Typography>
        <Typography variant="body1" color="text.secondary">
          環境: {import.meta.env.MODE}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          API URL: {import.meta.env.VITE_API_URL || 'Not configured'}
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            onClick={() => navigate('/settings/schema')}
            variant="contained"
            startIcon={<Settings />}
          >
            スキーマ設定
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
          >
            <CircularProgress />
          </Box>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings/schema" element={<SchemaSettings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
