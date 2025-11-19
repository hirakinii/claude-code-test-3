import { Container, Typography, Box } from '@mui/material';

function App() {
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
          Phase 0: プロジェクト基盤構築完了
        </Typography>
        <Typography variant="body1" color="text.secondary">
          環境: {import.meta.env.MODE}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          API URL: {import.meta.env.VITE_API_URL || 'Not configured'}
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
