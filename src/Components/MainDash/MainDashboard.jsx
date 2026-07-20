import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  alpha,
  styled,
} from '@mui/material';
import {
  Today as TodayIcon,
  CalendarViewWeek as WeekIcon,
  CalendarMonth as MonthIcon,
  CalendarToday as YearIcon,
  BarChart as StatsIcon
} from '@mui/icons-material';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import {
  fetchInquiryStats,
  fetchStatusWiseCount,
} from './dashboardService';

// ✅ Helper function for status color
const getStatusColor = (status, theme) =>
  ({
    'New': theme.palette.primary.main,
    'In Progress': theme.palette.warning.main,
    'Resolved': theme.palette.success.main,
    'Closed': theme.palette.error.main,
    'Reopened': theme.palette.info.main,
    'Pending': theme.palette.secondary.main,
  }[status] || theme.palette.grey[500]);

// ✅ Nivo chart theme
const chartTheme = {
  fontSize: 12,
  textColor: '#333',
  background: 'transparent',
  axis: {
    domain: {
      line: {
        stroke: 'transparent',
      },
    },
    ticks: {
      text: {
        fontSize: 11,
      },
      line: {
        stroke: 'transparent',
      },
    },
    legend: {
      text: {
        fontSize: 12,
      },
    },
  },
  grid: {
    line: {
      stroke: 'transparent',
    },
  },
  legends: {
    text: {
      fontSize: 11,
    },
  },
};

// Icons mapping for status cards
const statusIcons = {
  'Today': <TodayIcon fontSize="large" />,
  'Last 7 Days': <WeekIcon fontSize="large" />,
  'Last 30 Days': <MonthIcon fontSize="large" />,
  'Last 365 Days': <YearIcon fontSize="large" />,
  'Total': <StatsIcon fontSize="large" />
};

// Styled card with modern design
const StatusCard = styled(Card)(({ theme, color = 'primary' }) => ({
  height: '100%',
  borderRadius: 12,
  background: `linear-gradient(145deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
  transition: 'all 0.3s ease-in-out',
  overflow: 'visible',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 10px 20px ${alpha(theme.palette[color].main, 0.2)}`,
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
    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
    opacity: 0,
    borderRadius: '0 0 12px 12px',
  },
}));

