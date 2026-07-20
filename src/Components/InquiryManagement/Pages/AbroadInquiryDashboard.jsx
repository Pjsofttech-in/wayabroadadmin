import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  alpha,
  styled
} from '@mui/material';
import {
  Today as TodayIcon,
  CalendarViewWeek as WeekIcon,
  CalendarMonth as MonthIcon,
  CalendarToday as YearIcon,
  BarChart as StatsIcon
} from '@mui/icons-material';
import { ResponsiveBar } from '@nivo/bar';


// Styled card with theme integration
const StatusCard = styled(Card)(({ theme, color = 'primary' }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 1.5,
  background: `linear-gradient(145deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.standard,
  }),
  overflow: 'visible',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
    '&::after': {
      transform: 'scaleX(1)',
      opacity: 1,
    },
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 4,
    backgroundColor: theme.palette[color].main,
    transform: 'scaleX(0)',
    transformOrigin: 'left',
    transition: theme.transitions.create(['transform', 'opacity'], {
      duration: theme.transitions.duration.standard,
    }),
    opacity: 0,
    borderRadius: `0 0 ${theme.shape.borderRadius * 1.5}px ${theme.shape.borderRadius * 1.5}px`,
  },
}));

// Icons mapping for status cards
const statusIcons = {
  'Today': <TodayIcon fontSize="large" />,
  'Last 7 Days': <WeekIcon fontSize="large" />,
  'Last 30 Days': <MonthIcon fontSize="large" />,
  'Last 365 Days': <YearIcon fontSize="large" />,
  'Total': <StatsIcon fontSize="large" />
};

// Status card content component
const StatusCardContent = ({ title, value, color = 'primary' }) => {
  const theme = useTheme();
  
  return (
    <StatusCard color={color}>
      <CardContent sx={{ p: 3, height: '100%' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              p: 1.5,
              mr: 2,
              borderRadius: theme.shape.borderRadius * 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
            }}
          >
            {statusIcons[title] || <StatsIcon fontSize="large" />}
          </Box>
          <Box>
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.7rem',
                fontFamily: theme.typography.fontFamily
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              color={color}
              sx={{ 
                fontWeight: 700,
                lineHeight: 1.2,
                mt: 0.5,
                fontFamily: theme.typography.fontFamily
              }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </StatusCard>
  );
};

// Color scheme for different time periods (reversed order)
const timePeriodColors = {
  'Last 365 Days': '#9c27b0',
  'Last 30 Days': '#ff9800',
  'Last 7 Days': '#2196f3',
  'Today': '#4caf50'
};

// Function to transform data for stacked bar chart
const transformDataForStackedBar = (data, groupBy) => {
  if (!data || data.length === 0) return [];
  
  // Define the time periods we want to show as stacks (reversed order)
  const timePeriods = ['last365Days', 'last30Days', 'last7Days', 'today'];
  const timePeriodLabels = {
    today: 'Today',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    last365Days: 'Last 365 Days'
  };
  
  // Transform the data to match the expected format
  return data.map(item => {
    const result = {
      [groupBy]: item[`${groupBy}Name`] || 'Not Specified'
    };
    
    // Add each time period as a stack
    timePeriods.forEach(period => {
      result[timePeriodLabels[period]] = item[period] || 0;
    });
    
    return result;
  });
};
import { fetchDashboardData, MONTHS, YEARS } from './AbroadDashboard';
import { getBranchCodeNameMap } from "../../AllLogin/LoginService";
import MonthlyInquiryGraphs from '../Components/MonthlyInquiryGraphs';

const AbroadInquiryDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [streamWiseData, setStreamWiseData] = useState([]);
  const [courseWiseData, setCourseWiseData] = useState([]);
  const [conductedByData, setConductedByData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("All");
  
  // Time periods for the charts
  const timePeriods = ['Today', 'Last 7 Days', 'Last 30 Days', 'Last 365 Days'];

  // Get all unique statuses from the data
  const getStatuses = () => timePeriods;

  // Transform data for stacked bar charts
  const streamStackedData = transformDataForStackedBar(streamWiseData, 'stream');
  const courseStackedData = transformDataForStackedBar(courseWiseData, 'course');
  
  // Transform conducted by data for stacked bar chart
  const conductedByStackedData = React.useMemo(() => {
    if (!Array.isArray(conductedByData)) {
      console.error('conductedByData is not an array:', conductedByData);
      return [];
    }
    
    try {
      // First, group by counselor name to merge duplicate entries
      const groupedData = conductedByData.reduce((acc, item) => {
        const key = (item.conductBy || item.conductedBy || 'Not Specified').trim();
        if (!key) return acc; // Skip empty keys
        
        if (!acc[key]) {
          acc[key] = {
            conductedBy: key,
            'Today': 0,
            'Last 7 Days': 0,
            'Last 30 Days': 0,
            'Last 365 Days': 0,
            total: 0
          };
        }
        
        // Sum up the values for each time period
        acc[key]['Today'] += Math.max(0, Number(item.today) || 0);
        acc[key]['Last 7 Days'] += Math.max(0, Number(item.last7Days) || 0);
        acc[key]['Last 30 Days'] += Math.max(0, Number(item.last30Days) || 0);
        acc[key]['Last 365 Days'] += Math.max(0, Number(item.last365Days) || 0);
        
        return acc;
      }, {});
      
      // Convert to array and calculate total
      const transformed = Object.values(groupedData).map(item => {
        const total = item['Today'] + item['Last 7 Days'] + item['Last 30 Days'] + item['Last 365 Days'];
        return {
          ...item,
          total
        };
      });
      
      // Sort by total in descending order and filter out zero totals
      return transformed
        .filter(item => item.total > 0)
        .sort((a, b) => b.total - a.total);
        
    } catch (error) {
      console.error('Error transforming conducted by data:', error);
      return [];
    }
  }, [conductedByData]);
  
  // Get all unique statuses for the legend
  const streamStatuses = getStatuses(streamWiseData);
  const courseStatuses = getStatuses(courseWiseData);
  const conductedByStatuses = timePeriods;
  
  // Common props for both charts
  const commonChartProps = {
    margin: { top: 20, right: 80, bottom: 80, left: 80 },
    padding: 0.3,
    valueScale: { type: 'linear', min: 0, max: 'auto' },
    indexScale: { type: 'band', round: true },
    borderColor: { from: 'color', modifiers: [['darker', 1.6]] },
    axisTop: null,
    axisRight: null,
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Number of Inquiries',
      legendPosition: 'middle',
      legendOffset: -60,
      format: ' >-.0f'
    },
    labelSkipWidth: 12,
    labelSkipHeight: 12,
    labelTextColor: { from: 'color', modifiers: [['darker', 1.6]] },
    animate: true,
    motionStiffness: 90,
    motionDamping: 15,
    enableGridY: true,
    enableLabel: true,
    tooltip: ({ id, value, color, indexValue, label }) => (
      <div style={{ 
        background: 'white', 
        padding: '8px 12px', 
        border: `2px solid ${color}`, 
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}>
        <div><strong>{indexValue}</strong></div>
        <div><strong>{label}:</strong> {value}</div>
      </div>
    ),
    legends: [
      {
        dataFrom: 'keys',
        anchor: 'bottom',
        direction: isMobile ? 'column' : 'row',
        justify: false,
        translateX: 0,
        translateY: 70,
        itemsSpacing: 2,
        itemWidth: 120,
        itemHeight: 20,
        itemDirection: 'left-to-right',
        itemOpacity: 0.85,
        symbolSize: 12,
        effects: [
          {
            on: 'hover',
            style: {
              itemOpacity: 1
            }
          }
        ]
      }
    ]
  };

  // Close error snackbar
  const handleCloseError = () => {
    setError(null);
  };

  // Fetch all branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchMap = await getBranchCodeNameMap();
        if (branchMap && typeof branchMap === "object") {
          const branchList = Object.entries(branchMap).map(([code, name]) => ({
            branchCode: code,
            branchName: name,
          }));

          // Add "All Branches" as the first option
          setBranches([{ branchCode: "All", branchName: "All Branches" }, ...branchList]);
        } else {
          console.warn("Invalid branch data received:", branchMap);
          setBranches([{ branchCode: "All", branchName: "All Branches" }]);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setBranches([{ branchCode: "All", branchName: "All Branches" }]);
      }
    };

    fetchBranches();
  }, []);

  // Fetch dashboard data when selected branch changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const branchCodeToUse = selectedBranch === "All" ? null : selectedBranch;
        const data = await fetchDashboardData(branchCodeToUse);
        setStreamWiseData(data.streamWiseData || []);
        setCourseWiseData(data.courseWiseData || []);
        setConductedByData(data.conductedByData || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedBranch]);

  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '60vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4, 
        flexWrap: 'wrap', 
        gap: 2 
      }}>
        <Typography variant="h4" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Abroad Inquiry Dashboard
        </Typography>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="branch-select-label">Select Branch</InputLabel>
          <Select
            labelId="branch-select-label"
            id="branch-select"
            value={selectedBranch}
            onChange={handleBranchChange}
            label="Select Branch"
            disabled={isLoading}
          >
            {branches.map((branch) => (
              <MenuItem key={branch.branchCode} value={branch.branchCode}>
                {branch.branchName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Monthly Inquiry Analysis
        </Typography>
        <MonthlyInquiryGraphs />
      </Box>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Abroad Inquiry Dashboard
          </Typography>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Stream Wise Stacked Bar Graph */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, height: '600px', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
              Inquiries by Stream
            </Typography>
            <Box sx={{ height: '530px' }}>
              {streamStackedData.length > 0 && streamStatuses.length > 0 ? (
                <ResponsiveBar
                  data={streamStackedData}
                  keys={streamStatuses}
                  indexBy="stream"
                  {...commonChartProps}
                  colors={({ id }) => timePeriodColors[id] || '#cccccc'}
                  axisBottom={{
                    ...commonChartProps.axisBottom,
                    tickSize: 5,
                    tickPadding: 10,
                    tickRotation: -45,
                    legend: 'Stream',
                    legendPosition: 'middle',
                    legendOffset: 70,
                    format: value => value || 'Not Specified'
                  }}
                  layout="vertical"
                  groupMode="stacked"
                  enableLabel={false}
                  axisLeft={{
                    ...commonChartProps.axisLeft,
                    legend: 'Number of Inquiries',
                    legendOffset: -60,
                  }}
                  axisRight={null}
                />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Typography color="textSecondary">No stream data available</Typography>
                  <Typography variant="body2" color="textSecondary">
                    No data available. Please check back later.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Course Wise Stacked Bar Chart */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, height: '600px', borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
              Inquiries by Course
            </Typography>
            <Box sx={{ height: '530px' }}>
              {courseStackedData.length > 0 && courseStatuses.length > 0 ? (
                <ResponsiveBar
                  data={courseStackedData}
                  keys={courseStatuses}
                  indexBy="course"
                  {...commonChartProps}
                  colors={({ id }) => timePeriodColors[id] || '#cccccc'}
                  axisBottom={{
                    ...commonChartProps.axisBottom,
                    tickSize: 5,
                    tickPadding: 10,
                    tickRotation: -45,
                    legend: 'Course',
                    legendPosition: 'middle',
                    legendOffset: 90,
                    format: value => value || 'Not Specified'
                  }}
                  layout="vertical"
                  groupMode="stacked"
                  enableLabel={false}
                  axisLeft={{
                    ...commonChartProps.axisLeft,
                    legend: 'Number of Inquiries',
                    legendOffset: -60,
                  }}
                  axisRight={null}
                />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Typography color="textSecondary">No course data available</Typography>
                  <Typography variant="body2" color="textSecondary">
                    No data available. Please check back later.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Conducted By Stacked Bar Chart */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, height: '600px', borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
              Inquiries by Conducted By
            </Typography>
            <Box sx={{ height: '530px' }}>
              {conductedByStackedData.length > 0 ? (
                <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                  <ResponsiveBar
                    data={conductedByStackedData}
                    keys={timePeriods}
                    indexBy="conductedBy"
                    margin={{ top: 20, right: 80, bottom: 120, left: 80 }}
                    padding={0.3}
                    valueScale={{ type: 'linear', min: 0, max: 'auto' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={({ id }) => timePeriodColors[id] || '#cccccc'}
                    borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Conducted By',
                      legendPosition: 'middle',
                      legendOffset: 70,
                      format: value => value || 'Not Specified'
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Number of Inquiries',
                      legendPosition: 'middle',
                      legendOffset: -60,
                      format: ' >-.0f'
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor="inherit:darker(1.6)"
                    animate={true}
                    motionStiffness={90}
                    motionDamping={15}
                    enableGridY={true}
                    enableLabel={true}
                    label={d => `${d.value}`}
                    tooltip={({ id, value, color, indexValue }) => (
                      <div style={{ 
                        padding: '8px 12px',
                        background: '#fff',
                        border: `2px solid ${color}`,
                        borderRadius: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}>
                        <div style={{ 
                          color: '#333', 
                          fontWeight: 'bold',
                          marginBottom: '4px',
                          fontSize: '14px'
                        }}>
                          {indexValue || 'Not Specified'}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginTop: '4px',
                          fontSize: '13px'
                        }}>
                          <div style={{ 
                            width: '12px', 
                            height: '12px', 
                            backgroundColor: color, 
                            marginRight: '8px',
                            borderRadius: '2px',
                            flexShrink: 0
                          }} />
                          <span style={{ minWidth: '90px' }}>{id}:</span>
                          <span style={{ 
                            marginLeft: '8px', 
                            fontWeight: 'bold',
                            color: '#1a1a1a'
                          }}>
                            {value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    legends={[
                      {
                        dataFrom: 'keys',
                        anchor: 'bottom',
                        direction: isMobile ? 'column' : 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 70,
                        itemsSpacing: 10,
                        itemWidth: 120,
                        itemHeight: 20,
                        itemDirection: 'left-to-right',
                        itemOpacity: 0.85,
                        symbolSize: 12,
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ]}
                  />
                </div>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Typography color="textSecondary">No conducted by data available</Typography>
                  <Typography variant="body2" color="textSecondary">
                    No data available. Please check back later.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      
    </Box>
  );
};

export default AbroadInquiryDashboard;
