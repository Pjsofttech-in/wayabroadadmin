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
} from '@mui/material';

import {
  getAllStreams,
  getAllCourses,
  createRegistration,
} from './ReistrationServices';

import AlertService from '../Common/AlertService';
import LoadingOverlay from '../Common/LoadingOverlay';
import '../Common/Design.css';

const RegisterForm = () => {
  const [formData, setFormData] = useState(() => {
    const savedEmail = sessionStorage.getItem('email') || '';

    return {
      name: '',
      email: savedEmail,
      mobile: '',
      stream: '',
      course: '',
      location: '',
      amount: '',
    };
  });

  const [streams, setStreams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [streamsData, coursesData] = await Promise.all([
          getAllStreams(),
          getAllCourses(),
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const role = sessionStorage.getItem('role') || 'staff';
      const email = sessionStorage.getItem('email') || '';
      const branchCode = sessionStorage.getItem('branchCode') || '';

      const registrationData = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobile,
        stream: formData.stream,
        courseName: formData.course,
        location: formData.location,
        amount: parseFloat(formData.amount) || 0,
        branchCode,
        role,
        createdByEmail: email,
      };

      await createRegistration(registrationData);

      AlertService.success('Registration submitted successfully!');

      setFormData({
        name: '',
        email: '',
        mobile: '',
        stream: '',
        course: '',
        location: '',
        amount: '',
      });
    } catch (err) {
      console.error('Error submitting form:', err);

      const errorMessage =
        err.message || 'Failed to submit registration. Please try again.';

      setError(errorMessage);
      AlertService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStreamValue = (stream) =>
    typeof stream === 'string'
      ? stream
      : stream.streamName || stream.name || JSON.stringify(stream);

  const getStreamLabel = (stream) =>
    typeof stream === 'string'
      ? stream
      : stream.streamName || stream.name || 'Unnamed Stream';

  const getCourseValue = (course) =>
    typeof course === 'string'
      ? course
      : course.courseName || course.name || JSON.stringify(course);

  const getCourseLabel = (course) =>
    typeof course === 'string'
      ? course
      : course.courseName || course.name || 'Unnamed Course';

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px',
      backgroundColor: '#fff',
      minHeight: 40,
      '& fieldset': {
        borderColor: '#cbd5e1',
      },
      '&:hover fieldset': {
        borderColor: '#94a3b8',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1976d2',
        borderWidth: '1px',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#64748b',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#1976d2',
    },
  };

  if (loading) {
    return (
      <Box sx={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay loading />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        px: { xs: 1, sm: 1.5, md: 2 },
        py: { xs: 1, md: 1.5 },
        boxSizing: 'border-box',
      }}
    >
      <LoadingOverlay loading={loading || isSubmitting} />

      <Paper
        component="section"
        elevation={0}
        sx={{
          width: '100%',
          p: { xs: 2, sm: 2.5, md: 2.5 },
          border: '1px solid #e1e7ef',
          borderRadius: 2,
          backgroundColor: '#fff',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ mb: { xs: 2, md: 2.5 } }}>
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 700,
              color: '#183b56',
            }}
          >
            Registration Details
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              fontSize: '0.82rem',
              color: '#718096',
            }}
          >
            Enter the required details to create a registration.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 1.5 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid
            container
            columnSpacing={{ xs: 0, sm: 2 }}
            rowSpacing={{ xs: 2, md: 2 }}
          >
            {/* Personal Information */}

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                variant="outlined"
                size="small"
                placeholder="Enter full name"
                sx={fieldSx}
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
                size="small"
                placeholder="Enter email address"
                sx={fieldSx}
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
                size="small"
                placeholder="10-digit mobile number"
                inputProps={{
                  pattern: '[0-9]{10}',
                  title: 'Please enter a valid 10-digit mobile number',
                  maxLength: 10,
                  inputMode: 'numeric',
                }}
                sx={fieldSx}
              />
            </Grid>

            {/* Academic Information */}

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
                size="small"
                sx={fieldSx}
                SelectProps={{
                  displayEmpty: false,
                }}
              >
                <MenuItem value="" disabled>
                  Select Stream
                </MenuItem>

                {streams.map((stream) => {
                  const value = getStreamValue(stream);
                  const label = getStreamLabel(stream);

                  return (
                    <MenuItem
                      key={stream.id || value}
                      value={value}
                    >
                      {label}
                    </MenuItem>
                  );
                })}

                {streams.length === 0 && (
                  <MenuItem disabled value="__no_streams__">
                    No streams available
                  </MenuItem>
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
                size="small"
                sx={fieldSx}
                SelectProps={{
                  displayEmpty: false,
                }}
              >
                <MenuItem value="" disabled>
                  Select Course
                </MenuItem>

                {courses.map((course) => {
                  const value = getCourseValue(course);
                  const label = getCourseLabel(course);

                  return (
                    <MenuItem
                      key={course.id || value}
                      value={value}
                    >
                      {label}
                    </MenuItem>
                  );
                })}

                {courses.length === 0 && (
                  <MenuItem disabled value="__no_courses__">
                    No courses available
                  </MenuItem>
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
                size="small"
                placeholder="Enter location"
                sx={fieldSx}
              />
            </Grid>

            {/* Registration Details */}

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
                size="small"
                placeholder="Enter amount"
                InputProps={{
                  startAdornment: (
                    <Box
                      component="span"
                      sx={{
                        mr: 1,
                        color: '#64748b',
                      }}
                    >
                      ₹
                    </Box>
                  ),
                }}
                inputProps={{
                  min: 0,
                  step: 'any',
                }}
                sx={fieldSx}
              />
            </Grid>
          </Grid>

          {/* Form Actions */}

          <Box
            sx={{
              mt: { xs: 2.5, md: 3 },
              pt: 2,
              borderTop: '1px solid #edf0f4',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={isSubmitting}
              disableElevation
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={17} color="inherit" />
                ) : null
              }
              sx={{
                minWidth: 120,
                px: 3,
                py: 1,
                borderRadius: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                '&:focus-visible': {
                  outline: '2px solid #1976d2',
                  outlineOffset: 2,
                },
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default RegisterForm;