// Status card content component
const StatusCardContent = ({ title, value, color = 'primary' }) => (
  <StatusCard color={color}>
    <CardContent sx={{ p: 3, height: '100%' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Box
          sx={{
            p: 1.5,
            mr: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (theme) => alpha(theme.palette[color].main, 0.1),
            color: (theme) => theme.palette[color].main,
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
              fontSize: '0.7rem'
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
              mt: 0.5
            }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </StatusCard>
);

// ✅ Chart section wrapper
const ChartContainer = ({ title, children, height = 400 }) => (
  <div style={{ padding: '16px', height: `${height + 48}px`, width: '100%' }}>
    <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
      {title}
    </Typography>
    {children || (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: `${height}px`,
          border: '1px dashed #ccc',
          borderRadius: '4px',
        }}
      >
        <Typography color="textSecondary">No data available</Typography>
      </Box>
    )}
  </div>
);

// ✅ Main Dashboard Component
export default function MainDashboard() {
  const theme = useTheme();
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin on component mount
  useEffect(() => {
    // Replace this with your actual admin check
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
    
    // Fetch branches if user is admin
    if (userRole === 'admin') {
      const fetchBranches = async () => {
        try {
          const response = await fetch('/api/branches');
          const data = await response.json();
          setBranches(data);
          if (data.length > 0) {
            setSelectedBranch(data[0].id); // Set first branch as default
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
        }
      };
      fetchBranches();
    }
  }, []);

  const [inquiryStats, setInquiryStats] = useState({
    totalInquiries: 0,
    activeInquiries: 0,
    newThisMonth: 0,
    conversionRate: 0
  });
  const [inquiryByStatus, setInquiryByStatus] = useState([]);
  const [inquiryCounts, setInquiryCounts] = useState({
    today: 1,
    last7Days: 2,
    last30Days: 3,
    last365Days: 31,
    total: 31,
  });
  const [statusData, setStatusData] = useState([]);
  const [inquiryCountsData, setInquiryCountsData] = useState([]);
  const [statusWiseChartData, setStatusWiseChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Stats cards configuration with dynamic values
  const stats = [
    { 
      title: 'Today', 
      value: inquiryCounts.today || 0,
      color: 'primary',
      tooltip: 'Inquiries received today'
    },
    { 
      title: 'Last 7 Days', 
      value: inquiryCounts.last7Days || 0,
      color: 'secondary',
      tooltip: 'Inquiries received in the last 7 days'
    },
    { 
      title: 'Last 30 Days', 
      value: inquiryCounts.last30Days || 0,
      color: 'info',
      tooltip: 'Inquiries received in the last 30 days'
    },
    { 
      title: 'Last 365 Days', 
      value: inquiryCounts.last365Days || 0,
      color: 'success',
      tooltip: 'Inquiries received in the last year'
    },
    { 
      title: 'Total', 
      value: inquiryCounts.total || -1,
      color: 'warning',
      tooltip: 'Total inquiries in the system'
    },
  ];

  // Load data when component mounts, theme changes, or selectedBranch changes
  useEffect(() => {
    if (isAdmin && !selectedBranch) return; // Don't load data if no branch is selected for admin
    
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel
        const [statsData, statusResponse] = await Promise.all([
          fetchInquiryStats(selectedBranch),
          fetchStatusWiseCount(selectedBranch).catch(() => []) // Return empty array on error
        ]);
        
        
        // Extract status data from the response - handle both array and object responses
        let statusWiseData = {};
        
        if (Array.isArray(statusResponse)) {
          // If response is an array, convert to object format
          statusResponse.forEach(item => {
            if (item && item.status) {
              statusWiseData[item.status] = item.count || 0;
            }
          });
        } else if (statusResponse && typeof statusResponse === 'object') {
          // If response is already an object, use it as is
          statusWiseData = statusResponse;
        }
        
        
        // Update inquiry counts from the stats data
        if (statsData) {
          // Handle case where counts might be nested under countsByPeriod or directly in the response
          const sourceData = statsData.countsByPeriod || statsData;
          
          // Create a new counts object with all possible values
          const counts = {
            today: sourceData.today || 0,
            last7Days: sourceData.last7Days || 0,
            last30Days: sourceData.last30Days || 0,
            last365Days: sourceData.last365Days || 0,
            total: sourceData.total || 0
          };
          
          // Only update if values have changed
          if (JSON.stringify(counts) !== JSON.stringify(inquiryCounts)) {
            setInquiryCounts(counts);
          }
        }
        
        // Format status-wise chart data for first graph
        if (!statusWiseData || typeof statusWiseData !== 'object' || Object.keys(statusWiseData).length === 0) {
          setStatusWiseChartData([]);
          return;
        }
        
        // Create status bar data for the chart
        const statusBarData = Object.entries(statusWiseData).map(([status, count]) => {
          const statusMapping = {
            approved: { label: 'Interested', colorKey: 'Resolved' },
            rejected: { label: 'Not Interested', colorKey: 'Closed' },
            pending: { label: 'Not Interested', colorKey: 'Pending' },
            new: { label: 'New', colorKey: 'New' },
            in_progress: { label: 'In Progress', colorKey: 'In Progress' },
            resolved: { label: 'Resolved', colorKey: 'Resolved' },
            closed: { label: 'Closed', colorKey: 'Closed' },
            reopened: { label: 'Reopened', colorKey: 'Reopened' },
          };

          const mapped = statusMapping[status] || { label: status, colorKey: 'Pending' };
          return {
            label: mapped.label,
            value: count,
            color: getStatusColor(mapped.colorKey, theme),
          };
        });

        setStatusWiseChartData(statusBarData);

        // Format time period data for the second graph using stats data
        const sourceData = statsData.countsByPeriod || statsData;
        const timePeriodData = [
          { period: 'Today', count: sourceData.today || 0 },
          { period: 'Last 7 Days', count: sourceData.last7Days || 0 },
          { period: 'Last 30 Days', count: sourceData.last30Days || 0 },
          { period: 'Last 365 Days', count: sourceData.last365Days || 0 },
          { period: 'Total', count: sourceData.total || 0 }
        ];

        setInquiryCountsData(timePeriodData);
      } catch (error) {
        console.error('Error in dashboard data loading:', error);
        setStatusWiseChartData([]);
        setStatusData([]);
        setInquiryCountsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [theme, selectedBranch, isAdmin]); // Added selectedBranch and isAdmin to dependencies

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth={false}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold">
            Dashboard Overview
          </Typography>
          
          {isAdmin && branches.length > 0 && (
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="branch-select-label">Select Branch</InputLabel>
              <Select
                labelId="branch-select-label"
                id="branch-select"
                value={selectedBranch}
                label="Select Branch"
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={2.4} // 5 cards * 2.4 = 12 (100% width)
              lg={2.4}
              xl={2.4}
              key={index} 
              title={stat.tooltip}
              sx={{
                minWidth: '180px', // Ensure minimum width for smaller screens
                flexGrow: 1
              }}
            >
              <StatusCardContent 
                title={stat.title}
                value={stat.value}
                color={stat.color}
              />
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Bar Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ borderRadius: 2 }}>
              <ChartContainer title="Status Distribution">
                {statusWiseChartData.length > 0 ? (
                  <ResponsiveBar
                    data={statusWiseChartData}
                    keys={['value']}
                    indexBy="label"
                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    padding={0.3}
                    colors={(bar) => bar.data.color}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Status',
                      legendPosition: 'middle',
                      legendOffset: 32,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Count',
                      legendPosition: 'middle',
                      legendOffset: -40,
                    }}
                    theme={chartTheme}
                    borderRadius={4}
                  />
                ) : null}
              </ChartContainer>
            </Paper>
          </Grid>

          {/* Bar Chart 2 - Time Period Graph */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ borderRadius: 2 }}>
              <ChartContainer title="Inquiries Over Time">
                {inquiryCountsData.length > 0 ? (
                  <ResponsiveBar
                    data={inquiryCountsData}
                    keys={['count']}
                    indexBy="period"
                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    padding={0.3}
                    colors={theme.palette.primary.main}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Time Period',
                      legendPosition: 'middle',
                      legendOffset: 32,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Count',
                      legendPosition: 'middle',
                      legendOffset: -40,
                    }}
                    theme={chartTheme}
                    borderRadius={4}
                  />
                ) : null}
              </ChartContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
