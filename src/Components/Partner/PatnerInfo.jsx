import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Avatar,
  Card,
  Divider,
  Stack,
  Chip,
  Button,
  Link,
  Dialog,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import PatnerEdit from './PatnerEdit';

const labelStyle = { fontWeight: 600, color: '#555', marginBottom: 2 };
const valueStyle = { color: '#222', marginBottom: 2 };

const docButton = (url, label) => (
  url ? (
    <Button
      variant="outlined"
      size="small"
      startIcon={<DescriptionIcon />}
      sx={{ mb: 1, mr: 1 }}
      component={Link}
      href={url}
      target="_blank"
      rel="noopener"
    >
      {label}
    </Button>
  ) : null
);

const PatnerInfo = ({ partner, onUpdate }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  if (!partner) return <Typography>No partner data available.</Typography>;

  const handleEditClick = () => {
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
  };

  const handlePartnerUpdate = (updatedPartner) => {
    if (onUpdate) {
      onUpdate(updatedPartner);
    }
    setEditModalOpen(false);
  };

  // Profile fields for the left card
  const profileFields = [
    { key: 'partnerName', label: 'Partner Name' },
    { key: 'businessName', label: 'Business Name' },
    { key: 'partnerEmail', label: 'Email' },
    { key: 'mobileNo', label: 'Mobile No' },
    { key: 'partnerContact', label: 'Partner Contact' },
    { key: 'designation', label: 'Designation' },
    { key: 'instituteType', label: 'Institute Type' },
    { key: 'contractType', label: 'Contract Type' },
  ];

  // Details for the right side
  const detailFields = [
    { key: 'authorityName', label: 'Authority Name' },
    { key: 'authorityEmail', label: 'Authority Email' },
    { key: 'authorityContact', label: 'Authority Contact' },
    { key: 'authorityDesignation', label: 'Authority Designation' },
    { key: 'partnerAddress', label: 'Address' },
    { key: 'partnerCountry', label: 'Country' },
    { key: 'partnerState', label: 'State' },
    { key: 'partnerCity', label: 'City' },
    { key: 'partnerDistrict', label: 'District' },
    { key: 'partnerPincode', label: 'Pincode' },
    { key: 'university', label: 'University' },
    { key: 'commissionPercent', label: 'Commission (%)' },
    { key: 'conductedBy', label: 'Conducted By' },
    { key: 'remark', label: 'Remark' },
    { key: 'createdByEmail', label: 'Created By Email' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
  ];

  // Document fields
  const documentFields = [
    { key: 'contractPdf', label: 'Contract PDF' },
    { key: 'commissionPdf', label: 'Commission Agreement' },
    { key: 'panPdf', label: 'PAN Card' },
    { key: 'gstPdf', label: 'GST Certificate' },
  ];

  // Helper to get avatar URL (if you have a photo field, use it)
  const avatarUrl = partner.photo || '';

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4} lg={3}>
          <Card elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }} />
                <IconButton 
                onClick={handleEditClick} 
                  size="small"
                  sx={{ 
                    backgroundColor: '#f5f5f5',
                    '&:hover': { backgroundColor: '#e0e0e0' }
                  }}
                >
                  <EditIcon />
                </IconButton>
            </Box>
            <Avatar
              src={avatarUrl}
              alt={partner.partnerName || partner.name}
              sx={{ width: 100, height: 100, margin: 'auto', mb: 2, border: '2px solid #ccc' }}
            >
              {(partner.partnerName || partner.name)?.[0] || '?'}
            </Avatar>
            <Typography variant="h6" sx={{ mb: 1 }}>{partner.partnerName || partner.name}</Typography>
            <Stack spacing={0.5} alignItems="center">
              {profileFields.map(({ key, label }) => (
                partner[key] !== undefined && partner[key] !== null && partner[key] !== '' && key !== 'partnerName' && (
                  <Typography key={key} variant="body2" color={key === 'partnerEmail' ? 'primary' : 'textSecondary'}>
                    <span style={{ fontWeight: 500 }}>{label}:</span> {partner[key]}
                  </Typography>
                )
              ))}
              {partner.status && (
                <Chip
                  label={partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                  color={partner.status === 'active' ? 'success' : partner.status === 'inactive' ? 'error' : 'warning'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Stack>
          </Card>
        </Grid>
        {/* Details Grid */}
        <Grid item xs={12} md={8} lg={9}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Partner Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {detailFields.map(({ key, label }) => (
                partner[key] !== undefined && partner[key] !== null && partner[key] !== '' && (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography style={labelStyle}>{label}:</Typography>
                    <Typography style={valueStyle}>{partner[key]}</Typography>
                  </Grid>
                )
              ))}
            </Grid>
            {/* Document Links */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Documents</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {documentFields.map(({ key, label }) =>
                  partner[key] ? docButton(partner[key], label) : null
                )}
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Partner Dialog */}
      <Dialog
        open={editModalOpen}
        onClose={handleEditClose}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '90vh',
            overflow: 'auto'
          }
        }}
      >
        <PatnerEdit
          partnerId={partner.id}
          onClose={handleEditClose}
          onUpdate={handlePartnerUpdate}
        />
      </Dialog>
    </Box>
  );
};

export default PatnerInfo;