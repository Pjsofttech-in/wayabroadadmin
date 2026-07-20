import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Box, Grid, Typography,
  Chip, Divider, IconButton, CircularProgress, FormHelperText
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { partnerService } from './partnerService';
import AlertService from '../Common/AlertService';
import LoadingOverlay from '../Common/LoadingOverlay';

const INSTITUTE_TYPES = [
  { value: 'private', label: 'Private' },
  { value: 'government', label: 'Government' },
  { value: 'deemed_university', label: 'Deemed University' },
  { value: 'college', label: 'College' },
  { value: 'agency', label: 'Agency' }
];

const CONTRACT_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'custom', label: 'Custom' }
];

const STATUS_OPTIONS  = [
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "meeting_scheduled", label: "Meeting Scheduled" },
  { value: "onboard", label: "Onboard" },
  { value: "ringing", label: "Ringing" }
];

const conductedByOptions = [
  { value: "poonam", label: "Poonam" },
  { value: "rohini", label: "Rohini" },
  { value: "siddhi", label: "Siddhi" },
  { value: "radhika", label: "Radhika" },
  { value: "padam_sir", label: "Padam Sir" },
];

const PartnerDetailsModal = ({ partner, visible, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const email = sessionStorage.getItem('email') || '';
  const role = sessionStorage.getItem('role') || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessEmail: '',
    mobileNo: '',
    businessContact: '',
    instituteType: '',
    contractType: '',
    status: 'pending',
    remarks: '',
    conductedBy: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.partnerName || partner.name || '',
        email: partner.partnerEmail || partner.email || '',
        businessEmail: partner.businessEmail || '',
        mobileNo: partner.mobileNo || '',
        businessContact: partner.businessContact || '',
        instituteType: partner.instituteType || '',
        contractType: partner.contractType || '',
        status: partner.status || 'pending',
        remarks: partner.remarks || partner.remark || '',
        conductedBy: partner.conductedBy || ''
      });
    }
  }, [partner]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.mobileNo) {
      newErrors.mobileNo = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = 'Must be a valid 10-digit number';
    }
    if (!formData.instituteType) newErrors.instituteType = 'Institute type is required';
    if (!formData.contractType) newErrors.contractType = 'Contract type is required';
    if (!formData.status) newErrors.status = 'Status is required';
    if (!formData.conductedBy) newErrors.conductedBy = 'Conducted By is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (!partner?.id) {
        AlertService.error('Invalid partner data');
        return;
      }

      setLoading(true);
      const partnerData = {
        ...formData,
        partnerName: formData.name,
        partnerEmail: formData.email,
        remark: formData.remarks
      };

      delete partnerData.name;
      delete partnerData.email;
      delete partnerData.remarks;

      const response = await partnerService.updatePartner(
        partner.id,
        partnerData,
        role,
        email
      );

      if (!response.error) {
        AlertService.success('Partner updated successfully');
        onUpdate({
          ...partner,
          ...formData,
          id: partner.id,
          partnerName: formData.name,
          partnerEmail: formData.email,
          remark: formData.remarks
        });
        setIsEditing(false);
      } else {
        AlertService.error(response.error);
      }
    } catch (error) {
      AlertService.error('Failed to update partner: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!partner?.id) return;

    try {
      const confirmed = await AlertService.confirm('Are you sure you want to delete this partner?');
      if (!confirmed) return;

      setDeleting(true);
      const response = await partnerService.deletePartner(partner.id, role, email);
      
      if (!response.error) {
        AlertService.success('Partner deleted successfully');
        onDelete(partner.id);
        onClose();
      } else {
        AlertService.error(response.error);
      }
    } catch (error) {
      AlertService.error('Failed to delete partner: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderField = (name, label, type = 'text', options = null) => {
    const value = formData[name];
    const error = errors[name];

    if (options) {
      return (
        <Grid item xs={12} sm={6} key={name}>
          <FormControl fullWidth size="small" margin="normal" error={!!error}>
            <InputLabel>{label}</InputLabel>
            <Select
              name={name}
              value={value}
              onChange={handleChange}
              label={label}
            >
              {options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        </Grid>
      );
    }

    return (
      <Grid item xs={12} sm={6} key={name}>
        <TextField
          name={name}
          value={value}
          onChange={handleChange}
          fullWidth
          margin="normal"
          size="small"
          label={label}
          type={type}
          variant="outlined"
          error={!!error}
          helperText={error}
          multiline={type === 'textarea'}
          rows={type === 'textarea' ? 3 : 1}
        />
      </Grid>
    );
  };

  return (
    <>
      <LoadingOverlay loading={loading || deleting} />
      <Dialog 
        open={visible} 
        onClose={onClose} 
        maxWidth="md"
        fullWidth
      >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Edit Partner
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {renderField('name', 'Name')}
              {renderField('email', 'Email', 'email')}
              {renderField('businessEmail', 'Business Email', 'email')}
              {renderField('mobileNo', 'Mobile', 'tel')}
              {renderField('businessContact', 'Business Contact')}
              {renderField('instituteType', 'Institute Type', 'select', INSTITUTE_TYPES)}
              {renderField('contractType', 'Contract Type', 'select', CONTRACT_TYPES)}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleChange}
                >
                  {STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {renderField('remarks', 'Remarks', 'textarea')}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="conductedBy-label">Conducted By</InputLabel>
                <Select
                  labelId="conductedBy-label"
                  id="conductedBy"
                  name="conductedBy"
                  value={formData.conductedBy}
                  label="Conducted By"
                  onChange={handleChange}
                >
                  {conductedByOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Box>
        </DialogContent>
        
        <Divider />
        
        <DialogActions>
          <Button 
            onClick={() => {
              if (partner) {
                setFormData({
                  name: partner.partnerName || partner.name || '',
                  email: partner.partnerEmail || partner.email || '',
                  businessEmail: partner.businessEmail || '',
                  mobileNo: partner.mobileNo || '',
                  businessContact: partner.businessContact || '',
                  instituteType: partner.instituteType || '',
                  contractType: partner.contractType || '',
                  status: partner.status || 'pending',
                  remarks: partner.remarks || partner.remark || '',
                  conductedBy: partner.conductedBy || ''
                });
              }
              setErrors({});
              onClose();
            }} 
            color="inherit"
            startIcon={<CancelIcon />}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            color="primary" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            variant="outlined"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
    </>
  );
};

export default PartnerDetailsModal;