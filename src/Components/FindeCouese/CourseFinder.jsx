import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Checkbox,
  ListItemText,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText as MuiListItemText,
  Divider
} from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SchoolIcon from '@mui/icons-material/School';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import { 
  getAllContinents, 
  getHierarchy, 
  getAllCountries, 
  getAllStates, 
  getAllCities, 
  getAllUniversity as getAllUniversities, 
  getAllColleges, 
  getAllCourses,
  getAllStreams,
  searchUniversities,
  searchStates,
  searchCities,
  searchColleges,
  searchCountries,
  searchStreams
} from "../../Admin/api/courseApi";

export default function CourseFinder() {
  // Search state for filter dropdowns
  const [searchTexts, setSearchTexts] = useState({
    continent: '',
    country: '',
    state: '',
    city: '',
    university: '',
    college: '',
    stream: ''
  });
  
  const [continents, setContinents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCity] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]); // <-- store all courses for independent filter
  const [streams, setStreams] = useState([]);
  const [globalSearch, setGlobalSearch] = useState("");
  
  // Filter states - now support multiple selections
  const [filters, setFilters] = useState({
    continentId: [],
    countryId: [],
    stateId: [],
    cityId: [],
    universityId: [],
    collegeId: [],
    courseId: [],
    streamName: [],
    scholarship: '',
    feesRange: '',
    examType: [],
    englishExamRequirements: '',
    academicRequirements: [],
    intake: []
  });
  
  const [hierarchyData, setHierarchyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [showDescription, setShowDescription] = useState({});
  const [error, setError] = useState(null);

  // Handle filter text change
  const handleFilterTextChange = (type, value) => {
    setSearchTexts(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Styles for search text fields
  const searchFieldStyles = {
    '& .MuiInputBase-input': {
      color: 'text.primary !important',
      '&::placeholder': {
        color: 'text.secondary !important',
        opacity: 1,
      },
    },
    '& .MuiInputBase-root': {
      color: 'text.primary !important',
      '&.Mui-focused': {
        '& .MuiInputBase-input': {
          color: 'text.primary !important',
        },
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.23) !important',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.87) !important',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main !important',
      borderWidth: '1px !important',
    },
  };

  // Filter options based on search text
  const getFilteredOptions = (type, items = []) => {
    if (!items || !Array.isArray(items)) return [];
    
    const searchText = (searchTexts[type] || '').toLowerCase().trim();
    
    // If no search text, return all items
    if (!searchText) return items;
    
    // Filter items based on search text
    return items.filter(item => {
      if (!item) return false;
      
      // Try different possible property names for the item's display name
      const name = (
        item.name || 
        item[`${type}Name`] || 
        item[type] || 
        item.title || 
        item.label || 
        ''
      ).toString().toLowerCase();
      
      return name.includes(searchText);
    });
  };

  // Get user credentials
  const getUserCredentials = () => {
    return {
      email: sessionStorage.getItem("email") || "admin@example.com",
      role: sessionStorage.getItem("role") || "Admin"
    };
  };

  // Fetch data based on current filters (independent filters)
  const fetchFilteredData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query parameters object for multiple selections
      const params = {};
      
      // Add any selected filters to the params
      if (filters.continentId?.length) {
        params.continentId = filters.continentId;
      }
      if (filters.countryId?.length) {
        const selectedCountries = countries
          .filter(c => filters.countryId.includes(c.id))
          .map(c => c.countryName || c.country)
          .filter(Boolean);
        if (selectedCountries.length) params.countryName = selectedCountries;
      }
      if (filters.stateId?.length) {
        const selectedStates = states
          .filter(s => filters.stateId.includes(s.id))
          .map(s => s.stateName || s.state)
          .filter(Boolean);
        if (selectedStates.length) params.stateName = selectedStates;
      }
      if (filters.cityId?.length) {
        const selectedCities = cities
          .filter(c => filters.cityId.includes(c.id))
          .map(c => c.cityName || c.city)
          .filter(Boolean);
        if (selectedCities.length) params.cityName = selectedCities;
      }
      if (filters.universityId?.length) {
        const selectedUniversities = universities
          .filter(u => filters.universityId.includes(u.id))
          .map(u => u.name || u.universityName)
          .filter(Boolean);
        if (selectedUniversities.length) params.universityName = selectedUniversities;
      }
      if (filters.collegeId?.length) {
        const selectedColleges = colleges
          .filter(c => filters.collegeId.includes(c.id))
          .map(c => c.name || c.collegeName)
          .filter(Boolean);
        if (selectedColleges.length) params.collegeName = selectedColleges;
      }
      if (filters.streamName?.length) {
        params.streamName = filters.streamName;
      }
      if (filters.scholarship) {
        params.scholarship = filters.scholarship;
      }
      if (filters.feesRange) {
        params.feesRange = filters.feesRange;
      }
      if (filters.examType?.length) {
        params.examType = filters.examType;
      }
      if (filters.englishExamRequirements) {
        params.englishExamRequirements = filters.englishExamRequirements;
      }
      if (filters.academicRequirements?.length) {
        params.academicRequirements = filters.academicRequirements;
      }
      if (filters.intake?.length) {
        params.intake = filters.intake;
      }

      if (filters.courseId?.length) {
        const selectedCourses = courses
          .filter(c => filters.courseId.includes(c.id))
          .map(c => c.name || c.courseName)
          .filter(Boolean);
        if (selectedCourses.length) params.courseName = selectedCourses;
      }
      
      const response = await getHierarchy(params);
      setHierarchyData(Array.isArray(response) ? response : []);
      
    } catch (err) {
      console.error("Error fetching filtered data:", err);
      setError("Failed to load filtered data. Please try again.");
      setHierarchyData([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply global search across entities and update filters
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const q = (globalSearch || "").trim();
      if (!q) return; // do nothing on empty; user can clear filters via button
      try {
        // Run all search APIs in parallel
        const [
          uniNames,
          stateNames,
          cityNames,
          collegeNames,
          countryNames,
          streamNames
        ] = await Promise.all([
          searchUniversities(q),
          searchStates(q),
          searchCities(q),
          searchColleges(q),
          searchCountries(q),
          searchStreams(q)
        ]);

        // Helper: case-insensitive set for quick membership
        const toSet = (arr) => new Set((Array.isArray(arr) ? arr : []).map((s) => String(s).toLowerCase()))
        const uniSet = toSet(uniNames);
        const stateSet = toSet(stateNames);
        const citySet = toSet(cityNames);
        const collegeSet = toSet(collegeNames);
        const countrySet = toSet(countryNames);
        const streamSet = toSet(streamNames);

        // Derive IDs for each list based on returned names
        const matchedCountryIds = countries
          .filter((c) => countrySet.has(String(c.countryName || c.country || c.name).toLowerCase()))
          .map((c) => c.id);

        const matchedStateIds = states
          .filter((s) => stateSet.has(String(s.stateName || s.state || s.name).toLowerCase()))
          .map((s) => s.id);

        const matchedCityIds = cities
          .filter((c) => citySet.has(String(c.cityName || c.city || c.name).toLowerCase()))
          .map((c) => c.id);

        const matchedUniversityIds = universities
          .filter((u) => uniSet.has(String(u.universityName || u.name || u.university).toLowerCase()))
          .map((u) => u.id);

        const matchedCollegeIds = colleges
          .filter((c) => collegeSet.has(String(c.collegeName || c.name).toLowerCase()))
          .map((c) => c.id);

        const matchedStreamNames = streams
          .map((s) => s.name || s.streamName)
          .filter((n) => n && streamSet.has(String(n).toLowerCase()));

        // Update filters in one go
        setFilters((prev) => ({
          ...prev,
          countryId: matchedCountryIds,
          stateId: matchedStateIds,
          cityId: matchedCityIds,
          universityId: matchedUniversityIds,
          collegeId: matchedCollegeIds,
          streamName: matchedStreamNames
        }));
      } catch (err) {
        console.error("Global search failed:", err);
      }
    };

    // Debounce
    const t = setTimeout(run, 400);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [globalSearch, countries, states, cities, universities, colleges, streams]);

  // Fetch all data independently when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const { email, role } = getUserCredentials();
        const branchCode = sessionStorage.getItem("branchCode") || "";

        // Fetch all data in parallel
        const [
          continentsData, 
          allCoursesData, 
          streamsData,
          countriesData,
          statesData,
          citiesData,
          universitiesData,
          collegesData
        ] = await Promise.all([
          getAllContinents("", email, role),
          getAllCourses({ email, role }),
          getAllStreams({ email, role }),
          getAllCountries({ email, role, branchCode }),
          getAllStates({ email, role }),
          getAllCities({ email, role }),
          getAllUniversities({ email, role }),
          getAllColleges({ email, role })
        ]);

        // Set all data independently
        setContinents(Array.isArray(continentsData) ? continentsData : []);
        setAllCourses(Array.isArray(allCoursesData) ? allCoursesData : []);
        setCourses(Array.isArray(allCoursesData) ? allCoursesData : []);
        setStreams(Array.isArray(streamsData) ? streamsData : []);
        setCountries(Array.isArray(countriesData) ? countriesData : []);
        setStates(Array.isArray(statesData) ? statesData : []);
        setCity(Array.isArray(citiesData) ? citiesData : []);
        setUniversities(Array.isArray(universitiesData) ? universitiesData : []);
        setColleges(Array.isArray(collegesData) ? collegesData : []);

        // Fetch initial filtered data
        await fetchFilteredData();

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);
  
  // Define which filters are multiple select
  const multipleSelectFilters = [
    'continentId', 'countryId', 'stateId', 'cityId', 'universityId', 'collegeId',
    'courseId', 'streamName', 'examType', 'academicRequirements', 'intake'
  ];

  // Handle filter changes - all filters are independent
  const handleFilterChange = (filterName, value) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters };
      
      // Set the value based on whether it's a multiple select or not
      if (multipleSelectFilters.includes(filterName)) {
        updatedFilters[filterName] = Array.isArray(value) ? value : [value];
      } else {
        updatedFilters[filterName] = value || '';
      }
      
      return updatedFilters;
    });
  };

  // Apply filters when they change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredData();
    }, 500); // Debounce to avoid too many API calls
    return () => clearTimeout(timer);
  }, [filters]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      continentId: [],
      countryId: [],
      stateId: [],
      cityId: [],
      universityId: [],
      collegeId: [],
      courseId: [],
      streamName: [],
      scholarship: '',
      feesRange: '',
      examType: [],
      englishExamRequirements: '',
      academicRequirements: [],
      intake: []
    });
  };

  // Rest of the component remains the same...
  const toggleCourseExpansion = (courseKey) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseKey]: !prev[courseKey]
    }));
  };

  const toggleDescription = (courseKey) => {
    setShowDescription(prev => ({
      ...prev,
      [courseKey]: !prev[courseKey]
    }));
  };

  const renderCourseDetails = (course, courseKey) => {
    const isExpanded = expandedCourses[courseKey];
    const showDesc = showDescription[courseKey];

    return (
      <Card 
        variant="outlined" 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {course.courseName || 'Course Name N/A'}
          </Typography>
          
          <Box sx={{ mt: 1 }}>
            {/* Stream Name */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Stream Name:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {course.streamName || 'N/A'}
              </Typography>
            </Box>

            {/* Course Description with toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Description:
                </Typography>
                <Tooltip title={showDesc ? 'Hide description' : 'Show description'}>
                  <IconButton 
                    size="small" 
                    onClick={() => toggleDescription(courseKey)}
                    sx={{ p: 0, ml: 0.5 }}
                  >
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {showDesc && (
              <Box sx={{ mb: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {course.description || 'No description available'}
                </Typography>
              </Box>
            )}

            {/* Basic Course Info */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Duration:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {course.duration || 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Institute Rank:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {course.institute_rank || course.instituteRank || 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Intake:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {course.intake || 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Tuition Fees:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {course.tutionFees ? `₹${Number(course.tutionFees).toLocaleString()}` : 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Application Fees:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {course.applicationFees ? `₹${Number(course.applicationFees).toLocaleString()}` : 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Website:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {course.websiteLink ? (
                  <a href={course.websiteLink} target="_blank" rel="noopener noreferrer" style={{ color: 'primary.main' }}>
                    Visit Website
                  </a>
                ) : 'N/A'}
              </Typography>
            </Box>

            {/* Expand/Collapse Button */}
            <Button 
              size="small" 
              onClick={() => toggleCourseExpansion(courseKey)}
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ 
                mt: 1, 
                mb: 1,
                textTransform: 'none',
                fontSize: '0.75rem',
                color: 'primary.main'
              }}
            >
              {isExpanded ? 'Show Less' : 'View More Details'}
            </Button>

            {/* Expanded Details */}
            {isExpanded && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Academic Requirements:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.academicRequirements || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    English Exam Requirements:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.englishExamRequirements || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Exam Score:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.examScore || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Additional Requirements:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.additionalRequirements || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Scholarship:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.scholarship || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Hostel Available:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.hostel || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Hostel Fees:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.hostelFees ? `₹${Number(course.hostelFees).toLocaleString()}` : 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Exam Type:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.examType || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Application Link:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.applicationLink ? (
                      <a href={course.applicationLink} target="_blank" rel="noopener noreferrer" style={{ color: 'primary.main' }}>
                        Apply Now
                      </a>
                    ) : 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tuition Fees (INR):
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.tutionFeesINR ? `₹${Number(course.tutionFeesINR).toLocaleString()}` : 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Fees (INR):
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {course.feesINR ? `₹${Number(course.feesINR).toLocaleString()}` : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', whiteSpace: 'nowrap' }}>
          University Course Finder
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, maxWidth: '600px' }}>
          <TextField
            fullWidth
            placeholder="Search..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '40px'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: globalSearch && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setGlobalSearch("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            onClick={() => { setGlobalSearch(""); clearAllFilters(); }}
            sx={{ whiteSpace: 'nowrap', height: '40px' }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Sidebar for Filters */}
        <Grid item xs={12} md={1.5} sx={{ width: '18%' }}>
          {/* <Typography variant="h6" gutterBottom>Filters</Typography> */}
          
          {/* Continent Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Continent</InputLabel>
            <Select
              multiple
              value={filters.continentId}
              onChange={(e) => handleFilterChange('continentId', e.target.value)}
              label="Continent"
              disabled={loading}
              renderValue={(selected) => {
                if (!selected.length) return <em>All Continents</em>;
                return continents
                  .filter(c => selected.includes(c.id))
                  .map(c => c.continentName || c.continentname)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <Box sx={{ p: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search continents..."
                  value={searchTexts.continent}
                  onChange={(e) => handleFilterTextChange('continent', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  sx={searchFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTexts.continent && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterTextChange('continent', '');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <MenuItem value="">
                <em>All Continents</em>
              </MenuItem>
              {getFilteredOptions('continent', continents).map((cont) => (
                <MenuItem key={cont.id} value={cont.id}>
                  <Checkbox checked={filters.continentId.indexOf(cont.id) > -1} />
                  <ListItemText primary={cont.continentName || cont.continentname} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Country Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Country</InputLabel>
            <Select
              multiple
              value={filters.countryId}
              onChange={(e) => handleFilterChange('countryId', e.target.value)}
              label="Country"
              disabled={!filters.continentId.length || loading}
              renderValue={(selected) => {
                if (!selected.length) return <em>All Countries</em>;
                return countries
                  .filter(c => selected.includes(c.id))
                  .map(c => c.countryName || c.country)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <Box sx={{ p: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search countries..."
                  value={searchTexts.country}
                  onChange={(e) => handleFilterTextChange('country', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!filters.continentId.length}
                  sx={searchFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTexts.country && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterTextChange('country', '');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <MenuItem value="">
                <em>All Countries</em>
              </MenuItem>
              {getFilteredOptions('country', countries).map((country) => (
                <MenuItem key={country.id} value={country.id}>
                  <Checkbox checked={filters.countryId.indexOf(country.id) > -1} />
                  <ListItemText primary={country.countryName || country.country} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* State Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>State</InputLabel>
            <Select
              multiple
              value={filters.stateId}
              onChange={(e) => handleFilterChange('stateId', e.target.value)}
              label="State"
              disabled={!filters.countryId.length || loading}
              renderValue={(selected) => {
                if (!selected.length) return <em>All States</em>;
                return states
                  .filter(s => selected.includes(s.id))
                  .map(s => s.stateName || s.state)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <Box sx={{ p: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search states..."
                  value={searchTexts.state}
                  onChange={(e) => handleFilterTextChange('state', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!filters.countryId.length}
                  sx={searchFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTexts.state && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterTextChange('state', '');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <MenuItem value="">
                <em>All States</em>
              </MenuItem>
              {getFilteredOptions('state', states).map((state) => (
                <MenuItem key={state.id} value={state.id}>
                  <Checkbox checked={filters.stateId.indexOf(state.id) > -1} />
                  <ListItemText primary={state.stateName || state.state} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* City Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>City</InputLabel>
            <Select
              multiple
              value={filters.cityId}
              onChange={(e) => handleFilterChange('cityId', e.target.value)}
              label="City"
              disabled={!filters.stateId.length || loading}
              renderValue={(selected) => {
                if (!selected.length) return <em>All Cities</em>;
                return cities
                  .filter(c => selected.includes(c.id))
                  .map(c => c.cityName || c.city)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <Box sx={{ p: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search cities..."
                  value={searchTexts.city}
                  onChange={(e) => handleFilterTextChange('city', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!filters.stateId.length}
                  sx={searchFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTexts.city && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterTextChange('city', '');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <MenuItem value="">
                <em>All Cities</em>
              </MenuItem>
              {getFilteredOptions('city', cities).map((city) => (
                <MenuItem key={city.id} value={city.id}>
                  <Checkbox checked={filters.cityId.indexOf(city.id) > -1} />
                  <ListItemText primary={city.cityName || city.city} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* University Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>University</InputLabel>
            <Select
              multiple
              value={filters.universityId}
              onChange={(e) => handleFilterChange('universityId', e.target.value)}
              label="University"
              disabled={!filters.cityId.length || loading}
              renderValue={(selected) => {
                if (!selected.length) return <em>All Universities</em>;
                return universities
                  .filter(u => selected.includes(u.id))
                  .map(u => u.universityName || u.university)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <Box sx={{ p: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search universities..."
                  value={searchTexts.university}
                  onChange={(e) => handleFilterTextChange('university', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!filters.cityId.length}
                  sx={searchFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTexts.university && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterTextChange('university', '');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <MenuItem value="">
                <em>All Universities</em>
              </MenuItem>
              {getFilteredOptions('university', universities).filter(university => {
                const name = university.universityName || university.university;
                return name.toLowerCase().includes(searchTexts.university.toLowerCase());
              }).map((university) => (
                <MenuItem key={university.id} value={university.id}>
                  <Checkbox checked={filters.universityId.indexOf(university.id) > -1} />
                  <ListItemText primary={university.universityName || university.university} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* College Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>College</InputLabel>
            <Select
              multiple
              value={filters.collegeId}
              onChange={(e) => handleFilterChange('collegeId', e.target.value)}
              label="College"
              disabled={!filters.universityId.length || loading}
              renderValue={(selected) => {
                if (!selected.length) return <em>All Colleges</em>;
                return colleges
                  .filter(c => selected.includes(c.id))
                  .map(c => c.name || c.collegeName)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <Box sx={{ p: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search colleges..."
                  value={searchTexts.college}
                  onChange={(e) => handleFilterTextChange('college', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!filters.universityId.length}
                  sx={searchFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTexts.college && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterTextChange('college', '');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <MenuItem value="">
                <em>All Colleges</em>
              </MenuItem>
              {getFilteredOptions('college', colleges).map((college) => (
                <MenuItem key={college.id} value={college.id}>
                  <Checkbox checked={filters.collegeId.indexOf(college.id) > -1} />
                  <ListItemText primary={college.name || college.collegeName} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Stream Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Stream</InputLabel>
            <Select
              multiple
              value={filters.streamName}
              onChange={(e) => handleFilterChange('streamName', e.target.value)}
              label="Stream"
              disabled={loading}
              renderValue={(selected) => {
                if (!selected.length) return <em>All Streams</em>;
                return selected.join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <Box sx={{ p: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search streams..."
                  value={searchTexts.stream}
                  onChange={(e) => handleFilterTextChange('stream', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  sx={searchFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTexts.stream && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterTextChange('stream', '');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <MenuItem value="">
                <em>All Streams</em>
              </MenuItem>
              {getFilteredOptions('stream', streams).map((stream) => (
                <MenuItem key={stream.id} value={stream.name}>
                  <Checkbox checked={filters.streamName.indexOf(stream.name) > -1} />
                  <ListItemText primary={stream.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Course Filter - always enabled, uses allCourses */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Course</InputLabel>
            <Select
              multiple
              value={filters.courseId}
              onChange={(e) => handleFilterChange('courseId', e.target.value)}
              label="Course"
              disabled={loading}
              renderValue={(selected) => {
                if (!selected.length) return <em>All Courses</em>;
                return allCourses
                  .filter(c => selected.includes(c.id))
                  .map(c => c.name || c.courseName)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <Box sx={{ p: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search courses..."
                  value={searchTexts.course}
                  onChange={(e) => handleFilterTextChange('course', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  sx={searchFieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTexts.course && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterTextChange('course', '');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <MenuItem value="">
                <em>All Courses</em>
              </MenuItem>
              {getFilteredOptions('course', allCourses).map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  <Checkbox checked={filters.courseId.indexOf(course.id) > -1} />
                  <ListItemText primary={course.name || course.courseName} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Scholarship Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Scholarship</InputLabel>
            <Select
              value={filters.scholarship}
              onChange={(e) => handleFilterChange('scholarship', e.target.value)}
              label="Scholarship"
              disabled={loading}
            >
              <MenuItem value=""><em>Any</em></MenuItem>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>

          {/* Fees Range Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Fees Range</InputLabel>
            <Select
              value={filters.feesRange}
              onChange={(e) => handleFilterChange('feesRange', e.target.value)}
              label="Fees Range"
              disabled={loading}
            >
              <MenuItem value=""><em>Any</em></MenuItem>
              <MenuItem value="0-100000">0-100000</MenuItem>
              <MenuItem value="100000-1000000">100000-1000000</MenuItem>
              <MenuItem value="1000000-2000000">1000000-2000000</MenuItem>
              <MenuItem value="2000000+">2000000+</MenuItem>
            </Select>
          </FormControl>

          {/* Exam Type Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Exam Type</InputLabel>
            <Select
              multiple
              value={filters.examType}
              onChange={(e) => handleFilterChange('examType', e.target.value)}
              label="Exam Type"
              disabled={loading}
              
              renderValue={(selected) => {
                if (!selected.length) return <em>All Exam Types</em>;
                return selected.join(', ');
              }}
            >
              <MenuItem value="">
                <em>All Exam Types</em>
              </MenuItem>
              {['IELTS', 'TOEFL', 'PTE', 'GRE', 'GMAT'].map((exam) => (
                <MenuItem key={exam} value={exam}>
                  <Checkbox checked={filters.examType.indexOf(exam) > -1} />
                  <ListItemText primary={exam} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* English Exam Requirements Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>English Required</InputLabel>
            <Select
              value={filters.englishExamRequirements}
              onChange={(e) => handleFilterChange('englishExamRequirements', e.target.value)}
              label="English Required"
              disabled={loading}
            >
              <MenuItem value=""><em>Any</em></MenuItem>
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>

          {/* Academic Requirements Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Academic Requirements</InputLabel>
            <Select
              multiple
              value={filters.academicRequirements}
              onChange={(e) => handleFilterChange('academicRequirements', e.target.value)}
              label="Academic Requirements"
              disabled={loading}
              
              renderValue={(selected) => {
                if (!selected.length) return <em>Any</em>;
                return selected.join(', ');
              }}
            >
              <MenuItem value="">
                <em>Any</em>
              </MenuItem>
              {Array.from({length: 10}, (_, i) => {
                const min = i * 10;
                const max = (i + 1) * 10;
                const value = `${min}-${max}%`;
                return (
                  <MenuItem key={value} value={value}>
                    <Checkbox checked={filters.academicRequirements.indexOf(value) > -1} />
                    <ListItemText primary={`${min}-${max}%`} />
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Intake Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Intake</InputLabel>
            <Select
              multiple
              value={filters.intake}
              onChange={(e) => handleFilterChange('intake', e.target.value)}
              label="Intake"
              disabled={loading}
              
              renderValue={(selected) => {
                if (!selected.length) return <em>Any</em>;
                return selected.join(', ');
              }}
            >
              <MenuItem value="">
                <em>Any</em>
              </MenuItem>
              <MenuItem value="Summer">
                <Checkbox checked={filters.intake.indexOf("Summer") > -1} />
                <ListItemText primary="Summer" />
              </MenuItem>
              <MenuItem value="Winter">
                <Checkbox checked={filters.intake.indexOf("Winter") > -1} />
                <ListItemText primary="Winter" />
              </MenuItem>
              <MenuItem value="Spring">
                <Checkbox checked={filters.intake.indexOf("Spring") > -1} />
                <ListItemText primary="Spring" />
              </MenuItem>
              
            </Select>
          </FormControl>

          {/* Clear Filters Button */}
          <Button 
            variant="outlined" 
            fullWidth 
            onClick={clearAllFilters}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            Clear All Filters
          </Button>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={10.5} sx={{ width: '100%' }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {hierarchyData?.length > 0 ? (
                hierarchyData.map((continent, contIndex) => 
                  (continent.abroadCountries || []).map((country, countIndex) =>
                    (country.abroadStates || []).map((state, stateIndex) =>
                      (state.abroadCities || []).map((city, cityIndex) =>
                        (city.abroadUniversities || []).map((university, uniIndex) => (
                          <Card key={`${continent.id}-${country.id}-${state.id}-${city.id}-${university.id}-${uniIndex}`} sx={{ 
                            mb: 4, 
                            borderRadius: 2,
                            boxShadow: 3,
                            '&:hover': {
                              boxShadow: 6,
                            },
                            transition: 'box-shadow 0.3s ease-in-out'
                          }}>
                            <CardContent>
                              {/* University Header */}
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2,
                                pb: 2,
                                borderBottom: '1px solid #eee'
                              }}>
                                <Box>
                                  <Typography variant="h5" color="primary" fontWeight="bold">
                                    {university.universityName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {city.city}, {state.state}, {country.country} ({continent.continentname})
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ID: {university.id} | Courses: {university.abroadColleges?.reduce((total, college) => total + (college.abroadCourses?.length || 0), 0) || 0}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Colleges and Courses */}
                              <Box sx={{ ml: 2 }}>
                                {university.abroadColleges?.map((college, colIndex) => (
                                  <Box key={`${university.id}-college-${colIndex}`} sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 1, color: 'secondary.main' }}>
                                      {college.collegeName}
                                    </Typography>
                                      
                                    {/* Courses Grid */}
                                    <Grid container spacing={2}>
                                      {college.abroadCourses?.map((course, courseIndex) => {
                                        const courseKey = `${university.id}-${colIndex}-${courseIndex}`;
                                        return (
                                          <Grid item xs={12} sm={6} md={4} key={courseKey}>
                                            {renderCourseDetails(course, courseKey)}
                                          </Grid>
                                        );
                                      })}
                                    </Grid>
                                    
                                    {(!college.abroadCourses || college.abroadCourses.length === 0) && (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No courses available for this college
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                                
                                {(!university.abroadColleges || university.abroadColleges.length === 0) && (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    No colleges available for this university
                                  </Typography>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        ))
                      )
                    )
                  )
                )
              ) : (
                // Custom no data messages for specific filters
                <Box sx={{ textAlign: 'center', my: 4 }}>
                  {filters.examType && filters.examType.length > 0 ? (
                    <Typography variant="body1" color="text.secondary">
                      No course found with this exam.
                    </Typography>
                  ) : filters.feesRange ? (
                    <Typography variant="body1" color="text.secondary">
                      No course is available in this fees range.
                    </Typography>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      No data available. Please check if there are any continents and countries added.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}