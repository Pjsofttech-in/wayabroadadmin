import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid, 
  Box, 
  IconButton,
  Input,
  InputLabel,
  FormControl
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

// Reusable file input component
const FileInput = ({ label, name, value, onChange, accept = "*" }) => (
  <FormControl fullWidth sx={{ mb: 2 }}>
    <InputLabel>{label}</InputLabel>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
      <Input
        type="file"
        name={name}
        onChange={onChange}
        inputProps={{ accept }}
        sx={{ display: 'none' }}
        id={`file-upload-${name}`}
      />
      <label htmlFor={`file-upload-${name}`}>
        <Button variant="outlined" component="span">
          Choose File
        </Button>
      </label>
      {value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            {value.name || 'File selected'}
          </Typography>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              const event = { target: { name, files: [] } };
              onChange(event);
            }} 
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Typography variant="body2" color="textSecondary">
          No file chosen
        </Typography>
      )}
    </Box>
  </FormControl>
);

const Documents = ({ formData, handleChange }) => {
  // Handle file input change
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    handleChange(e); // Update form data with the file
  };

  const documentSections = [
    {
      key: 'sop',
      title: 'Statement of Purpose (SOP)',
      description: 'A well-written essay describing your academic and professional background, career goals, and reasons for choosing this program.',
      accept: '.pdf,.doc,.docx'
    },
    {
      key: 'lors',
      title: 'Letters of Recommendation (LORs)',
      description: 'Typically 2-3 recommendation letters from professors or employers who can vouch for your academic and professional abilities.',
      accept: '.pdf,.doc,.docx'
    },
    {
      key: 'resume',
      title: 'Resume or Curriculum Vitae (CV)',
      description: 'A detailed document outlining your educational background, work experience, skills, and achievements.',
      accept: '.pdf,.doc,.docx'
    },
    {
      key: 'testScores',
      title: 'Standardized Test Scores',
      description: 'Scores from tests like TOEFL, IELTS, GRE, GMAT, etc., as required by the institution.',
      accept: '.pdf,.jpg,.jpeg,.png'
    },
    {
      key: 'passportCopy',
      title: 'Passport Copy',
      description: 'A clear copy of the information page of your passport.',
      accept: '.pdf,.jpg,.jpeg,.png'
    },
    {
      key: 'studentVisa',
      title: 'Student Visa (if available)',
      description: 'Copy of your student visa or relevant visa application documents.',
      accept: '.pdf,.jpg,.jpeg,.png'
    },
    {
      key: 'passportPhotos',
      title: 'Passport-Sized Photos',
      description: 'Recent passport-sized photographs as per the specifications.',
      accept: '.jpg,.jpeg,.png'
    }
  ];

  // Split documents into two columns for better layout
  const leftColumn = documentSections.slice(0, 4);
  const rightColumn = documentSections.slice(4);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Required Documents
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Please upload all required documents in the specified formats. 
        Required fields are marked with an asterisk (*).
      </Typography>

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} md={6}>
          {leftColumn.map((doc) => (
            <Card key={doc.key} variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {doc.title} {doc.required && '*'}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {doc.description}
                </Typography>
                <FileInput
                  label={doc.title}
                  name={doc.key}
                  value={formData[doc.key]}
                  onChange={handleFileChange}
                  accept={doc.accept}
                />
              </CardContent>
            </Card>
          ))}
        </Grid>
        
        {/* Right Column */}
        <Grid item xs={12} md={6}>
          {rightColumn.map((doc) => (
            <Card key={doc.key} variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {doc.title} {doc.required && '*'}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {doc.description}
                </Typography>
                <FileInput
                  label={doc.title}
                  name={doc.key}
                  value={formData[doc.key]}
                  onChange={handleFileChange}
                  accept={doc.accept}
                />
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Documents;