import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Button,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { partnerService } from "./partnerService";

// Initial filter state
const initialFilters = {
  name: '',
  email: '',
  businessEmail: '',
  conductedBy: '',
  instituteType: '',
  contractType: '',
  status: ''
};

// Status options with colors for UI
const statusOptions = [
  { value: 'Interested', label: 'Interested', color: '#4caf50' },
  { value: 'Not Interested', label: 'Not Interested', color: '#f44336' },
  { value: 'Meeting Scheduled', label: 'Meeting Scheduled', color: '#2196f3' },
  { value: 'Onboard', label: 'Onboard', color: '#9c27b0' },
  { value: 'Ringing', label: 'Ringing', color: '#ff9800' }
];

// Map of normalized status values to their display values
const STATUS_MAP = {
  'interested': 'Interested',
  'not_interested': 'Not Interested',
  'notinterested': 'Not Interested',
  'meeting_scheduled': 'Meeting Scheduled',
  'meetingscheduled': 'Meeting Scheduled',
  'onboard': 'Onboard',
  'ringing': 'Ringing'
};

// Function to normalize status values for comparison
const normalizeStatus = (status) => {
  if (!status) return '';
  const normalized = status.toLowerCase().replace(/[^a-z0-9]/g, '');
  return STATUS_MAP[normalized] || status;
};

const PartnerFilter = ({ onFilterChange, filters = initialFilters, loading = false }) => {
  const [searchText, setSearchText] = useState(filters.name || '');
  const [filterOptions, setFilterOptions] = useState({
    conductedBy: [],
    instituteTypes: [],
    contractTypes: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch filter options from API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoading(true);
      try {
        // Fetch initial filter options
        const response = await partnerService.filterPartners({});
        
        if (response && !response.error) {
          // Extract unique values for each filter from the response
          const conductedBy = [...new Set(response.content?.map(item => item.conductedBy).filter(Boolean))];
          const instituteTypes = [...new Set(response.content?.map(item => item.instituteType).filter(Boolean))];
          const contractTypes = [...new Set(response.content?.map(item => item.contractType).filter(Boolean))];
          
          setFilterOptions({
            conductedBy,
            instituteTypes,
            contractTypes
          });
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchText(value);
    
    // Debounce search to avoid too many API calls
    const timer = setTimeout(async () => {
      const newFilters = {
        ...filters,
        name: value || undefined
      };
      onFilterChange?.(newFilters);
    }, 500);
    
    return () => clearTimeout(timer);
  };

  const handleFilterChange = (field, value) => {
    // Normalize status value before setting it in filters
    const normalizedValue = field === 'status' ? normalizeStatus(value) : value;
    
    const newFilters = {
      ...filters,
      [field]: normalizedValue || undefined
    };
    onFilterChange?.(newFilters);
  };

  // Helper to create select options with "All" option
  const getSelectOptions = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return [
      { value: '', label: 'All' },
      ...items.map(item => ({
        value: item,
        label: item
      }))
    ];
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center">
        {/* Search Field */}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name, email..."
            value={searchText}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            }}
            size="small"
          />
        </Grid>

        {/* Email Filter */}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            value={filters.email || ''}
            onChange={(e) => handleFilterChange('email', e.target.value)}
            size="small"
          />
        </Grid>

        {/* Business Email Filter */}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Business Email"
            variant="outlined"
            value={filters.businessEmail || ''}
            onChange={(e) => handleFilterChange('businessEmail', e.target.value)}
            size="small"
          />
        </Grid>

        {/* Status Filter */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
              variant="outlined"
            >
              {getSelectOptions(statusOptions.map(s => s.value)).map((option) => {
                const status = statusOptions.find(s => s.value === option.value);
                return (
                  <MenuItem key={option.value} value={option.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {status?.color && (
                        <Box 
                          width={12} 
                          height={12} 
                          borderRadius="50%" 
                          bgcolor={status.color}
                        />
                      )}
                      {option.label}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Conducted By Filter */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Conducted By</InputLabel>
            <Select
              value={filters.conductedBy || ''}
              label="Conducted By"
              onChange={(e) => handleFilterChange('conductedBy', e.target.value)}
              variant="outlined"
            >
              {getSelectOptions(filterOptions.conductedBy).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Institute Type Filter */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Institute Type</InputLabel>
            <Select
              value={filters.instituteType || ''}
              label="Institute Type"
              onChange={(e) => handleFilterChange('instituteType', e.target.value)}
              variant="outlined"
            >
              {getSelectOptions(filterOptions.instituteTypes).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Contract Type Filter */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Contract Type</InputLabel>
            <Select
              value={filters.contractType || ''}
              label="Contract Type"
              onChange={(e) => handleFilterChange('contractType', e.target.value)}
              variant="outlined"
            >
              {getSelectOptions(filterOptions.contractTypes).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PartnerFilter;