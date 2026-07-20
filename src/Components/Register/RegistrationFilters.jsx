import React from 'react';
import { 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Grid, 
  Typography, 
  Box
} from '@mui/material';

const RegistrationFilters = ({ onFilter, streams = [], totalCount = 0 }) => {
  const [filters, setFilters] = React.useState({
    name: '',
    email: '',
    stream: '',
    course: '',
    location: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  // Get all unique courses from the streams data
  const allCourses = [];
  streams.forEach(stream => {
    if (stream.courses) {
      stream.courses.forEach(course => {
        if (!allCourses.some(c => c.name === course.name)) {
          allCourses.push({
            id: course.id || course.name,
            name: course.name
          });
        }
      });
    }
  });

  return (
    <Box mb={2}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Typography variant="body2" color="text.secondary">
          Total Registrations: {totalCount}
        </Typography>
      </Box>
      
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={filters.name}
              onChange={handleChange}
              size="small"
              variant="outlined"
            />
          </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={filters.email}
            onChange={handleChange}
            size="small"
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <FormControl fullWidth size="small">
            <InputLabel>Stream</InputLabel>
            <Select
              name="stream"
              value={filters.stream}
              onChange={handleChange}
              label="Stream"
            >
              <MenuItem value="">All Streams</MenuItem>
              {streams.map((stream) => (
                <MenuItem key={stream.id} value={stream.name}>
                  {stream.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <FormControl fullWidth size="small">
            <InputLabel>Course</InputLabel>
            <Select
              name="course"
              value={filters.course}
              onChange={handleChange}
              label="Course"

            >
              <MenuItem value="">All Courses</MenuItem>
              {allCourses.map(course => (
                <MenuItem key={course.id} value={course.name}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={filters.location}
            onChange={handleChange}
            size="small"
            variant="outlined"
          />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default RegistrationFilters;
