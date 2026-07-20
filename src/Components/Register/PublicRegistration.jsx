import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const PublicRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const role = searchParams.get('role');

  useEffect(() => {
    if (email && role) {
      // Store the data in sessionStorage
      sessionStorage.setItem('email', email);
      sessionStorage.setItem('role', role);
      
      // Redirect to the registration form
      navigate('/wayabroad.in/registration');
    } else {
      // If no email or role, redirect to login
      navigate('/wayabroadadmin');
    }
  }, [email, role, navigate]);

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh"
      textAlign="center"
      p={3}
    >
      <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
      <Typography variant="h5" gutterBottom>
        Preparing your registration form...
      </Typography>
      <Typography variant="body1" color="textSecondary">
        {email && `Welcome, ${email}!`}
      </Typography>
    </Box>
  );
};

export default PublicRegistration;
