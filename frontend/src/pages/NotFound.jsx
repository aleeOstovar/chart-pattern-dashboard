import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { SentimentVeryDissatisfied } from '@mui/icons-material';
import { useSelector } from 'react-redux';

const NotFound = () => {
  const { darkMode } = useSelector((state) => state.ui);
  
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: darkMode ? '#121212' : '#f5f5f5',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <SentimentVeryDissatisfied sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
        
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          Oops! The page you are looking for might have been removed, had its
          name changed, or is temporarily unavailable.
        </Typography>
        
        <Button
          component={Link}
          to="/"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 2 }}
        >
          Go to Homepage
        </Button>
      </Container>
    </Box>
  );
};

export default NotFound; 