import React, { useEffect, useState } from "react";
import { Grid, TextField, MenuItem, CircularProgress, Button, Box } from "@mui/material";
import { filterEnquiries } from "./AbroadInquiryService";
import { getBranchCodeNameMap } from "../../AllLogin/LoginService";
import { getAllConductBy } from "./formService";
import { getAllStaff } from "../../Branch/StaffService";
import axiosInstance from "../../Common/axiosConfig";
import PropTypes from 'prop-types';

InquiryFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  search: PropTypes.string,
  setSearch: PropTypes.func,
  role: PropTypes.string,
  email: PropTypes.string,
  data: PropTypes.array,
  continents: PropTypes.array,
  countries: PropTypes.array,
  states: PropTypes.array,
  cities: PropTypes.array,
  universities: PropTypes.array,
  colleges: PropTypes.array,
  streams: PropTypes.array,
  branches: PropTypes.array,
  courses: PropTypes.array,
  statuses: PropTypes.array,
  years: PropTypes.array,
  applyForOptions: PropTypes.array,
  refreshTrigger: PropTypes.number,
  staffNames: PropTypes.array,
};

export default function InquiryFilter({
  filters,
  onChange,
  onFilterChange,
  search = '',
  setSearch = () => {},
  continents = [],
  countries = [],
  states = [],
  cities = [],
  universities = [],
  colleges = [],
  streams = [],
  branches = [],
  courses = [],
  statuses = [],
  years = [],
  staffNames = [],
  applyForOptions = ["Certificate", "Diploma", "UG", "PG", "PHD", "Visa Application", "Passport", "Job Abroad"],
  role = '',
  email = '',
  data = [],
  refreshTrigger = 0
}) {
  const [branchOptions, setBranchOptions] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [conductByOptions, setConductByOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingConductBy, setLoadingConductBy] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [error, setError] = useState(null);
  
  const textFieldStyle = { width: '100%' };
  
  // Status options configuration
  const statusOptions = [
    { value: 'pending', label: 'INTERESTED', color: 'green' },
    { value: 'approved', label: 'NOT INTERESTED', color: 'red' },
    { value: 'connecting', label: 'CONNECTING', color: 'orange' },
    { value: 'ringing', label: 'RINGING', color: 'gold' },
    { value: 'callBack', label: 'CALL BACK', color: 'lightgreen' },
    { value: 'office_visit', label: 'OFFICE VISIT', color: '#9c27b0' },
    { value: 'processing', label: 'PROCESSING', color: 'blue' },
    { value: 'application', label: 'APPLICATION', color: 'maroon' },
    { value: 'CNI', label: 'CNI', color: 'pink' },
  ];

  // Fetch total count from backend
  const fetchTotalCount = async (branchCode) => {
    try {
      const params = {};
      if (branchCode && branchCode !== 'All') {
        params.branchCode = branchCode;
      }
      
      const response = await axiosInstance.get('/dashboard/TotalCount', { params });
      console.log('Total count response:', response.data);
      
      // Handle different response formats
      const total = response.data?.total || 
                   response.data?.totalCount || 
                   response.data?.count ||
                   Object.values(response.data || {})[0] ||
                   0;
      
      return total;
    } catch (error) {
      console.error('Error fetching total count:', error);
      return 0;
    }
  };

  // Fetch status-wise counts from backend
const fetchStatusCounts = async (branchCode) => {
  try {
    const params = {};
    if (branchCode && branchCode !== 'All') {
      params.branchCode = branchCode;
    }

    const response = await axiosInstance.get('/dashboard/status-count', { params });
    console.log('Status count response:', response.data);

    // initialize all with 0
    const counts = {};
    statusOptions.forEach(option => {
      counts[option.value] = 0;
    });

    if (response.data && typeof response.data === 'object') {
      Object.entries(response.data).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase().trim();

        // 🔥 FRONTEND NORMALIZATION MAP
        const keyMap = {
          "pending": "pending",
          "approved": "approved",
          "connecting": "connecting",
          "ringing": "ringing",
          "call_back": "callBack",
          "callback": "callBack",
          "office_visit": "office_visit",
          "processing": "processing",
          "application": "application",
          "cni": "CNI"
        };

        const mappedKey = keyMap[normalizedKey];

        if (mappedKey) {
          counts[mappedKey] = value || 0;
        }
      });
    }

    return counts;
  } catch (error) {
    console.error('Error fetching status counts:', error);
    const emptyCounts = {};
    statusOptions.forEach(option => {
      emptyCounts[option.value] = 0;
    });
    return emptyCounts;
  }
};


  // Fetch counts from backend
  const fetchCounts = async (branchCode = null) => {
    setLoadingCounts(true);
    setError(null);
    
    try {
      let branchCodeToUse = branchCode;
      
      // Determine branch code
      if (!branchCodeToUse) {
        if (role === 'superAdmin') {
          branchCodeToUse = filters.branchCode || 'All';
        } else {
          branchCodeToUse = sessionStorage.getItem('branchCode') || 'All';
        }
      }
      
      // Fetch both total and status counts in parallel
      const [total, statuses] = await Promise.all([
        fetchTotalCount(branchCodeToUse),
        fetchStatusCounts(branchCodeToUse)
      ]);
      
      setInquiryCount(total);
      setStatusCounts(statuses);
      
    } catch (err) {
      console.error('Error fetching counts:', err);
      setError('Failed to fetch counts');
      
      // Initialize empty counts on error
      const emptyCounts = {};
      statusOptions.forEach(option => {
        emptyCounts[option.value] = 0;
      });
      setInquiryCount(0);
      setStatusCounts(emptyCounts);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Fetch counts whenever branch code changes or component mounts
  useEffect(() => {
    const branchCode = role === 'superAdmin' 
      ? filters.branchCode 
      : sessionStorage.getItem('branchCode');
    
    fetchCounts(branchCode);
  }, [role, filters.branchCode, refreshTrigger]); // Include refreshTrigger for manual refresh

  const handleFilter = async (newFilters = filters) => {
    try {
      // Determine branch code based on role
      let branchCodeToUse;
      if (role === 'superAdmin') {
        branchCodeToUse = newFilters.branchCode || 'All';
      } else {
        branchCodeToUse = sessionStorage.getItem('branchCode') || 'All';
        if (branchCodeToUse !== newFilters.branchCode) {
          onChange({ ...filters, branchCode: branchCodeToUse });
        }
      }
      
      // Fetch filtered data
      const result = await filterEnquiries(
        newFilters.continent || null,
        newFilters.country || null,
          newFilters.state || null,
  newFilters.city || null,
  newFilters.college || null,
  newFilters.university || null,
  newFilters.year || null, 
        newFilters.stream || null,
        newFilters.course || null,
        newFilters.status || null,
        search || '',
        null,
        null,
        null,
        branchCodeToUse,
        role,
        email,
        0,
        10,
        newFilters.applyFor || null,
        newFilters.conductBy || null,
        newFilters.staffName || null
      );
      
      const inquiries = Array.isArray(result) ? result : (result?.content || []);
      
      // After filter changes, refresh counts from backend
      await fetchCounts(branchCodeToUse);
      
      // Call the parent callback
      if (onFilterChange) {
        onFilterChange(inquiries);
      }
    } catch (error) {
      console.error('Error in handleFilter:', error);
      
      if (onFilterChange) {
        onFilterChange([]);
      }
    }
  };

  // Handle filter changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilter(filters);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters, search]);

  // Set branch code from session storage on mount
  useEffect(() => {
    if (role !== 'superAdmin') {
      const branchCode = sessionStorage.getItem('branchCode');
      if (branchCode && branchCode !== filters.branchCode) {
        const newFilters = { ...filters, branchCode };
        onChange(newFilters);
      }
    }
  }, [role]);

  // Fetch conducted by options
  useEffect(() => {
    const fetchConductByOptions = async () => {
      setLoadingConductBy(true);
      try {
        const response = await getAllConductBy();
        const options = Array.isArray(response) 
          ? response
              .map(item => item?.conductBy)
              .filter(Boolean)
              .filter((value, index, self) => self.indexOf(value) === index)
              .sort((a, b) => a.localeCompare(b))
          : [];
        
        setConductByOptions(options);
      } catch (error) {
        console.error('Error fetching conducted by options:', error);
        setConductByOptions([]);
      } finally {
        setLoadingConductBy(false);
      }
    };

const fetchStaffOptions = async () => {
  setLoadingStaff(true);
  try {
    let branchCodeToUse;

    if (role === 'superAdmin') {
      // SuperAdmin: use selected branch, or null for ALL
      branchCodeToUse = filters.branchCode || null;
    } else {
      // Admin/Staff: always their own branch
      branchCodeToUse = sessionStorage.getItem('branchCode');
    }

    let staffList;

    if (branchCodeToUse) {
      // Fetch staff for specific branch
      staffList = await getAllStaff(branchCodeToUse);
    } else {
      // Fetch ALL staff (superAdmin, no branch selected)
      staffList = await getAllStaff();
    }

    const options = Array.isArray(staffList)
      ? staffList.map((s) => ({
          id: s.id,
          name: s.staffName || s.name || s.fullName || "Unnamed",
          email: s.staffEmail || s.email,
          branchCode: s.branchCode
        }))
      : [];

    setStaffOptions(options);
  } catch (error) {
    console.error('Error fetching staff options:', error);
    setStaffOptions([]);
  } finally {
    setLoadingStaff(false);
  }
};


    fetchConductByOptions();
    fetchStaffOptions();
  }, [role, filters.branchCode]);

  // Load branches for super admins
  useEffect(() => {
    let isMounted = true;
    
    const fetchBranches = async () => {
      if (role !== 'superAdmin') {
        setLoadingBranches(false);
        return;
      }
      
      try {
        setLoadingBranches(true);
        const branchMap = await getBranchCodeNameMap();
        
        if (isMounted) {
          const branchList = Object.entries(branchMap).map(([code, name]) => ({
            code,
            name
          }));
          setBranchOptions(branchList);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        if (isMounted) {
          setLoadingBranches(false);
        }
      }
    };

    fetchBranches();
    
    return () => {
      isMounted = false;
    };
  }, [role]);

  return (
    <Grid container spacing={1} alignItems="center" style={{ marginBottom: 16 }}>
      <Grid item xs={12} sm={4} md={2}>
        <TextField
          type="search"
          label="Search inquiries"
          variant="outlined"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          style={textFieldStyle}
          InputProps={{
            endAdornment: search ? (
              <span style={{ cursor: "pointer" }} onClick={() => setSearch("")}>
                ×
              </span>
            ) : null
          }}
        />
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Select Continent"
          value={filters.continent || ""}
          onChange={e => onChange({ ...filters, continent: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {continents.map(cont => (
            <MenuItem key={cont} value={cont}>{cont}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Select Country"
          value={filters.country || ""}
          onChange={e => onChange({ ...filters, country: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {countries.map(c => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Select State"
          value={filters.state || ""}
          onChange={e => onChange({ ...filters, state: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {states.map(s => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Select City"
          value={filters.city || ""}
          onChange={e => onChange({ ...filters, city: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {cities.map(c => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Select University"
          value={filters.university || ""}
          onChange={e => onChange({ ...filters, university: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {universities.map(u => (
            <MenuItem key={u} value={u}>{u}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Select College"
          value={filters.college || ""}
          onChange={e => onChange({ ...filters, college: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {colleges.map(c => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Select Stream"
          value={filters.stream || ""}
          onChange={e => onChange({ ...filters, stream: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {streams.map(s => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
      </Grid>

      {role === 'superAdmin' && (
        <Grid item xs={12} sm={4} md={2}>
          <TextField
            select
            label="Select Branch"
            value={filters.branchCode || ""}
            onChange={e => onChange({ ...filters, branchCode: e.target.value || null })}
            size="small"
            style={textFieldStyle}
            disabled={loadingBranches}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (!selected) return "All";
                const selectedBranch = branchOptions.find(b => b.code === selected);
                return selectedBranch ? selectedBranch.name : selected;
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            {loadingBranches ? (
              <MenuItem disabled>
                <CircularProgress size={20} style={{ marginRight: 8 }} />
                Loading branches...
              </MenuItem>
            ) : (
              branchOptions.map(branch => (
                <MenuItem key={branch.code} value={branch.code}>
                  {branch.name} ({branch.code})
                </MenuItem>
              ))
            )}
          </TextField>
        </Grid>
      )}

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Select Course"
          value={filters.course || ""}
          onChange={e => onChange({ ...filters, course: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {courses.map(c => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Status"
          value={filters.status || ""}
          onChange={e => onChange({ ...filters, status: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">
            <em>All Status</em>
          </MenuItem>
          <MenuItem value="pending" style={{ color: 'green' }}>INTERESTED</MenuItem>
          <MenuItem value="approved" style={{ color: 'red' }}>NOT INTERESTED</MenuItem>
          <MenuItem value="connecting" style={{ color: 'orange' }}>CONNECTING</MenuItem>
          <MenuItem value="ringing" style={{ color: 'gold' }}>RINGING</MenuItem>
          <MenuItem value="callBack" style={{ color: 'lightgreen' }}>CALL BACK</MenuItem>
          <MenuItem value="office_visit" style={{ color: '#9c27b0' }}>OFFICE VISIT</MenuItem>
          <MenuItem value="processing" style={{ color: 'blue' }}>PROCESSING</MenuItem>
          <MenuItem value="application" style={{ color: 'maroon' }}>APPLICATION</MenuItem>
          <MenuItem value="CNI" style={{ color: 'pink' }}>CNI</MenuItem>
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Select Year"
          value={filters.year || ""}
          onChange={e => onChange({ ...filters, year: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {years.map(y => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          label="Apply For"
          value={filters.applyFor || ""}
          onChange={e => onChange({ ...filters, applyFor: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          {applyForOptions.map(option => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          fullWidth
          label="Conducted By"
          value={filters.conductBy || ""}
          onChange={e => onChange({ ...filters, conductBy: e.target.value || null })}
          size="small"
          style={textFieldStyle}
          disabled={loadingConductBy}
        >
          <MenuItem value="">All</MenuItem>
          {loadingConductBy ? (
            <MenuItem disabled>
              <CircularProgress size={20} style={{ marginRight: 8 }} />
              Loading...
            </MenuItem>
          ) : (
            conductByOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))
          )}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={4} md={2}>
        <TextField
          select
          fullWidth
          label="Staff Name"
          value={filters.staffName || ""}
          onChange={e => onChange({ ...filters, staffName: e.target.value || null })}
          size="small"
          style={textFieldStyle}
          disabled={loadingStaff}
        >
          <MenuItem value="">All Staff</MenuItem>
          {loadingStaff ? (
            <MenuItem disabled>
              <CircularProgress size={20} style={{ marginRight: 8 }} />
              Loading...
            </MenuItem>
          ) : (
            staffOptions.length > 0 ? (
              staffOptions.map(staff => (
                <MenuItem key={staff.id} value={staff.name}>
                  {staff.name}
                </MenuItem>
              ))
            ) : (
              staffNames.map(staffName => (
                <MenuItem key={staffName} value={staffName}>
                  {staffName}
                </MenuItem>
              ))
            )
          )}
        </TextField>
      </Grid>

      {/* Status Counts Row */}
      <Grid item xs={12}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 2, 
          p: 1.5, 
          bgcolor: 'background.paper', 
          borderRadius: 1, 
          boxShadow: 1,
          mb: 2,
          flexWrap: 'wrap',
          border: '1px solid #e0e0e0'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            px: 2,
            py: 0.75,
            borderRadius: 1,
            fontWeight: 'bold',
            fontSize: '0.95rem',
            minWidth: '120px',
            justifyContent: 'center'
          }}>
            Total: {loadingCounts ? <CircularProgress size={18} color="inherit" sx={{ ml: 1 }} /> : inquiryCount}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {statusOptions.map((status) => (
              <Box
                key={status.value}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${status.color}`,
                  color: status.color,
                  minWidth: '140px',
                  backgroundColor: 'transparent',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <span>{status.label}</span>
                <Box 
                  sx={{
                    backgroundColor: status.color,
                    color: '#fff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    marginLeft: '8px'
                  }}
                >
                  {loadingCounts ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    statusCounts[status.value] || 0
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}