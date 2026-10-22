import React, { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import AbroadInquiryForm from "./AbroadInquiryForm";

/** Public entry for branch QR scans. Context is restored before the existing inquiry form mounts. */
export default function PublicInquiryRegistration() {
  const [searchParams] = useSearchParams();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const email = searchParams.get("email") || "";
    const role = searchParams.get("role") || "";
    const branchCode = searchParams.get("branchCode") || "";

    if (!email || !role || !branchCode) {
      setError("This inquiry link is incomplete. Please scan the QR code provided by your branch.");
      setReady(false);
      return;
    }

    // Existing inquiry form/service reads these context values. The backend team is enabling
    // public access for this flow; do not ask the student to log in.
    sessionStorage.setItem("email", email);
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("branchCode", branchCode);
    setReady(true);
  }, [searchParams]);

  if (error) {
    return <Box sx={{ maxWidth: 640, mx: "auto", p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }
  if (!ready) {
    return <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", p: { xs: 1, sm: 2, md: 3 } }}>
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center">Student Inquiry Form</Typography>
        <Typography color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          Please fill in your details carefully and submit the form.
        </Typography>
      </Paper>
      <Paper elevation={1} sx={{ p: { xs: 1, sm: 2 } }}>
        <AbroadInquiryForm />
      </Paper>
    </Box>
  );
}
