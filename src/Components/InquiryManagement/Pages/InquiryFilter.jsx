import React, { useEffect, useState } from "react";
import { Grid, TextField, MenuItem, CircularProgress, Box } from "@mui/material";
import { getBranchCodeNameMap } from "../../AllLogin/LoginService";
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
  onClearFilters: PropTypes.func,
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
  refreshTrigger = 0,
  onClearFilters = () => {}
}) {
  const [branchOptions, setBranchOptions] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [error, setError] = useState(null);
  
  const textFieldStyle = { width: '100%', background: '#fff' };
  
  // Status options configuration
  const statusOptions = [
    { value: 'pending', label: 'INTERESTED', color: '#2f8062' },
    { value: 'approved', label: 'NOT INTERESTED', color: '#bd6262' },
    { value: 'connecting', label: 'CONNECTING', color: '#b77b38' },
    { value: 'ringing', label: 'RINGING / SWITCH OFF', color: '#d6a600' },
    { value: 'callBack', label: 'CALL BACK', color: '#478d79' },
    { value: 'office_visit', label: 'OFFICE VISIT', color: '#8565a7' },
    { value: 'processing', label: 'PROCESSING', color: '#4779ad' },
    { value: 'application', label: 'APPLICATION', color: '#a65c77' },
    { value: 'CNI', label: 'CNI', color: '#947a91' },
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

  // Filtering is performed once by the parent from the scoped enquiry data.
  // Do not issue a competing paginated /filter request here.

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

  // Fetch staff options
  useEffect(() => {
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
    <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2, p: { xs: 1, sm: 1.25, md: 1.5 }, border: '1px solid #e4e9ef', borderRadius: 2, backgroundColor: '#fbfcfe', minWidth: 0 }}>

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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
        <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
        <TextField
          select
          label="Passport"
          value={filters.hasPassport ?? ""}
          onChange={e => onChange({ ...filters, hasPassport: e.target.value || null })}
          size="small"
          style={textFieldStyle}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Yes">Yes</MenuItem>
          <MenuItem value="No">No</MenuItem>
        </TextField>
      </Grid>

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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

      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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


      <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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
                <MenuItem key={staff.id} value={staff.email || staff.name}>
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

      {/* Compact, keyboard-accessible status navigation; API-backed branch counts. */}
      <Grid item xs={12}>
        <Box sx={{ mt: 0.5, p: { xs: 0.5, sm: 0.75 }, border: '1px solid #e2e8f0', borderRadius: 2, background: '#f5f7fa', minWidth: 0 }}>
          <Box role="group" aria-label="Filter inquiries by status" sx={{
            display: 'grid',
            width: '100%',
            minWidth: 0,
            gap: 0.75,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 132px), 1fr))',
            alignItems: 'stretch',
          }}>
            {statusOptions.map((status) => {
              const active = filters.status === status.value;
              const count = role === 'staff'
                ? data.filter((item) => String(item.status ?? '').toLowerCase().replace(/[\s_-]/g, '') === status.value.toLowerCase().replace(/[\s_-]/g, '')).length
                : (statusCounts[status.value] ?? 0);
              return (
                <Box key={status.value} component="button" type="button" aria-pressed={active}
                  onClick={() => onChange({ ...filters, status: active ? null : status.value })}
                  sx={{
                    display: 'flex',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 0.75,
                    minHeight: 40,
                    px: 1,
                    py: 0.65,
                    border: '1px solid',
                    borderColor: status.color,
                    borderRadius: '6px',
                    backgroundColor: active ? `${status.color}1f` : '#fff',
                    boxShadow: active ? `0 0 0 1px ${status.color} inset` : 'none',
                    color: status.color,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    lineHeight: 1.25,
                    fontWeight: active ? 750 : 650,
                    transition: 'background-color 120ms ease, border-color 120ms ease',
                    '&:hover': { backgroundColor: `${status.color}1f`, borderColor: status.color },
                    '&:focus-visible': { outline: `2px solid ${status.color}`, outlineOffset: 2 }
                  }}>
                  <Box component="span" sx={{ display: 'flex', minWidth: 0, alignItems: 'flex-start', gap: 0.75 }}>
                    <Box component="span" sx={{ width: 6, height: 6, mt: '4px', borderRadius: '50%', background: status.color, flexShrink: 0 }} />
                    <Box component="span" sx={{ minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{status.label}</Box>
                  </Box>
                  <Box component="span" sx={{ flexShrink: 0, borderRadius: 1, minWidth: 22, px: 0.6, py: 0.25,
                    backgroundColor: `${status.color}1f`, color: status.color,
                    fontSize: '0.7rem', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' }}>
                    {loadingCounts && role !== 'staff' ? '…' : count}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}