import React from 'react';
import { 
  Box, 
  TextField, 
  InputLabel, 
  MenuItem, 
  FormControl, 
  Select, 
  Button, 
  Grid,
  IconButton,
  Tooltip,
  Typography,
  InputAdornment,
  Stack,
  Chip
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const ApplicationFilter = ({ 
  filters, 
  onFilterChange, 
  onReset,
  countries = [],
  universities = [],
  conductedBy = []  // Add conductedBy prop with default empty array
}) => {
  const statusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'visa_accepted', label: 'Visa Accepted' },
    { value: 'visa_rejected', label: 'Visa Rejected' },
    { value: 'passport_issued', label: 'Passport Issued' },
    { value: 'passport_rejected', label: 'Passport Rejected' },
    { value: 'doc_incomplete', label: 'Doc Incomplete' },
    { value: 'app_proceed', label: 'App Proceed' },
    { value: 'adm_completed', label: 'Adm Completed' },
  ];

  // Check if any filters are active
  const isAnyFilterActive = 
    filters.country || 
    filters.university || 
    filters.status || 
    filters.search ||
    filters.conductedBy;

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: -3 }}>
        <Box sx={{ flexGrow: 1 }} />
        {isAnyFilterActive && (
          <Button
            size="small"
            onClick={onReset}
            startIcon={<RefreshIcon />}
            sx={{ ml: 1 }}
          >
            Reset Filters
          </Button>
        )}
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>Country</InputLabel>
            <Select
              value={filters.country || ''}
              onChange={(e) => onFilterChange('country', e.target.value)}
              label="Country"
              startAdornment={
                filters.country && (
                  <InputAdornment position="start">
                    <ClearIcon 
                      fontSize="small" 
                      onClick={() => onFilterChange('country', '')}
                      sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    />
                  </InputAdornment>
                )
              }
            >
              <MenuItem value="">
                <em>All Countries</em>
              </MenuItem>
              {countries.map((country) => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>University</InputLabel>
            <Select
              value={filters.university || ''}
              onChange={(e) => onFilterChange('university', e.target.value)}
              label="University"
              startAdornment={
                filters.university && (
                  <InputAdornment position="start">
                    <ClearIcon 
                      fontSize="small" 
                      onClick={() => onFilterChange('university', '')}
                      sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    />
                  </InputAdornment>
                )
              }
            >
              <MenuItem value="">
                <em>All Universities</em>
              </MenuItem>
              {universities.map((university) => (
                <MenuItem key={university} value={university}>
                  {university}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value)}
              label="Status"
              startAdornment={
                filters.status && (
                  <InputAdornment position="start">
                    <ClearIcon 
                      fontSize="small" 
                      onClick={() => onFilterChange('status', '')}
                      sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    />
                  </InputAdornment>
                )
              }
            >
              <MenuItem value="">
                <em>All Statuses</em>
              </MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Conducted By</InputLabel>
            <Select
              value={filters.conductedBy || ''}
              onChange={(e) => onFilterChange('conductedBy', e.target.value)}
              label="Conducted By"
              startAdornment={
                filters.conductedBy && (
                  <InputAdornment position="start">
                    <ClearIcon 
                      fontSize="small" 
                      onClick={() => onFilterChange('conductedBy', '')}
                      sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    />
                  </InputAdornment>
                )
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {conductedBy.map((person) => (
                <MenuItem key={person.id} value={person.id}>
                  {person.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            size="small"
            label="Search by Name/Email"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: filters.search && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onFilterChange('search', '')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            placeholder="Search applications..."
          />
        </Grid>
      </Grid>
      
      {isAnyFilterActive && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {filters.country && (
            <Chip
              label={`Country: ${filters.country}`}
              onDelete={() => onFilterChange('country', '')}
              size="small"
              sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}
            />
          )}
          {filters.university && (
            <Chip
              label={`University: ${filters.university}`}
              onDelete={() => onFilterChange('university', '')}
              size="small"
              sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}
            />
          )}
          {filters.status && (
            <Chip
              label={`Status: ${statusOptions.find(s => s.value === filters.status)?.label || filters.status}`}
              onDelete={() => onFilterChange('status', '')}
              size="small"
              sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}
            />
          )}
          {filters.conductedBy && (
            <Chip
              label={`Conducted By: ${conductedBy.find(p => p.id === filters.conductedBy)?.name || filters.conductedBy}`}
              onDelete={() => onFilterChange('conductedBy', '')}
              size="small"
              sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default ApplicationFilter;