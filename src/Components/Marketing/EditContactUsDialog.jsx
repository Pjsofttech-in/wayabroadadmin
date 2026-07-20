import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
} from '@mui/material';
import { getAllCourses } from './Marketing';
import AlertService from '../Common/AlertService';

const EditContactUsDialog = ({ open, onClose, record, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phnNo: '',
    continent: '',
    courses: ''
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getAllCourses();
        setCourses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        AlertService.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCourses();
      if (record) {
        setFormData({
          name: record.name || '',
          email: record.email || '',
          phnNo: record.phnNo || '',
          continent: record.continent || '',
          courses: record.courses || ''
        });
      }
    }
  }, [record, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    onSave(record.id, formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Contact Us</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Phone Number"
            name="phnNo"
            value={formData.phnNo}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Continent</InputLabel>
            <Select
              name="continent"
              value={formData.continent}
              onChange={handleChange}
              label="Continent"
            >
              {['Asia', 'Africa', 'North America', 'South America', 'Antarctica', 'Europe', 'Australia'].map(continent => (
                <MenuItem key={continent} value={continent}>
                  {continent}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Courses</InputLabel>
            <Select
              name="courses"
              value={formData.courses}
              onChange={handleChange}
              label="Courses"
              disabled={loading}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                courses.map((course) => (
                  <MenuItem key={course.id} value={course.courseName}>
                    {course.courseName}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditContactUsDialog;
