import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { 
  getAllStreams, 
  getAllCourses, 
  createRegistration, 
  updateRegistration,
  deleteRegistration
} from './ReistrationServices';
import AlertService from '../Common/AlertService';
import LoadingOverlay from '../Common/LoadingOverlay';

const RegistrationFormDialog = ({ 
  open, 
  onClose, 
  onSuccess,
  onDelete,
  initialData = null 
}) => {
  const isEditMode = !!initialData?.id;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    stream: '',
    course: '',
    location: '',
    amount: ''
  });
  
  const [streams, setStreams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with initialData if in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        mobile: initialData.mobileNumber || '',
        stream: initialData.stream || '',
        course: initialData.courseName || '',
        location: initialData.location || '',
        amount: initialData.amount ? initialData.amount.toString() : ''
      });
    }
  }, [initialData]);

  // Fetch streams and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching streams and courses...');
        const [streamsData, coursesData] = await Promise.all([
          getAllStreams(),
          getAllCourses()
        ]);
        
        console.log('Streams data:', streamsData);
        console.log('Courses data:', coursesData);
        
        setStreams(Array.isArray(streamsData) ? streamsData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load form data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    } else {
      // Reset form when dialog is closed
      setFormData({
        name: '',
        email: '',
        mobile: '',
        stream: '',
        course: '',
        location: '',
        amount: ''
      });
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobile,
        stream: formData.stream,
        courseName: formData.course,
        location: formData.location,
        amount: parseFloat(formData.amount) || 0,
      };
      
      if (isEditMode) {
        await updateRegistration(initialData.id, registrationData);
        AlertService.success('Registration updated successfully');
      } else {
        await createRegistration(registrationData);
        AlertService.success('Registration created successfully');
      }
      
      onSuccess?.(registrationData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error.message || 'Failed to submit form. Please try again.';
      setError(errorMessage);
      AlertService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditMode ? 'Edit Registration' : 'New Registration'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay loading={isSubmitting || loading} />
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmit,
        }}
      >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {isEditMode ? 'Edit Registration' : 'New Registration'}
          </Typography>
          <IconButton edge="end" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Box mb={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Mobile Number"
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
              inputProps={{
                pattern: '[0-9]{10}',
                title: 'Please enter a valid 10-digit mobile number'
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Stream"
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
            >
              <MenuItem value="">Select Stream</MenuItem>
              {streams.map((stream) => (
                <MenuItem key={stream.id} value={stream.name}>
                  {stream.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Course"
              name="course"
              value={formData.course}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
            >
              <MenuItem value="">Select Course</MenuItem>
              {courses && courses.length > 0 ? (
                courses.map((course) => (
                  <MenuItem 
                    key={course.id || course.courseName || course} 
                    value={course.courseName || course.name || course}
                  >
                    {course.courseName || course.name || course}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No courses available</MenuItem>
              )}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: '₹',
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Box>
          {isEditMode && (
            <Button 
              variant="outlined" 
              color="error"
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this registration?')) {
                  try {
                    await deleteRegistration(initialData.id);
                    onDelete?.(initialData.id);
                    onClose();
                  } catch (error) {
                    console.error('Error deleting registration:', error);
                    setError('Failed to delete registration. Please try again.');
                  }
                }
              }}
              disabled={isSubmitting}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          )}
        </Box>
        <Box>
          <Button 
            onClick={onClose} 
            disabled={isSubmitting}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : isEditMode ? (
              'Update Registration'
            ) : (
              'Create Registration'
            )}
          </Button>
        </Box>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RegistrationFormDialog;