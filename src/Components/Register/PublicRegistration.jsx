import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, CircularProgress } from '@mui/material';
import RegisterForm from './RegisterForm';

/**
 * Public entry point for registration QR scans.
 * Restore the QR owner's context before mounting the existing registration form,
 * because RegisterForm reads these values from sessionStorage.
 */
const PublicRegistration = () => {
  const [searchParams] = useSearchParams();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const email = searchParams.get('email') || '';
  const role = searchParams.get('role') || '';
  const branchCode = searchParams.get('branchCode') || '';

  useEffect(() => {
    if (!email || !role) {
      setError(
        'This registration link is incomplete. Please scan the QR code provided by your branch.'
      );
      setReady(false);
      return;
    }

    sessionStorage.setItem('email', email);
    sessionStorage.setItem('role', role);

    if (branchCode) {
      sessionStorage.setItem('branchCode', branchCode);
    } else {
      // Do not accidentally reuse branch context from a previous session on this device.
      sessionStorage.removeItem('branchCode');
    }

    setError('');
    setReady(true);
  }, [email, role, branchCode]);

  if (error) {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!ready) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // This is the public route, so the QR recipient does not need an admin login.
  return <RegisterForm />;
};

export default PublicRegistration;
