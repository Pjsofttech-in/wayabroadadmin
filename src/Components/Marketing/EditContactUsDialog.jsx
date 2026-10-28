
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
import { getAllContinents } from '../Courses/Continent/ContinentService';
import AlertService from '../Common/AlertService';

const EditContactUsDialog = ({ open, onClose, record, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    continentId: '',
    courseId: '',
    status: '',
  });

  const [courses, setCourses] = useState([]);
  const [continents, setContinents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !record) return;

    setFormData({
      name: record.name || '',
      email: record.email || '',
      phoneNumber: record.phoneNumber || '',
      continentId:
        record.continentId != null ? String(record.continentId) : '',
      courseId: record.courseId != null ? String(record.courseId) : '',
      status: record.status || '',
    });

    const loadOptions = async () => {
      setLoading(true);

      const role = sessionStorage.getItem('role') || 'staff';
      const email = sessionStorage.getItem('email') || '';

      try {
        const [continentData, courseData] = await Promise.all([
          getAllContinents(role, email),
          getAllCourses(),
        ]);

        setContinents(Array.isArray(continentData) ? continentData : []);
        setCourses(Array.isArray(courseData) ? courseData : []);
      } catch (error) {
        console.error('Error loading inquiry edit options:', error);
        AlertService.error('Failed to load continent/course options');
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [open, record]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!record?.id) return;

    setSaving(true);

    try {
      await onSave(record.id, formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Web Inquiry</DialogTitle>

      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mt: 2,
          }}
        >
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            fullWidth
          />

          <FormControl fullWidth disabled={loading}>
            <InputLabel id="web-inquiry-continent-label">
              Continent
            </InputLabel>

            <Select
              labelId="web-inquiry-continent-label"
              name="continentId"
              value={formData.continentId}
              onChange={handleChange}
              label="Continent"
            >
              <MenuItem value="">None</MenuItem>

              {continents.map((continent) => {
                const id = continent.id ?? continent.continentId;
                const label =
                  continent.continentname ||
                  continent.continentName ||
                  continent.name ||
                  `Continent ${id}`;

                return (
                  <MenuItem key={id} value={String(id)}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading}>
            <InputLabel id="web-inquiry-course-label">Course</InputLabel>

            <Select
              labelId="web-inquiry-course-label"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              label="Course"
            >
              <MenuItem value="">None</MenuItem>

              {courses.map((course) => {
                const id = course.id ?? course.courseId;
                const label =
                  course.courseName || course.name || `Course ${id}`;

                return (
                  <MenuItem key={id} value={String(id)}>
                    {label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <TextField
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            fullWidth
          />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={22} />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditContactUsDialog;
