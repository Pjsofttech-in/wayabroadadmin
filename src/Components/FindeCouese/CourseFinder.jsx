import React, { useEffect, useRef, useState } from "react";
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
  Divider,
  Chip,
  Pagination
} from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SchoolIcon from '@mui/icons-material/School';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import {
  getHierarchy,
  getAllCountries,
  getAllStates,
  getAllCities,
  getAllUniversities,
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
    country: '',
    state: '',
    city: '',
    university: '',
    college: '',
    stream: '',
    course: ''
  });
  
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
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [advancedSearchTexts, setAdvancedSearchTexts] = useState({
    scholarship: '', feesRange: '', examType: '', englishExamRequirements: '', academicRequirements: '', intake: ''
  });
  const [universitiesPerPage, setUniversitiesPerPage] = useState(6);
  const [sortBy, setSortBy] = useState('default');
  const searchRequestId = useRef(0);

  // Handle filter text change
  const handleFilterTextChange = (type, value) => {
    setSearchTexts(prev => ({ ...prev, [type]: value }));
  };

  const handleAdvancedSearchChange = (type, value) => {
    setAdvancedSearchTexts((prev) => ({ ...prev, [type]: value }));
  };

  const renderAdvancedDropdownSearch = (type, placeholder = 'Search options...') => (
    <MenuItem
      key={`${type}-search`}
      disableRipple
      disableTouchRipple
      sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', cursor: 'default', py: 0.75 }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <TextField
        autoFocus
        fullWidth
        size="small"
        placeholder={placeholder}
        value={advancedSearchTexts[type] || ''}
        onChange={(event) => handleAdvancedSearchChange(type, event.target.value)}
        onKeyDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        sx={{ '& .MuiInputBase-root': { height: 30, fontSize: '0.7rem' }, '& .MuiInputBase-input': { py: 0.5, px: 0.75 } }}
        inputProps={{ 'aria-label': placeholder }}
      />
    </MenuItem>
  );

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
  // Normalize list responses from the existing API helpers. Depending on the
  // endpoint, the service may return an array directly or wrap it in data,
  // content, items, or results. Do not invent options when the API has none.
  const normalizeOptionList = (response) => {
    if (Array.isArray(response)) return response;
    if (!response || typeof response !== 'object') return [];

    for (const key of ['data', 'content', 'items', 'results', 'countries', 'states', 'cities', 'universities', 'colleges', 'courses', 'streams']) {
      const value = response[key];
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object') {
        for (const nestedKey of ['content', 'items', 'results', 'countries', 'states', 'cities', 'universities', 'colleges', 'courses', 'streams']) {
          if (Array.isArray(value[nestedKey])) return value[nestedKey];
        }
      }
    }

    return [];
  };

  // Resolve known backend naming variations consistently across dropdowns.
  const getOptionName = (item, type) => {
    if (!item) return '';
    const aliases = {
      country: ['countryName', 'country', 'name', 'title', 'label'],
      state: ['stateName', 'state', 'name', 'title', 'label'],
      city: ['cityName', 'city', 'name', 'title', 'label'],
      university: ['universityName', 'university', 'name', 'title', 'label'],
      college: ['collegeName', 'name', 'college', 'title', 'label'],
      stream: ['streamName', 'name', 'stream', 'title', 'label'],
      course: ['courseName', 'name', 'course', 'title', 'label'],
    };
    const value = (aliases[type] || ['name', 'title', 'label'])
      .map((key) => item[key])
      .find((candidate) => candidate !== null && candidate !== undefined && String(candidate).trim() !== '');
    return value == null ? '' : String(value);
  };

  // Filter options based on search text without throwing when a record has no name.
  const getFilteredOptions = (type, items = []) => {
    const safeItems = normalizeOptionList(items);
    const searchText = (searchTexts[type] || '').toLowerCase().trim();
    if (!searchText) return safeItems;
    return safeItems.filter((item) =>
      getOptionName(item, type).toLowerCase().includes(searchText)
    );
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
      if (filters.countryId?.length) {
        const selectedCountries = countries
          .filter(c => filters.countryId.includes(c.id))
          .map(c => getOptionName(c, 'country')).filter(Boolean)
          .filter(Boolean);
        if (selectedCountries.length) params.countryName = selectedCountries;
      }
      if (filters.stateId?.length) {
        const selectedStates = states
          .filter(s => filters.stateId.includes(s.id))
          .map(s => getOptionName(s, 'state')).filter(Boolean)
          .filter(Boolean);
        if (selectedStates.length) params.stateName = selectedStates;
      }
      if (filters.cityId?.length) {
        const selectedCities = cities
          .filter(c => filters.cityId.includes(c.id))
          .map(c => getOptionName(c, 'city')).filter(Boolean)
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
          .map(c => getOptionName(c, 'college')).filter(Boolean)
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
          .map(c => getOptionName(c, 'course')).filter(Boolean)
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
    const requestId = ++searchRequestId.current;
    let cancelled = false;
    const run = async () => {
      const q = (globalSearch || "").trim();
      if (!q) return;
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

        // Ignore responses from an older search so results cannot overwrite newer input.
        if (cancelled || requestId !== searchRequestId.current) return;

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
        if (!cancelled && requestId === searchRequestId.current) {
          console.error("Global search failed:", err);
        }
      }
    };

    const t = setTimeout(run, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
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
          allCoursesData, 
          streamsData,
          countriesData
        ] = await Promise.all([
          getAllCourses({ email, role }),
          getAllStreams({ email, role }),
          getAllCountries({ email, role, branchCode })
        ]);

        // Set all data independently
        setAllCourses(normalizeOptionList(allCoursesData));
        setCourses(normalizeOptionList(allCoursesData));
        setStreams(normalizeOptionList(streamsData));
        setCountries(normalizeOptionList(countriesData));
        setStates([]);
        setCity([]);
        setUniversities([]);
        setColleges([]);

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

  // Fetch states only for the selected countries
  useEffect(() => {
    const fetchStatesByCountries = async () => {
      if (!filters.countryId.length) {
        setStates([]);
        setCity([]);
        setUniversities([]);
        setColleges([]);
        return;
      }

      try {
        const { email, role } = getUserCredentials();
        const stateResponses = await Promise.all(
          filters.countryId.map((countryId) =>
            getAllStates({ email, role, countryId })
          )
        );

        const stateMap = new Map();
        stateResponses.flatMap(normalizeOptionList).forEach((state) => {
          if (state?.id != null) stateMap.set(state.id, state);
        });

        setStates(Array.from(stateMap.values()));
      } catch (err) {
        console.error("Error fetching states:", err);
        setStates([]);
      }
    };

    fetchStatesByCountries();
  }, [filters.countryId]);

  // Fetch cities only for the selected states
  useEffect(() => {
    const fetchCitiesByStates = async () => {
      if (!filters.stateId.length) {
        setCity([]);
        setUniversities([]);
        setColleges([]);
        return;
      }

      try {
        const { email, role } = getUserCredentials();
        const cityResponses = await Promise.all(
          filters.stateId.map((stateId) =>
            getAllCities({ email, role, stateId })
          )
        );

        const cityMap = new Map();
        cityResponses.flatMap(normalizeOptionList).forEach((city) => {
          if (city?.id != null) cityMap.set(city.id, city);
        });

        setCity(Array.from(cityMap.values()));
      } catch (err) {
        console.error("Error fetching cities:", err);
        setCity([]);
      }
    };

    fetchCitiesByStates();
  }, [filters.stateId]);

  // Fetch universities only for the selected cities
  // Fetch universities only for the selected cities
useEffect(() => {
  const fetchUniversitiesByCities = async () => {
    if (!filters.cityId.length) {
      setUniversities([]);
      setColleges([]);
      return;
    }

    try {
      const { email, role } = getUserCredentials();

      const universityResponses = await Promise.all(
        filters.cityId.map((cityId) =>
          getAllUniversities({
            email,
            role,
            cityId
          })
        )
      );

      const universityMap = new Map();

      universityResponses.flatMap(normalizeOptionList).forEach((university) => {
        if (university?.id != null) {
          universityMap.set(university.id, university);
        }
      });

      setUniversities(Array.from(universityMap.values()));
    } catch (err) {
      console.error("Error fetching universities:", err);
      setUniversities([]);
      setColleges([]);
    }
  };

  fetchUniversitiesByCities();
}, [filters.cityId]);

  // Fetch colleges only for the selected universities
  useEffect(() => {
    const fetchCollegesByUniversities = async () => {
      if (!filters.universityId.length) {
        setColleges([]);
        return;
      }

      try {
        const { email, role } = getUserCredentials();

        const collegeResponses = await Promise.all(
          filters.universityId.map((universityId) =>
            getAllColleges({
              email,
              role,
              universityId
            })
          )
        );

        const collegeMap = new Map();

        collegeResponses.flatMap(normalizeOptionList).forEach((college) => {
          if (college?.id != null) {
            collegeMap.set(college.id, college);
          }
        });

        setColleges(Array.from(collegeMap.values()));
      } catch (err) {
        console.error("Error fetching colleges:", err);
        setColleges([]);
      }
    };

    fetchCollegesByUniversities();
  }, [filters.universityId]);

  // Define which filters are multiple select
  const multipleSelectFilters = [
    'countryId', 'stateId', 'cityId', 'universityId', 'collegeId',
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

      // Reset child selections when their parent selection changes
      if (filterName === 'countryId') {
        updatedFilters.stateId = [];
        updatedFilters.cityId = [];
        updatedFilters.universityId = [];
        updatedFilters.collegeId = [];
      }

      if (filterName === 'stateId') {
        updatedFilters.cityId = [];
        updatedFilters.universityId = [];
        updatedFilters.collegeId = [];
      }

      if (filterName === 'cityId') {
        updatedFilters.universityId = [];
        updatedFilters.collegeId = [];
      }

      if (filterName === 'universityId') {
        updatedFilters.collegeId = [];
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Clear all filters
  const clearAllFilters = () => {
    setGlobalSearch("");
    setSearchTexts({ country: '', state: '', city: '', university: '', college: '', stream: '' });
    setFilters({
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

  // Remove one selected filter chip
  const removeFilterValue = (filterName, value) => {
    const currentValue = filters[filterName];

    if (Array.isArray(currentValue)) {
      handleFilterChange(
        filterName,
        currentValue.filter(item => item !== value)
      );
    } else {
      handleFilterChange(filterName, '');
    }
  };

  // Selected filter chips
  const selectedFilterChips = [
    ...filters.countryId.map(id => {
      const item = countries.find(c => c.id === id);
      return item ? {
        key: `country-${id}`,
        filterName: 'countryId',
        value: id,
        label: item.countryName || item.country
      } : null;
    }),

    ...filters.stateId.map(id => {
      const item = states.find(s => s.id === id);
      return item ? {
        key: `state-${id}`,
        filterName: 'stateId',
        value: id,
        label: item.stateName || item.state
      } : null;
    }),

    ...filters.cityId.map(id => {
      const item = cities.find(c => c.id === id);
      return item ? {
        key: `city-${id}`,
        filterName: 'cityId',
        value: id,
        label: item.cityName || item.city
      } : null;
    }),

    ...filters.universityId.map(id => {
      const item = universities.find(u => u.id === id);
      return item ? {
        key: `university-${id}`,
        filterName: 'universityId',
        value: id,
        label: item.universityName || item.university
      } : null;
    }),

    ...filters.collegeId.map(id => {
      const item = colleges.find(c => c.id === id);
      return item ? {
        key: `college-${id}`,
        filterName: 'collegeId',
        value: id,
        label: item.name || item.collegeName
      } : null;
    }),

    ...filters.courseId.map(id => {
      const item = allCourses.find(c => c.id === id);
      return item ? {
        key: `course-${id}`,
        filterName: 'courseId',
        value: id,
        label: item.name || item.courseName
      } : null;
    }),

    ...filters.streamName.map(name => ({
      key: `stream-${name}`,
      filterName: 'streamName',
      value: name,
      label: name
    })),

    ...(filters.scholarship ? [{
      key: "scholarship",
      filterName: 'scholarship',
      value: filters.scholarship,
      label: `Scholarship: ${filters.scholarship}`
    }] : []),

    ...(filters.feesRange ? [{
      key: "feesRange",
      filterName: 'feesRange',
      value: filters.feesRange,
      label: `Fees: ${filters.feesRange}`
    }] : []),

    ...filters.examType.map(exam => ({
      key: `exam-${exam}`,
      filterName: 'examType',
      value: exam,
      label: exam
    })),

    ...(filters.englishExamRequirements ? [{
      key: "english",
      filterName: 'englishExamRequirements',
      value: filters.englishExamRequirements,
      label: `English: ${filters.englishExamRequirements}`
    }] : []),

    ...filters.academicRequirements.map(value => ({
      key: `academic-${value}`,
      filterName: 'academicRequirements',
      value,
      label: value
    })),

    ...filters.intake.map(value => ({
      key: `intake-${value}`,
      filterName: 'intake',
      value,
      label: value
    }))
  ].filter(Boolean);

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

  const universityItems = hierarchyData.flatMap((continent) =>
    (continent.abroadCountries || []).flatMap((country) =>
      (country.abroadStates || []).flatMap((state) =>
        (state.abroadCities || []).flatMap((city) =>
          (city.abroadUniversities || []).map((university, uniIndex) => ({
            continent,
            country,
            state,
            city,
            university,
            uniIndex
          }))
        )
      )
    )
  );

  const sortedUniversityItems = [...universityItems].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return String(a.university?.universityName || '').localeCompare(String(b.university?.universityName || ''));
    }
    if (sortBy === 'name-desc') {
      return String(b.university?.universityName || '').localeCompare(String(a.university?.universityName || ''));
    }
    if (sortBy === 'courses-desc') {
      const countCourses = (item) => (item.university?.abroadColleges || []).reduce(
        (total, college) => total + (college.abroadCourses?.length || 0), 0
      );
      return countCourses(b) - countCourses(a);
    }
    return 0;
  });

  const totalUniversityPages = Math.ceil(
    sortedUniversityItems.length / universitiesPerPage
  );

  const totalCourseCount = sortedUniversityItems.reduce(
    (total, { university }) => total + (university.abroadColleges || []).reduce(
      (collegeTotal, college) => collegeTotal + (college.abroadCourses?.length || 0),
      0
    ),
    0
  );

  const paginatedUniversityItems = sortedUniversityItems.slice(
    (currentPage - 1) * universitiesPerPage,
    currentPage * universitiesPerPage
  );
  const firstUniversityOnPage = sortedUniversityItems.length === 0 ? 0 : (currentPage - 1) * universitiesPerPage + 1;
  const lastUniversityOnPage = Math.min(currentPage * universitiesPerPage, sortedUniversityItems.length);

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 1.5, md: 2 }, mb: { xs: 1.5, sm: 2, md: 2.5 }, width: "100%", minWidth: 0, boxSizing: "border-box", overflowX: "clip" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Search and primary filters remain in their existing location. */}
      <Grid container spacing={1.25} sx={{ mb: 1.25 }}>
        <Grid item xs={12}>
          <Box
            sx={{
              width: '100%',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              p: { xs: 0.75, sm: 1 },
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <Box
              id="course-filter-scroll"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(8, minmax(0, 1fr))' },
                alignItems: 'start',
                gap: { xs: 0.6, sm: 0.6, md: 0.55 },
                width: '100%',
                overflow: 'visible',
                pb: 0.25,
                '& .MuiFormControl-root': {
                  width: '100%',
                  minWidth: 0,
                  flex: 'none',
                  mb: '0 !important'
                },
                '& .MuiInputBase-root': {
                  height: '31px',
                  minHeight: '31px',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  fontSize: '11px'
                },
                '& .MuiInputLabel-root': { fontSize: '11px', transform: 'translate(14px, 9px) scale(1)' },
                '& .MuiInputLabel-root.MuiInputLabel-shrink': { transform: 'translate(14px, -7px) scale(0.78)' },
                '& .MuiSelect-select': { py: '5px !important', px: '9px', minHeight: 'unset !important', lineHeight: 1.3 },
                '& .MuiSelect-icon': { fontSize: '18px', right: '5px' },
                '& .MuiOutlinedInput-notchedOutline': { borderRadius: '4px' },
                '& .MuiMenuItem-root': { minHeight: '30px', py: '4px', px: 1.25, fontSize: '11px', lineHeight: 1.35 },
                '& .MuiCheckbox-root': { p: 0.5 },
                '& .MuiListItemText-primary': { fontSize: '11px' }
              }}
            >
          <Box sx={{ minWidth: 0, width: '100%' }}>
            <TextField
              fullWidth
              placeholder="Search..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              size="small"
              sx={{
                minWidth: 0,
                '& .MuiOutlinedInput-root': {
                  height: '31px',
                  minHeight: '31px',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  fontSize: '11px'
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
                    <IconButton
                      size="small"
                      aria-label="Clear search and filters"
                      onClick={clearAllFilters}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          {/* Country Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Country</InputLabel>
            <Select
              multiple
              value={filters.countryId}
              onChange={(e) => handleFilterChange('countryId', e.target.value)}
              label="Country"
              disabled={loading}
              renderValue={(selected) => {
                if (!selected.length) return <em>All Countries</em>;
                return countries
                  .filter(c => selected.includes(c.id))
                  .map(c => getOptionName(c, 'country')).filter(Boolean)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 240,
                  },
                },
              }}
            >
              <Box sx={{ p: 0.75 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search countries..."
                  value={searchTexts.country}
                  onChange={(e) => handleFilterTextChange('country', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  disabled={loading}
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
                  <ListItemText primary={getOptionName(country, 'country') || 'Unnamed country'} />
                </MenuItem>
              ))}
              {getFilteredOptions('country', countries).length === 0 && (
                <MenuItem disabled>{searchTexts.country ? 'No matching countries' : 'No countries available'}</MenuItem>
              )}
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
                  .map(s => getOptionName(s, 'state')).filter(Boolean)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 240,
                  },
                },
              }}
            >
              <Box sx={{ p: 0.75 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search states..."
                  value={searchTexts.state}
                  onChange={(e) => handleFilterTextChange('state', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
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
                  <ListItemText primary={getOptionName(state, 'state') || 'Unnamed state'} />
                </MenuItem>
              ))}
              {getFilteredOptions('state', states).length === 0 && filters.countryId.length > 0 && (
                <MenuItem disabled>{searchTexts.state ? 'No matching states' : 'No states available for the selected country'}</MenuItem>
              )}
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
                  .map(c => getOptionName(c, 'city')).filter(Boolean)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 240,
                  },
                },
              }}
            >
              <Box sx={{ p: 0.75 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search cities..."
                  value={searchTexts.city}
                  onChange={(e) => handleFilterTextChange('city', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
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
                  <ListItemText primary={getOptionName(city, 'city') || 'Unnamed city'} />
                </MenuItem>
              ))}
              {getFilteredOptions('city', cities).length === 0 && filters.stateId.length > 0 && (
                <MenuItem disabled>{searchTexts.city ? 'No matching cities' : 'No cities available for the selected state'}</MenuItem>
              )}
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
                  .map(u => getOptionName(u, 'university')).filter(Boolean)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 240,
                  },
                },
              }}
            >
              <Box sx={{ p: 0.75 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search universities..."
                  value={searchTexts.university}
                  onChange={(e) => handleFilterTextChange('university', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
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
              {getFilteredOptions('university', universities).map((university) => {
                const universityName = getOptionName(university, 'university');
                if (!universityName || university.id == null) return null;
                return (
                  <MenuItem key={university.id} value={university.id}>
                    <Checkbox checked={filters.universityId.indexOf(university.id) > -1} />
                    <ListItemText primary={universityName} />
                  </MenuItem>
                );
              })}
              {getFilteredOptions('university', universities).filter((item) => getOptionName(item, 'university') && item.id != null).length === 0 && filters.cityId.length > 0 && (
                <MenuItem disabled>{searchTexts.university ? 'No matching universities' : 'No universities available for the selected city'}</MenuItem>
              )}
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
                  .map(c => getOptionName(c, 'college')).filter(Boolean)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 240,
                  },
                },
              }}
            >
              <Box sx={{ p: 0.75 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search colleges..."
                  value={searchTexts.college}
                  onChange={(e) => handleFilterTextChange('college', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
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
                  <ListItemText primary={getOptionName(college, 'college') || 'Unnamed college'} />
                </MenuItem>
              ))}
              {getFilteredOptions('college', colleges).length === 0 && filters.universityId.length > 0 && (
                <MenuItem disabled>{searchTexts.college ? 'No matching colleges' : 'No colleges available for the selected university'}</MenuItem>
              )}
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
                    maxHeight: 240,
                  },
                },
              }}
            >
              <Box sx={{ p: 0.75 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search streams..."
                  value={searchTexts.stream}
                  onChange={(e) => handleFilterTextChange('stream', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
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
              {getFilteredOptions('stream', streams).map((stream) => {
                const streamName = getOptionName(stream, 'stream');
                if (!streamName) return null;
                return (
                  <MenuItem key={stream.id ?? streamName} value={streamName}>
                    <Checkbox checked={filters.streamName.indexOf(streamName) > -1} />
                    <ListItemText primary={streamName} />
                  </MenuItem>
                );
              })}
              {getFilteredOptions('stream', streams).filter((item) => getOptionName(item, 'stream')).length === 0 && (
                <MenuItem disabled>{searchTexts.stream ? 'No matching streams' : 'No streams available'}</MenuItem>
              )}
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
                  .map(c => getOptionName(c, 'course')).filter(Boolean)
                  .join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 240,
                  },
                },
              }}
            >
              <Box sx={{ p: 0.75 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search courses..."
                  value={searchTexts.course}
                  onChange={(e) => handleFilterTextChange('course', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
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
                  <ListItemText primary={getOptionName(course, 'course') || 'Unnamed course'} />
                </MenuItem>
              ))}
              {getFilteredOptions('course', allCourses).length === 0 && (
                <MenuItem disabled>{searchTexts.course ? 'No matching courses' : 'No courses available'}</MenuItem>
              )}
            </Select>
          </FormControl>

            </Box>
          </Box>
        </Grid>
      </Grid>
      {selectedFilterChips.length > 0 && (

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 1.5,
                  mb: 1.5,
                  pt: 1.5,
                  borderTop: '1px solid #f0f0f0',
                  flexWrap: 'wrap',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
              >
                {selectedFilterChips.map((filter) => (
                  <Chip
                    key={filter.key}
                    label={filter.label}
                    variant="outlined"
                    onDelete={() =>
                      removeFilterValue(
                        filter.filterName,
                        filter.value
                      )
                    }
                    sx={{
                      height: '34px',
                      borderRadius: '7px',
                      borderColor: '#f97316',
                      color: '#f97316',
                      backgroundColor: '#fff7ed',
                      fontWeight: 500,
                      '& .MuiChip-deleteIcon': {
                        color: '#f97316',
                        fontSize: '18px'
                      },
                      '&:hover': {
                        backgroundColor: '#fff7ed',
                        borderColor: '#ea580c'
                      }
                    }}
                  />
                ))}

                <Button
                  variant="text"
                  onClick={clearAllFilters}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    color: '#f97316',
                    fontWeight: 600,
                    minWidth: 'auto',
                    ml: 0.5,
                    '&:hover': {
                      backgroundColor: '#fff7ed'
                    }
                  }}
                >
                  Clear All
                </Button>
              </Box>
      )}

      <Grid
        container
        alignItems="flex-start"
        sx={{
          minWidth: 0,
          width: '100%',
          mx: 0,
          mt: 0,
          display: 'grid',
          gridTemplateColumns: filtersExpanded
            ? { xs: 'minmax(0, 1fr)', md: 'minmax(220px, 0.28fr) minmax(0, 1fr)' }
            : 'minmax(0, 1fr)',
          columnGap: 1.5,
          rowGap: 1.25,
          '& > .MuiGrid-item': { width: '100%', maxWidth: '100%', minWidth: 0, p: 0 },
          transition: 'grid-template-columns 180ms ease',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
        }}
      >
        {filtersExpanded && (
        <Grid item xs={12} md={4} sx={{ gridColumn: { xs: '1', md: '1' }, gridRow: { xs: 'auto', md: '1 / span 2' }, minWidth: 0 }}>
          <Box sx={{
            width: '100%', minWidth: 0, boxSizing: 'border-box', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', backgroundColor: '#fff',
            border: '1px solid #e5e7eb', borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
            position: 'relative'
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 1.5, py: 1.25, borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}>
                More Filters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Refine your course results
              </Typography>
            </Box>
            <Tooltip title="Close filters">
              <IconButton onClick={() => setFiltersExpanded(false)} aria-label="Close filters" size="small" sx={{ border: '1px solid #e5e7eb', borderRadius: 2, flexShrink: 0 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', p: 1.25 }}>
            <Box
              sx={{
                width: '100%',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                minWidth: 0,
                '& .MuiFormControl-root': { minWidth: 0, width: '100%', mb: '10px !important' },
                '& .MuiInputBase-root': { minHeight: 38, borderRadius: '8px', backgroundColor: '#fff', fontSize: '0.8rem' },
                '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                '& .MuiSelect-select': { py: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
              }}
            >
            <Box
                id="remaining-filter-scroll"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.4,
                  width: '100%',
                  maxHeight: 'none',
                  overflowY: 'visible',
                  overflowX: 'hidden',
                  pr: 0.25,
                  '& .MuiFormControl-root': {
                    minWidth: 0,
                    width: '100%',
                    flex: '0 0 auto',
                    mb: '6px !important'
                  },
                  '& .MuiInputBase-root': {
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    fontSize: '0.8rem'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.8rem'
                  },
                  '& .MuiSelect-select': {
                    py: 0.75
                  }
                }}
              >

          {/* Scholarship Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Scholarship</InputLabel>
            <Select
              value={filters.scholarship}
              onChange={(e) => handleFilterChange('scholarship', e.target.value)}
              label="Scholarship"
              disabled={loading}
              MenuProps={{ disablePortal: false, sx: { zIndex: 1401 }, PaperProps: { sx: { maxHeight: 300 } } }}
            >
              {renderAdvancedDropdownSearch('scholarship', 'Search scholarship...')}
              {['', 'Yes', 'No'].filter((value) => (value || 'Any').toLowerCase().includes((advancedSearchTexts.scholarship || '').trim().toLowerCase())).map((value) => (
                <MenuItem key={`scholarship-${value || 'any'}`} value={value}>{value || <em>Any</em>}</MenuItem>
              ))}
              {['', 'Yes', 'No'].filter((value) => (value || 'Any').toLowerCase().includes((advancedSearchTexts.scholarship || '').trim().toLowerCase())).length === 0 && <MenuItem disabled>No results found</MenuItem>}
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
              MenuProps={{ disablePortal: false, sx: { zIndex: 1401 }, PaperProps: { sx: { maxHeight: 300 } } }}
            >
              {renderAdvancedDropdownSearch('feesRange', 'Search fees range...')}
              {['', '0-100000', '100000-1000000', '1000000-2000000', '2000000+'].filter((value) => (value || 'Any').toLowerCase().includes((advancedSearchTexts.feesRange || '').trim().toLowerCase())).map((value) => (
                <MenuItem key={`fees-${value || 'any'}`} value={value}>{value || <em>Any</em>}</MenuItem>
              ))}
              {['', '0-100000', '100000-1000000', '1000000-2000000', '2000000+'].filter((value) => (value || 'Any').toLowerCase().includes((advancedSearchTexts.feesRange || '').trim().toLowerCase())).length === 0 && <MenuItem disabled>No results found</MenuItem>}
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
              MenuProps={{ disablePortal: false, sx: { zIndex: 1401 }, PaperProps: { sx: { maxHeight: 300 } } }}
              renderValue={(selected) => {
                if (!selected.length) return <em>All Exam Types</em>;
                return selected.join(', ');
              }}
            >
              {renderAdvancedDropdownSearch('examType', 'Search exam type...')}
              {['IELTS', 'TOEFL', 'PTE', 'GRE', 'GMAT'].filter((exam) => exam.toLowerCase().includes((advancedSearchTexts.examType || '').trim().toLowerCase())).map((exam) => (
                <MenuItem key={exam} value={exam}>
                  <Checkbox checked={filters.examType.indexOf(exam) > -1} />
                  <ListItemText primary={exam} />
                </MenuItem>
              ))}
              {['IELTS', 'TOEFL', 'PTE', 'GRE', 'GMAT'].filter((exam) => exam.toLowerCase().includes((advancedSearchTexts.examType || '').trim().toLowerCase())).length === 0 && <MenuItem disabled>No results found</MenuItem>}
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
              MenuProps={{ disablePortal: false, sx: { zIndex: 1401 }, PaperProps: { sx: { maxHeight: 300 } } }}
            >
              {renderAdvancedDropdownSearch('englishExamRequirements', 'Search requirement...')}
              {['', 'Yes', 'No'].filter((value) => (value || 'Any').toLowerCase().includes((advancedSearchTexts.englishExamRequirements || '').trim().toLowerCase())).map((value) => (
                <MenuItem key={`english-${value || 'any'}`} value={value}>{value || <em>Any</em>}</MenuItem>
              ))}
              {['', 'Yes', 'No'].filter((value) => (value || 'Any').toLowerCase().includes((advancedSearchTexts.englishExamRequirements || '').trim().toLowerCase())).length === 0 && <MenuItem disabled>No results found</MenuItem>}
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
              MenuProps={{ disablePortal: false, sx: { zIndex: 1401 }, PaperProps: { sx: { maxHeight: 300 } } }}
              renderValue={(selected) => {
                if (!selected.length) return <em>Any</em>;
                return selected.join(', ');
              }}
            >
              {renderAdvancedDropdownSearch('academicRequirements', 'Search percentage...')}
              {Array.from({length: 10}, (_, i) => {
                const min = i * 10;
                const max = (i + 1) * 10;
                const value = `${min}-${max}%`;
                return value.toLowerCase().includes((advancedSearchTexts.academicRequirements || '').trim().toLowerCase()) ? (
                  <MenuItem key={value} value={value}>
                    <Checkbox checked={filters.academicRequirements.indexOf(value) > -1} />
                    <ListItemText primary={`${min}-${max}%`} />
                  </MenuItem>
                ) : null;
              })}
              {Array.from({ length: 10 }, (_, i) => `${i * 10}-${(i + 1) * 10}%`).filter((value) => value.toLowerCase().includes((advancedSearchTexts.academicRequirements || '').trim().toLowerCase())).length === 0 && <MenuItem disabled>No results found</MenuItem>}
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
              MenuProps={{ disablePortal: false, sx: { zIndex: 1401 }, PaperProps: { sx: { maxHeight: 300 } } }}
              renderValue={(selected) => {
                if (!selected.length) return <em>Any</em>;
                return selected.join(', ');
              }}
            >
              {renderAdvancedDropdownSearch('intake', 'Search intake...')}
              {['Summer', 'Winter', 'Spring'].filter((value) => value.toLowerCase().includes((advancedSearchTexts.intake || '').trim().toLowerCase())).map((value) => (
                <MenuItem key={value} value={value}>
                  <Checkbox checked={filters.intake.indexOf(value) > -1} />
                  <ListItemText primary={value} />
                </MenuItem>
              ))}
              {['Summer', 'Winter', 'Spring'].filter((value) => value.toLowerCase().includes((advancedSearchTexts.intake || '').trim().toLowerCase())).length === 0 && <MenuItem disabled>No results found</MenuItem>}
            </Select>
          </FormControl>

              </Box>
            </Box>
          </Box>
          </Box>
        </Grid>
        )}

        <Grid item xs={12} sx={{ gridColumn: { xs: '1', md: filtersExpanded ? '2' : '1' }, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', width: '100%', minWidth: 0, boxSizing: 'border-box', p: { xs: 1.25, sm: 1.5 }, mb: 1, border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#fff' }}>
            <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                <strong>{totalCourseCount}</strong> courses across <strong>{sortedUniversityItems.length}</strong> universities
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                {sortedUniversityItems.length > 0
                  ? `Showing universities ${firstUniversityOnPage}–${lastUniversityOnPage} of ${sortedUniversityItems.length}`
                  : 'No universities to display'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
              <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 155 }, flex: { xs: '1 1 140px', sm: '0 0 auto' } }}>
                <InputLabel id="course-sort-label">Sort universities</InputLabel>
                <Select
                  labelId="course-sort-label"
                  label="Sort universities"
                  value={sortBy}
                  onChange={(event) => { setSortBy(event.target.value); setCurrentPage(1); }}
                  inputProps={{ 'aria-label': 'Sort universities' }}
                >
                  <MenuItem value="default">Default order</MenuItem>
                  <MenuItem value="name-asc">Name: A to Z</MenuItem>
                  <MenuItem value="name-desc">Name: Z to A</MenuItem>
                  <MenuItem value="courses-desc">Most courses</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 120 }, flex: { xs: '1 1 110px', sm: '0 0 auto' } }}>
                <InputLabel id="university-page-size-label">Per page</InputLabel>
                <Select
                  labelId="university-page-size-label"
                  label="Per page"
                  value={universitiesPerPage}
                  onChange={(event) => { setUniversitiesPerPage(Number(event.target.value)); setCurrentPage(1); }}
                  inputProps={{ 'aria-label': 'Universities per page' }}
                >
                  <MenuItem value={6}>6 universities</MenuItem>
                  <MenuItem value={12}>12 universities</MenuItem>
                  <MenuItem value={24}>24 universities</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setFiltersExpanded((open) => !open)}
              aria-label="Open more course filters"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#d1d5db',
                color: 'text.primary',
                borderRadius: '9px',
                minHeight: 36,
                px: 1.25,
                fontSize: '0.8rem',
                alignSelf: { xs: 'stretch', sm: 'auto' },
                '&:hover': { borderColor: 'primary.main', backgroundColor: 'action.hover' }
              }}
            >
              More Filters
            </Button>
          </Box>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} sx={{ gridColumn: { xs: '1', md: filtersExpanded ? '2' : '1' }, width: '100%', minWidth: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {paginatedUniversityItems.length > 0 ? (
                paginatedUniversityItems.map(({ continent, country, state, city, university, uniIndex }) => (
                          <Card key={`${continent.id}-${country.id}-${state.id}-${city.id}-${university.id}-${uniIndex}`} sx={{ 
                            mb: 2, 
                            borderRadius: 2,
                            boxShadow: 3,
                            '&:hover': {
                              boxShadow: 6,
                            },
                            transition: 'box-shadow 0.3s ease-in-out'
                          }}>
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } }, minWidth: 0 }}>
                              {/* University Header */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, pb: 2, borderBottom: '1px solid #eee', minWidth: 0, '& > *': { minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere' } }}> 
                                <Box>
                                  <Typography variant="h5" color="primary" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' }, overflowWrap: 'anywhere', minWidth: 0 }}> 
                                    {university.universityName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {city.city}, {state.state}, {country.country}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ID: {university.id} | Courses: {university.abroadColleges?.reduce((total, college) => total + (college.abroadCourses?.length || 0), 0) || 0}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Colleges and Courses */}
                              <Box sx={{ ml: { xs: 0, sm: 2 }, minWidth: 0, width: '100%' }}>
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
                                          <Grid item xs={12} sm={12} md={6} lg={4} key={courseKey} sx={{ minWidth: 0 }}>
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
              ) : (
                // Custom no data messages for specific filters
                <Paper
                  variant="outlined"
                  role="status"
                  sx={{ textAlign: 'center', my: { xs: 2, sm: 3 }, mx: 'auto', width: '100%', maxWidth: 560, minWidth: 0, boxSizing: 'border-box', p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}
                >
                  <SchoolIcon sx={{ fontSize: 38, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="h6" sx={{ mb: 0.75, fontWeight: 700 }}>
                    {filters.examType?.length
                      ? 'No courses match the selected exam type'
                      : filters.feesRange
                        ? 'No courses match this fee range'
                        : selectedFilterChips.length || globalSearch.trim()
                          ? 'No matching courses found'
                          : 'No course data available'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedFilterChips.length || globalSearch.trim()
                      ? 'Try changing your search or removing one or more filters.'
                      : 'There are currently no results to show. Please check the available course data.'}
                  </Typography>
                  {(selectedFilterChips.length > 0 || globalSearch.trim()) && (
                    <Button variant="outlined" onClick={clearAllFilters} sx={{ textTransform: 'none' }}>
                      Clear search and filters
                    </Button>
                  )}
                </Paper>
              )}

              {totalUniversityPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2, minWidth: 0, maxWidth: '100%', overflowX: 'auto', px: { xs: 0, sm: 1 }, '& .MuiPagination-ul': { flexWrap: 'wrap', justifyContent: 'center' } }}>
                  <Pagination
                    count={totalUniversityPages}
                    page={Math.min(currentPage, totalUniversityPages)}
                    onChange={(_, value) => setCurrentPage(value)}
                    color="primary"
                    shape="rounded"
                    aria-label="University result pages"
                  />
                </Box>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
