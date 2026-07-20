import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Snackbar,
  Alert,
  Typography,
  Divider,
  Card,
  CardContent,
  Chip,
  Paper,
  Avatar,
} from '@mui/material';
import {
  PersonAdd,
  Edit,
  Visibility,
  Add,
  Update,
  Delete,
  Security,
  Person,
  Email,
  Phone,
  Lock,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { createStaff, updateStaff } from './StaffService';

const initialStaffState = {
  staffName: '',
  staffEmail: '',
  contact: '',
  status: 'Active',
  password: '',
  cansGet: false,
  cansPost: false,
  cansPut: false,
  cansDelete: false,
};

const StaffForm = ({ open, onClose, branchEmail, staffData, onSuccess }) => {
  const [formData, setFormData] = useState(initialStaffState);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const isEdit = Boolean(staffData?.id);

  useEffect(() => {
    if (staffData) {
      setFormData({
        staffName: staffData.staffName || '',
        staffEmail: staffData.staffEmail || '',
        contact: staffData.contact || '',
        role: staffData.role || 'STAFF',
        status: staffData.status || 'Active',
        password: staffData.password || '',
        cansGet: Boolean(staffData.cansGet),
        cansPost: Boolean(staffData.cansPost),
        cansPut: Boolean(staffData.cansPut),
        cansDelete: Boolean(staffData.cansDelete),
      });
    } else {
      setFormData(initialStaffState);
    }
  }, [staffData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = () => {
    const requiredFields = ['staffName', 'staffEmail', 'contact'];
    if (!isEdit) requiredFields.push('password');

    for (const field of requiredFields) {
      if (!formData[field]) {
        setSnackbar({ open: true, message: `Please fill ${field}`, severity: 'error' });
        return;
      }
    }

    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    setLoading(true);

    try {
      if (isEdit) {
        await updateStaff(staffData.id, formData);
        setSnackbar({ open: true, message: 'Staff updated successfully', severity: 'success' });
      } else {
        await createStaff(formData, branchEmail);
        setSnackbar({ open: true, message: 'Staff created successfully', severity: 'success' });
      }
      onSuccess();
      handleDialogClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({ open: true, message: error.message || 'Operation failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  const getPermissionCount = () => {
    return [formData.cansGet, formData.cansPost, formData.cansPut, formData.cansDelete].filter(Boolean).length;
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? 'success' : 'error';
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleDialogClose} 
        maxWidth="lg" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Enhanced Dialog Title */}
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #3291d1 100%)',
            color: 'white', 
            py: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              zIndex: -1,
            }
          }}
        >
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              width: 48, 
              height: 48,
              backdropFilter: 'blur(10px)',
            }}
          >
            {isEdit ? <Edit /> : <PersonAdd />}
          </Avatar>
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {isEdit ? 'Update Staff Member' : 'Add New Staff Member'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {isEdit ? 'Modify staff information and permissions' : 'Create a new staff member for your branch'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Staff Info Summary Card (for edit mode) */}
          {isEdit && (
            <Paper 
              elevation={0} 
              sx={{ 
                m: 3, 
                p: 3, 
                backgroundColor: '#f8f9ff',
                border: '1px solid #e0e7ff',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                  {formData.staffName?.charAt(0)?.toUpperCase() || 'S'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formData.staffName || 'Staff Member'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Chip 
                      label={formData.status || 'Active'} 
                      color={getStatusColor(formData.status)}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip 
                      label={`${getPermissionCount()} Permissions`} 
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          <Box sx={{ px: 3, pb: 3 }}>
            {/* Personal Information Section */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                    <Person fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Personal Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Staff Name"
                      name="staffName"
                      value={formData.staffName}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Person sx={{ color: 'text.secondary', mr: 1 }} />,
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="staffEmail"
                      type="email"
                      value={formData.staffEmail}
                      onChange={handleChange}
                      required
                      disabled={isEdit}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />,
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 2,
                          backgroundColor: isEdit ? '#f5f5f5' : 'transparent'
                        },
                        '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
                      }}
                      helperText={isEdit ? "Email cannot be changed after creation" : ""}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Phone sx={{ color: 'text.secondary', mr: 1 }} />,
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        label="Status"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="Active">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                            Active
                          </Box>
                        </MenuItem>
                        <MenuItem value="Inactive">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
                            Inactive
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {!isEdit && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        variant="outlined"
                        InputProps={{
                          startAdornment: <Lock sx={{ color: 'text.secondary', mr: 1 }} />,
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
                        }}
                        helperText="Minimum 6 characters recommended"
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Permissions Section */}
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#3291d1', width: 32, height: 32 }}>
                    <Security fontSize="small" />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3291d1' }}>
                      Access Permissions
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${getPermissionCount()}/4 Selected`} 
                    color={getPermissionCount() > 0 ? 'primary' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        border: `2px solid ${formData.cansGet ? '#4caf50' : '#e0e0e0'}`,
                        borderRadius: 2,
                        backgroundColor: formData.cansGet ? '#e8f5e9' : '#fafafa',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateY(-2px)'
                        }
                      }}
                      onClick={() => handleChange({ target: { name: 'cansGet', type: 'checkbox', checked: !formData.cansGet } })}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.cansGet}
                            onChange={handleChange}
                            name="cansGet"
                            sx={{ 
                              '&.Mui-checked': { color: 'success.main' },
                              pointerEvents: 'none'
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Visibility sx={{ fontSize: 20, color: formData.cansGet ? 'success.main' : 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Can View
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, pointerEvents: 'none' }}
                      />
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        border: `2px solid ${formData.cansPost ? '#2196f3' : '#e0e0e0'}`,
                        borderRadius: 2,
                        backgroundColor: formData.cansPost ? '#e3f2fd' : '#fafafa',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateY(-2px)'
                        }
                      }}
                      onClick={() => handleChange({ target: { name: 'cansPost', type: 'checkbox', checked: !formData.cansPost } })}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.cansPost}
                            onChange={handleChange}
                            name="cansPost"
                            sx={{ 
                              '&.Mui-checked': { color: 'primary.main' },
                              pointerEvents: 'none'
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Add sx={{ fontSize: 20, color: formData.cansPost ? 'primary.main' : 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Can Create
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, pointerEvents: 'none' }}
                      />
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        border: `2px solid ${formData.cansPut ? '#ff9800' : '#e0e0e0'}`,
                        borderRadius: 2,
                        backgroundColor: formData.cansPut ? '#fff3e0' : '#fafafa',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateY(-2px)'
                        }
                      }}
                      onClick={() => handleChange({ target: { name: 'cansPut', type: 'checkbox', checked: !formData.cansPut } })}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.cansPut}
                            onChange={handleChange}
                            name="cansPut"
                            sx={{ 
                              '&.Mui-checked': { color: 'warning.main' },
                              pointerEvents: 'none'
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Update sx={{ fontSize: 20, color: formData.cansPut ? 'warning.main' : 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Can Update
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, pointerEvents: 'none' }}
                      />
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        border: `2px solid ${formData.cansDelete ? '#f44336' : '#e0e0e0'}`,
                        borderRadius: 2,
                        backgroundColor: formData.cansDelete ? '#ffebee' : '#fafafa',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateY(-2px)'
                        }
                      }}
                      onClick={() => handleChange({ target: { name: 'cansDelete', type: 'checkbox', checked: !formData.cansDelete } })}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.cansDelete}
                            onChange={handleChange}
                            name="cansDelete"
                            sx={{ 
                              '&.Mui-checked': { color: 'error.main' },
                              pointerEvents: 'none'
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Delete sx={{ fontSize: 20, color: formData.cansDelete ? 'error.main' : 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Can Delete
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, pointerEvents: 'none' }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>

        {/* Enhanced Dialog Actions */}
        <DialogActions sx={{ p: 3, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleDialogClose} 
            disabled={loading}
            variant="outlined"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : (isEdit ? <Edit /> : <PersonAdd />)}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
              }
            }}
          >
            {isEdit ? 'Update Staff' : 'Create Staff'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Confirmation Dialog */}
      <Dialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)}
        maxWidth="sm"
        sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          backgroundColor: isEdit ? 'warning.light' : 'primary.light',
          color: isEdit ? 'warning.contrastText' : 'primary.contrastText'
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            {isEdit ? <Edit /> : <PersonAdd />}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Confirm {isEdit ? 'Update' : 'Create'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {formData.staffName?.charAt(0)?.toUpperCase() || 'S'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formData.staffName || 'New Staff Member'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formData.staffEmail}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to {isEdit ? 'update this staff member?' : 'create a new staff member?'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`Status: ${formData.status}`} size="small" color={getStatusColor(formData.status)} />
            <Chip label={`${getPermissionCount()} Permissions`} size="small" variant="outlined" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setConfirmOpen(false)} 
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            autoFocus
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Confirm {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontWeight: 'bold'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default StaffForm;