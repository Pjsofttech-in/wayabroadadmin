import React from 'react';
import {
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
} from '@mui/material';

const RegistrationFilters = ({ onFilter, streams = [], totalCount = 0 }) => {
  const [filters, setFilters] = React.useState({
    name: '',
    email: '',
    stream: '',
    course: '',
    location: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);
    onFilter(nextFilters);
  };

  const allCourses = [];
  streams.forEach((stream) => {
    if (stream.courses) {
      stream.courses.forEach((course) => {
        const courseName = course.name || course.courseName;
        if (courseName && !allCourses.some((item) => item.name === courseName)) {
          allCourses.push({
            id: course.id || courseName,
            name: courseName,
          });
        }
      });
    }
  });

  const controlSx = {
    '& .MuiOutlinedInput-root': {
      height: 38,
      borderRadius: '6px',
      backgroundColor: '#fff',
      fontSize: '0.82rem',
      '& fieldset': { borderColor: '#cbd5e1' },
      '&:hover fieldset': { borderColor: '#94a3b8' },
      '&.Mui-focused fieldset': { borderColor: '#1976d2' },
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.82rem',
      color: '#64748b',
    },
  };

  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        minWidth: 0,
        p: { xs: 1, sm: 1.25 },
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        bgcolor: '#fff',
        boxSizing: 'border-box',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.025)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 0.75,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#263548' }}
        >
          Filter registrations
        </Typography>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.4,
            border: '1px solid #e2e8f0',
            borderRadius: 1,
            bgcolor: '#f8fafc',
            color: '#64748b',
            fontSize: '0.73rem',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          <Box component="span" sx={{ fontWeight: 700, color: '#183b56' }}>
            {totalCount}
          </Box>
          Registrations
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
            lg: 'repeat(5, minmax(0, 1fr))',
          },
          gap: 1,
          alignItems: 'center',
          '& > *': { minWidth: 0 },
        }}
      >
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={filters.name}
          onChange={handleChange}
          size="small"
          variant="outlined"
          sx={controlSx}
        />

        <TextField
          fullWidth
          label="Email"
          name="email"
          value={filters.email}
          onChange={handleChange}
          size="small"
          variant="outlined"
          sx={controlSx}
        />

        <FormControl fullWidth size="small" sx={controlSx}>
          <InputLabel id="registration-stream-filter-label">Stream</InputLabel>
          <Select
            labelId="registration-stream-filter-label"
            name="stream"
            value={filters.stream}
            onChange={handleChange}
            label="Stream"
          >
            <MenuItem value="">All Streams</MenuItem>
            {streams.map((stream) => {
              const value = stream.name || stream.streamName || '';
              return (
                <MenuItem key={stream.id || value} value={value}>
                  {value || 'Unnamed Stream'}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={controlSx}>
          <InputLabel id="registration-course-filter-label">Course</InputLabel>
          <Select
            labelId="registration-course-filter-label"
            name="course"
            value={filters.course}
            onChange={handleChange}
            label="Course"
          >
            <MenuItem value="">All Courses</MenuItem>
            {allCourses.map((course) => (
              <MenuItem key={course.id} value={course.name}>
                {course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Location"
          name="location"
          value={filters.location}
          onChange={handleChange}
          size="small"
          variant="outlined"
          sx={controlSx}
        />
      </Box>
    </Box>
  );
};

export default RegistrationFilters;
