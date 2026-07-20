import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  TextField, 
  Button, 
  Paper, 
  Typography,
  Box,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { getAllStreams, getAllCourses, createRegistration } from './ReistrationServices';
import AlertService from '../Common/AlertService';
import LoadingOverlay from '../Common/LoadingOverlay';
import '../Common/Design.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState(() => {
    // Get email from sessionStorage if available (from QR code scan)
    const savedEmail = sessionStorage.getItem('email') || '';
    
    return {
      name: '',
      email: savedEmail,
      mobile: '',
      stream: '',
      course: '',
      location: '',
      amount: ''
    };
  });
  const [streams, setStreams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch streams and courses on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both streams and courses in parallel
        const [streamsData, coursesData] = await Promise.all([
          getAllStreams(),
          getAllCourses()
        ]);
        
        setStreams(streamsData);
        setCourses(coursesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        setStreams([]);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      // Get authentication data from session storage
      const role = sessionStorage.getItem('role') || 'staff';
      const email = sessionStorage.getItem('email') || '';
      const branchCode = sessionStorage.getItem('branchCode') || '';
      
      // Prepare the data object to match AbroadRegisterForm entity exactly
      const registrationData = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobile,
        stream: formData.stream,
        courseName: formData.course,
        location: formData.location,
        amount: parseFloat(formData.amount) || 0,
        // Additional required fields
        branchCode: branchCode,
        role: role,
        createdByEmail: email
      };
      
      // Call the createRegistration service
      const response = await createRegistration(registrationData);      
      setSuccess(true);
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        mobile: '',
        stream: '',
        course: '',
        location: '',
        amount: ''
      });
      
      // Show success message
      AlertService.success('Registration submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to submit registration. Please try again.');
      AlertService.error(error.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'relative', minHeight: '200px' }}>
        <LoadingOverlay loading={true} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay loading={loading || isSubmitting} />
      <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Row 1 */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Mobile Number"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleChange}
                required
                variant="outlined"
                inputProps={{
                  pattern: '[0-9]{10}',
                  title: 'Please enter a valid 10-digit mobile number'
                }}
              />
            </Grid>

            {/* Row 2 */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Stream"
                name="stream"
                value={formData.stream}
                onChange={handleChange}
                required
                variant="outlined"
                SelectProps={{
                  native: false,
                  renderValue: (selected) => selected || 'Select Stream'
                }}
              >
                <MenuItem value="" disabled>
                  Select Stream
                </MenuItem>
                {streams.map((stream) => {
                  // Handle both string and object responses
                  const value = typeof stream === 'string' 
                    ? stream 
                    : (stream.streamName || stream.name || JSON.stringify(stream));
                  const label = typeof stream === 'string' 
                    ? stream 
                    : (stream.streamName || stream.name || 'Unnamed Stream');
                  
                  return (
                    <MenuItem key={stream.id || value} value={value}>
                      {label}
                    </MenuItem>
                  );
                })}
                {streams.length === 0 && (
                  <MenuItem disabled>No streams available</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Course Name"
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                variant="outlined"
                SelectProps={{
                  native: false,
                  renderValue: (selected) => selected || 'Select Course'
                }}
              >
                <MenuItem value="" disabled>
                  Select Course
                </MenuItem>
                {courses.map((course) => {
                  // Handle both string and object responses
                  const value = typeof course === 'string' 
                    ? course 
                    : (course.courseName || course.name || JSON.stringify(course));
                  const label = typeof course === 'string' 
                    ? course 
                    : (course.courseName || course.name || 'Unnamed Course');
                  
                  return (
                    <MenuItem key={course.id || value} value={value}>
                      {label}
                    </MenuItem>
                  );
                })}
                {courses.length === 0 && (
                  <MenuItem disabled>No courses available</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>

            {/* Row 3 */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: '₹',
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              type="submit"
              size="large"
              disabled={isSubmitting}
              sx={{ px: 4 }}
              startIcon={isSubmitting ? <CircularProgress size={24} color="inherit" /> : null}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </form>
      </div>
  );
};

export default RegisterForm;