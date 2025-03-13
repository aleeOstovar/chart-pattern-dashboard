import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Box, Container, Typography, Paper } from '@mui/material';
import { useSelector } from 'react-redux';

const AuthLayout = () => {
  const { darkMode } = useSelector((state) => state.ui);
  
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: darkMode ? '#121212' : '#f5f5f5',
      }}
    >
      <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
          }}
        >
          <Link to="/" className="no-underline">
            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                textAlign: 'center',
                mb: 4,
              }}
            >
              Candlestick AI
            </Typography>
          </Link>
          
          <Outlet />
        </Paper>
      </Container>
      
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: darkMode ? '#1a1a1a' : 'white',
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            {'Copyright © '}
            <Link to="/" className="text-inherit">
              Candlestick AI
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout; 