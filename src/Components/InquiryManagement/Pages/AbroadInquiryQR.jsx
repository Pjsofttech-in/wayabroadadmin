import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Alert,
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import { Download } from "@mui/icons-material";

const AbroadInquiryQR = () => {
  const [qrCode, setQrCode] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const email = sessionStorage.getItem("email") || "";
    const role = sessionStorage.getItem("role") || "";
    const branchCode = sessionStorage.getItem("branchCode") || "";

    if (!email || !role || !branchCode) {
      setError(
        "Your login is missing email, role, or branch code. Please sign in again or contact your administrator."
      );
      setQrCode("");
      setRegistrationUrl("");

      return () => {
        active = false;
      };
    }

    const url = new URL(
      "/wayabroadadmin/public-inquiry",
      window.location.origin
    );

    url.searchParams.set("email", email);
    url.searchParams.set("role", role);
    url.searchParams.set("branchCode", branchCode);

    setRegistrationUrl(url.toString());
    setError("");

    QRCode.toDataURL(url.toString(), {
      width: 500,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => {
        if (active) setQrCode(dataUrl);
      })
      .catch((err) => {
        console.error("Error generating inquiry QR code:", err);

        if (active) {
          setError("Could not generate the QR code. Please try again.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDownload = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `branch-inquiry-qr-${
      sessionStorage.getItem("branchCode") || "branch"
    }.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      mt={3}
      px={2}
    >
      <Typography
        color="primary"
        variant="h5"
        fontWeight={700}
        textAlign="center"
      >
      Inquiry QR Code
      </Typography>

      <Typography color="text.secondary" textAlign="center" maxWidth={520}>
        Students can scan this QR code, fill in the inquiry form on their
        phone, and submit their details to the Inquiry List.
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ width: "100%", maxWidth: 600 }}>
          {error}
        </Alert>
      )}

      {qrCode && (
        <>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src={qrCode}
              alt="Branch inquiry QR code"
              style={{
                width: 240,
                height: 240,
                maxWidth: "100%",
              }}
            />
          </Paper>

          <Button
            variant="contained"
            onClick={handleDownload}
            startIcon={<Download />}
          >
            Download QR Code
          </Button>
        </>
      )}
    </Box>
  );
};

export default AbroadInquiryQR;