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
} from '@mui/material';
import AlertService from '../Common/AlertService';

const EditExamPreparationDialog = ({ open, onClose, record, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    examName: '',
  });

  useEffect(() => {
    if (record) {
      setFormData({
        name: record.name || '',
        contactNumber: record.contactNumber || '',
        examName: record.examName || '',
        createdByEmail: record.createdByEmail || '',
        role: record.role || ''
      });
    }
  }, [record]);

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
      <DialogTitle>Edit Exam Preparation</DialogTitle>
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
            label="Contact Number"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Exam Name</InputLabel>
            <Select
              name="examName"
              value={formData.examName}
              onChange={handleChange}
              label="Exam Name"
            >
              {['TOEFL', 'IELTS', 'GRE', 'GMAT', 'SAT', 'ACT', 'PTE'].map(exam => (
                <MenuItem key={exam} value={exam}>
                  {exam}
                </MenuItem>
              ))}
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

export default EditExamPreparationDialog;
