import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Download } from '@mui/icons-material';

const AbroadInquiryQR = () => {
  const [qrCode, setQrCode] = useState('');
  const email = sessionStorage.getItem("email") || "staff@gmail.com";
  const role = sessionStorage.getItem("role") || "staff";
  const qrRef = useRef(null);

  useEffect(() => {
    if (role && email) {
      // Generate contact URL with user data pointing to wayabroad.in
      const contactUrl = `https://wayabroad.in/contact?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;
      
      // Generate QR code with the contact URL
      QRCode.toDataURL(contactUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (err, url) => {
        if (err) {
          console.error('Error generating QR code:', err);
          return;
        }
        setQrCode(url);
      });
    }
  }, [role, email]);

  const handleDownload = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `contact-qr-${email}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* CSS for print-only content */}
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
        <Typography color={'primary'} variant="h5" gutterBottom>
          Abroad Inquiry Contact QR Code
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }} ref={qrRef} id="qr-print-section">
          {qrCode ? (
            <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
          ) : (
            <Typography>Generating QR Code...</Typography>
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
};

export default AbroadInquiryQR;