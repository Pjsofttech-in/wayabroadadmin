import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Download } from '@mui/icons-material';

function RegistrationQRForm() {
  const [qrCode, setQrCode] = useState('');
  const email = sessionStorage.getItem('email') || 'staff@gmail.com';
  const role = sessionStorage.getItem('role') || 'staff';
  const branchCode = sessionStorage.getItem('branchCode') || '';
  const qrRef = useRef(null);

  useEffect(() => {
    if (!email || !role) {
      setQrCode('');
      return undefined;
    }

    // Build the public route from Vite's configured deployment base path.
    // With the current config this resolves to /wayabroadadmin/register.
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
    const registrationUrl = new URL(`${basePath}register`, window.location.origin);
    registrationUrl.searchParams.set('email', email);
    registrationUrl.searchParams.set('role', role);

    // Preserve branch ownership when the QR is scanned on another device.
    if (branchCode) {
      registrationUrl.searchParams.set('branchCode', branchCode);
    }

    let active = true;

    QRCode.toDataURL(registrationUrl.toString(), {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrCode(url);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        if (active) setQrCode('');
      });

    return () => {
      active = false;
    };
  }, [email, role, branchCode]);

  const handleDownload = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `registration-qr-${email}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #qr-print-section, #qr-print-section * {
              visibility: visible;
            }
          }
        `}
      </style>
      <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
        <Typography color="blue" variant="h5" gutterBottom>
          Registration QR Code
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }} ref={qrRef} id="qr-print-section">
          {qrCode ? (
            <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
          ) : (
            <p>Loading QR Code...</p>
          )}
        </Paper>
        {qrCode && (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleDownload}
            startIcon={<Download />}
          >
            Download QR Code
          </Button>
        )}
      </Box>
    </>
  );
}

export default RegistrationQRForm;
