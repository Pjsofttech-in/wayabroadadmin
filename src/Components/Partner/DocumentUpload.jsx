import React, { useState } from "react";
import { 
  Grid, 
  Button, 
  Typography, 
  Paper, 
  Box
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import { partnerService } from "./partnerService";
import LoadingOverlay from "../Common/LoadingOverlay";
import AlertService from "../Common/AlertService";
import ErrorBoundary from "../Common/ErrorBoundary";

function DocumentUploadContent({ 
  files, 
  onFileChange, 
  onSubmit, 
  partnerId, 
  role, 
  email,
  onUploadComplete 
}) {
  const documents = [
    { 
      label: "Contract PDF", 
      name: "contractPdf", 
      accept: ".pdf",
      description: "Upload the signed contract document in PDF format"
    },
    { 
      label: "Commission Agreement", 
      name: "commissionAgreementPdf", 
      accept: ".pdf",
      description: "Upload the commission agreement in PDF format"
    },
    { 
      label: "PAN Card", 
      name: "panCard", 
      accept: ".pdf,.jpg,.jpeg,.png",
      description: "Upload PAN card (PDF or image)"
    },
    { 
      label: "GST Certificate", 
      name: "gstCertificate", 
      accept: ".pdf,.jpg,.jpeg,.png",
      description: "Upload GST certificate (PDF or image)"
    },
  ];

  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleUpload = async () => {
    try {
      setLoading(true);
      setUploadError(null);
      
      if (onSubmit) {
        // If parent component provides an onSubmit handler, use it
        await onSubmit();
      } else if (partnerId) {
        // Otherwise, use the default upload behavior
        const filesToUpload = {
          contractPdf: files.contractPdf,
          commissionAgreementPdf: files.commissionAgreementPdf,
          panCard: files.panCard,
          gstCertificate: files.gstCertificate
        };

        await partnerService.uploadPartnerDocuments(
          partnerId,
          filesToUpload,
          role || 'partner',
          email
        );
        
        AlertService.success('Documents uploaded successfully!');
      }
      
      // Notify parent component that upload is complete
      if (onUploadComplete) {
        onUploadComplete();
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      AlertService.error(error.response?.data?.message || error.message || 'Failed to upload documents. Please try again.');
      throw error; // Re-throw to allow parent component to handle the error
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay loading={loading} />
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
          Required Documents
        </Typography>

        <Grid container spacing={3}>
          {documents.map(({ label, name, accept, description }) => (
            <Grid item xs={12} sm={6} key={name}>
              <Box 
                sx={{ 
                  p: 1.5, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 1
                  }
                }}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  <DescriptionIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.primary">
                    {label}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" paragraph>
                  {description}
                </Typography>
                <Box mt="auto">
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    size="medium"
                    startIcon={<CloudUploadIcon />}
                    sx={{ 
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      py: 1,
                      '& .MuiButton-startIcon': {
                        mr: 1,
                      },
                    }}
                    disabled={loading}
                  >
                    {files[name] ? files[name].name : `Choose File`}
                    <input
                      type="file"
                      hidden
                      accept={accept}
                      onChange={(e) => onFileChange(name, e.target.files?.[0])}
                    />
                  </Button>
                  {files[name] && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      File size: {Math.round(files[name].size / 1024)} KB
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!Object.values(files).some(file => file) || loading}
          >
            Upload Documents
          </Button>
        </Box>
      </Paper>
    </>
  );
}

// Wrap with error boundary
export default function DocumentUpload(props) {
  return (
    <ErrorBoundary fallback={<div>Error loading document upload. Please try again later.</div>}>
      <DocumentUploadContent {...props} />
    </ErrorBoundary>
  );
}
