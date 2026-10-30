import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { partnerService } from './partnerService';

const initialFilters = {
  name: '',
  email: '',
  businessEmail: '',
  conductedBy: '',
  instituteType: '',
  contractType: '',
  status: '',
};

const defaultStatusOptions = [
  { value: 'interested', label: 'Interested', color: '#4caf50' },
  { value: 'not_interested', label: 'Not Interested', color: '#f44336' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: '#2196f3' },
  { value: 'onboard', label: 'Onboard', color: '#9c27b0' },
  { value: 'ringing', label: 'Ringing', color: '#ff9800' },
];

const normalizeStatus = (status) => {
  if (!status) return '';
  return status.toString().trim().toLowerCase().replace(/[\s-]+/g, '_');
};

const fieldSx = {
  width: '100%',
  '& .MuiInputBase-root': {
    minHeight: 36,
    height: 36,
    borderRadius: '4px',
    backgroundColor: '#fff',
    fontSize: '0.76rem',
  },
  '& .MuiInputBase-input': {
    py: '8px',
    fontSize: '0.76rem',
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.76rem',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#d6dbe1',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#9aabba',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#2585bd',
    borderWidth: '1px',
  },
};
const PartnerFilter = ({
  onFilterChange,
  filters = initialFilters,
  loading = false,
  conductedByOptions: conductedByOptionsProp = [],
  statusOptions: statusOptionsProp = defaultStatusOptions,
}) => {
  const [searchText, setSearchText] = useState(filters.name || '');
  const [filterOptions, setFilterOptions] = useState({
    conductedBy: [],
    instituteTypes: [],
    contractTypes: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const filtersRef = useRef(filters);
  const isFirstSearchEffect = useRef(true);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Keep the search field synchronized when filters are reset externally.
  useEffect(() => {
    setSearchText(filters.name || '');
  }, [filters.name]);

  // Conducted By is supplied by PartnerList. Fetch only the remaining option lists here.
  useEffect(() => {
    let isMounted = true;

    const fetchFilterOptions = async () => {
      setIsLoading(true);
      try {
        const response = await partnerService.filterPartners({});
        if (isMounted && response && !response.error) {
          const content = response.content || [];
          setFilterOptions({
            conductedBy: [],
            instituteTypes: [...new Set(content.map((item) => item.instituteType).filter(Boolean))],
            contractTypes: [...new Set(content.map((item) => item.contractType).filter(Boolean))],
          });
        }
      } catch (error) {
        console.error('Error fetching partner filter options:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFilterOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const conductedByValues = (Array.isArray(conductedByOptionsProp)
    ? conductedByOptionsProp
    : []
  )
    .map((option) => {
      if (typeof option === 'string') return option;
      return option?.conductBy || option?.conductedBy || option?.name || '';
    })
    .filter(Boolean);

  const statusOptions = Array.isArray(statusOptionsProp) && statusOptionsProp.length
    ? statusOptionsProp
    : defaultStatusOptions;

  const selectOptions = (items) => [
    { value: '', label: 'All' },
    ...(Array.isArray(items) ? items : []).map((item) => ({
      value: item,
      label: item,
    })),
  ];

  // Debounce name search; use the latest filters to avoid overwriting other active filters.
  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return undefined;
    }

    const timer = setTimeout(() => {
      onFilterChange?.({
        ...filtersRef.current,
        name: searchText || undefined,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText, onFilterChange]);

  const handleFilterChange = (field, value) => {
    const normalizedValue = field === 'status' ? normalizeStatus(value) : value;
    onFilterChange?.({
      ...filters,
      [field]: normalizedValue || undefined,
    });
  };

  if (isLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        p: 0.75,
        bgcolor: '#fff',
        border: '1px solid #e4e9ef',
        borderRadius: '2px',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
            lg: 'repeat(7, minmax(0, 1fr))',
          },
          gap: 0.75,
          alignItems: 'center',
          '& > *': { minWidth: 0 },
        }}
      >
        <Box sx={{ minWidth: 0 }}> 
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search by name..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#718096', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}> 
          <TextField
            fullWidth
            size="small"
            label="Email"
            variant="outlined"
            value={filters.email || ''}
            onChange={(event) => handleFilterChange('email', event.target.value)}
            sx={fieldSx}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}> 
          <TextField
            fullWidth
            size="small"
            label="Business Email"
            variant="outlined"
            value={filters.businessEmail || ''}
            onChange={(event) => handleFilterChange('businessEmail', event.target.value)}
            sx={fieldSx}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}> 
          <FormControl fullWidth size="small" sx={fieldSx}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              label="Status"
              onChange={(event) => handleFilterChange('status', event.target.value)}
            >
              {selectOptions(statusOptions.map((status) => status.value)).map((option) => {
                const status = statusOptions.find((item) => normalizeStatus(item.value) === normalizeStatus(option.value));
                return (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {status?.color && (
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: status.color }} />
                      )}
                      {option.label}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ minWidth: 0 }}> 
          <FormControl fullWidth size="small" sx={fieldSx}>
            <InputLabel>Conducted By</InputLabel>
            <Select
              value={filters.conductedBy || ''}
              label="Conducted By"
              onChange={(event) => handleFilterChange('conductedBy', event.target.value)}
            >
              {selectOptions(conductedByValues).map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ minWidth: 0 }}> 
          <FormControl fullWidth size="small" sx={fieldSx}>
            <InputLabel>Institute Type</InputLabel>
            <Select
              value={filters.instituteType || ''}
              label="Institute Type"
              onChange={(event) => handleFilterChange('instituteType', event.target.value)}
            >
              {selectOptions(filterOptions.instituteTypes).map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ minWidth: 0 }}> 
          <FormControl fullWidth size="small" sx={fieldSx}>
            <InputLabel>Contract Type</InputLabel>
            <Select
              value={filters.contractType || ''}
              label="Contract Type"
              onChange={(event) => handleFilterChange('contractType', event.target.value)}
              >
              {selectOptions(filterOptions.contractTypes).map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default PartnerFilter;