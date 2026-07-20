import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Download } from '@mui/icons-material';

function RegistrationQRForm() {
  const [qrCode, setQrCode] = useState('');
  const email = sessionStorage.getItem("email") || "staff@gmail.com";
  const role = sessionStorage.getItem("role") || "staff";
  const qrRef = useRef(null);

  useEffect(() => {
    if (role && email) {
      // Generate registration URL with user data pointing to wayabroad.in
      const registrationUrl = `https://wayabroad.in/registration?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;
      
      // Generate QR code with the registration URL
      QRCode.toDataURL(registrationUrl, {
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
    link.download = `registration-qr-${email}.png`;
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
        <Typography color={'blue'} variant="h5" gutterBottom>
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



// App.js or FormQRCode.js
// import React, { useState } from 'react';
// import { QRCode } from 'qrcode.react';

// const FormQRCode = () => {
//   const [formData, setFormData] = useState({ name: '', email: '' });
//   const [qrValue, setQrValue] = useState('');

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const generateQRCode = (e) => {
//     e.preventDefault();
//     // Convert form data to query string or JSON
//     const queryString = `https://example.com/form?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}`;
//     setQrValue(queryString);
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2>QR Code Generator for Form</h2>
//       <form onSubmit={generateQRCode}>
//         <input
//           type="text"
//           name="name"
//           placeholder="Enter your name"
//           value={formData.name}
//           onChange={handleChange}
//         />
//         <br />
//         <input
//           type="email"
//           name="email"
//           placeholder="Enter your email"
//           value={formData.email}
//           onChange={handleChange}
//         />
//         <br />
//         <button type="submit">Generate QR</button>
//       </form>

//       {qrValue && (
//         <div style={{ marginTop: '20px' }}>
//           <QRCode value={qrValue} size={200} />
//           <p>Scan the QR to open the form with pre-filled data.</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FormQRCode;
