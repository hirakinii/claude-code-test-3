import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const SchemaSettings = lazy(() => import('./pages/SchemaSettings'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Wizard = lazy(() => import('./pages/Wizard'));

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function LoadingFallback() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <CircularProgress />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings/schema"
                element={
                  <ProtectedRoute requireAdmin>
                    <SchemaSettings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/specifications/:id/edit"
                element={
                  <ProtectedRoute>
                    <Wizard />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route
                path="/unauthorized"
                element={
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom>
                      403 Forbidden
                    </Typography>
                    <Typography variant="body1">
                      この操作には管理者権限が必要です。
                    </Typography>
                  </Box>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
