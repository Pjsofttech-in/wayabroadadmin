import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme, CircularProgress, Container, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import TodayIcon from '@mui/icons-material/Today';
import WeekIcon from '@mui/icons-material/DateRange';
import MonthIcon from '@mui/icons-material/CalendarMonth';
import YearIcon from '@mui/icons-material/CalendarViewMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import { fetchBranches } from '../MainDash/dashboardService';
import { getApplicationStatusCounts } from './AbroadApplicationService';

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


// ✅ Card for status/stat display
const StatusCard = ({ title, value, color = 'primary' }) => (
  <Card
    elevation={3}
    sx={{
      height: '100%',
      borderRadius: 2,
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6,
      },
    }}
  >
    <CardContent>
      <Typography color="text.secondary" gutterBottom sx={{ fontWeight: 'medium' }}>
        {title}
      </Typography>
      <Typography variant="h4" color={color} sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

// ✅ Chart section wrapper
const ChartContainer = ({ title, children, height = 400 }) => (
  <div style={{ padding: '16px', height: `${height + 48}px`, width: '100%' }}>
    <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
      {title}
    </Typography>
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
      <Typography color="textSecondary">Chart visualization will be implemented here</Typography>
    </Box>
  </div>
);

// ✅ Main Dashboard Component
// Styled card with modern design
const StyledCard = styled(Card)(({ theme, color = 'primary' }) => ({
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

// Icons mapping for status cards
const statusIcons = {
  'Today': <TodayIcon fontSize="large" />,
  'Last 7 Days': <WeekIcon fontSize="large" />,
  'Last 30 Days': <MonthIcon fontSize="large" />,
  'Last 365 Days': <YearIcon fontSize="large" />,
  'Total': <BarChartIcon fontSize="large" />
};

// Status card content component
const StatusCardContent = ({ title, value, color = 'primary' }) => (
  <StyledCard color={color}>
    <CardContent sx={{ p: 3, height: '100%' }}>
      <Box display="flex" alignItems="center">
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
          {statusIcons[title] || <BarChartIcon fontSize="large" />}
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
  </StyledCard>
);

export default function ApplicationDashboard() {
  const theme = useTheme();
  
  // Get user info from session storage
  const userRole = sessionStorage.getItem('role') || '';
  const userBranch = sessionStorage.getItem('branchCode') || '';
  const userEmail = sessionStorage.getItem('email') || '';
  
  const isAdmin = userRole === 'ADMIN' || userRole === 'admin';
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(isAdmin ? '' : userBranch);
  
  // Status configuration mapping from the database values to display values
  const statusConfig = {
    'applied': { title: 'Applied', color: 'primary' },
    'visa_accepted': { title: 'Visa Accepted', color: 'success' },
    'visa_rejected': { title: 'Visa Rejected', color: 'error' },
    'passport_issued': { title: 'Passport Issued', color: 'info' },
    'passport_rejected': { title: 'Passport Rejected', color: 'error' },
    'doc_incomplete': { title: 'Doc Incomplete', color: 'warning' },
    'app_proceed': { title: 'App Proceed', color: 'secondary' },
    'adm_completed': { title: 'Admission Completed', color: 'success' },
    'total': { title: 'Total', color: 'warning' } // Add total to status config
  };

  // Initialize stats with all possible statuses
  const [stats, setStats] = useState(
    Object.entries(statusConfig).map(([key, { title, color }]) => ({
      title,
      value: '0',
      color,
      tooltip: title,
      status: key
    }))
  );
  const [inquiryStats, setInquiryStats] = useState({
    totalInquiries: 0,
    activeInquiries: 0,
    newThisMonth: 0,
    conversionRate: 0,
    countsByPeriod: {
      today: 0,
      last7Days: 0,
      last30Days: 0,
      last365Days: 0,
      total: 0
    }
  });
  const [, setInquiryCountsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch status counts when component mounts or selectedBranch changes
  useEffect(() => {
    const fetchStatusCounts = async () => {
      try {
        setIsLoading(true);
        let response;
        
        // For admin, use the selected branch if any
        if (isAdmin) {
          response = await getApplicationStatusCounts(selectedBranch || '');
        } 
        // For branch users, use their branch code
        else if (userBranch) {
          response = await getApplicationStatusCounts(userBranch);
        }
        // For staff, use their email
        else if (userEmail) {
          response = await getApplicationStatusCounts('', userEmail);
        } else {
          // Default to empty response if no user info is available
          response = { statusCounts: {} };
        }
        
        if (response && response.statusCounts) {
          const statusCounts = response.statusCounts;
          
          // Calculate total from all status counts
          const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + (Number(count) || 0), 0);
          
          // Update stats with API data
          setStats(prevStats => {
            // First, update all status counts
            const updatedStats = prevStats
              .filter(stat => stat.status !== 'total') // Exclude total from initial mapping
              .map(stat => {
                const count = statusCounts[stat.status] || 0;
                return {
                  ...stat,
                  value: count.toLocaleString()
                };
              });
            
            // Add or update total count
            const totalStatIndex = prevStats.findIndex(s => s.status === 'total');
            const totalStat = {
              title: 'Total',
              value: totalCount.toLocaleString(),
              color: 'warning',
              tooltip: 'Total applications',
              status: 'total'
            };
            
            if (totalStatIndex >= 0) {
              updatedStats[totalStatIndex] = totalStat;
            } else {
              updatedStats.push(totalStat);
            }
            
            return updatedStats;
          });
        }
      } catch (error) {
        console.error('Error fetching application status counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatusCounts();
  }, [selectedBranch]);

  // Fetch branches when component mounts (only for admin)
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchesData = await fetchBranches();
        setBranches(branchesData);
        
        // If user is a branch user, preselect their branch
        if (!isAdmin && userBranch) {
          setSelectedBranch(userBranch);
        }
      } catch (error) {
        console.error('Error loading branches:', error);
      }
    };

    loadBranches();
  }, [isAdmin]);

  // Add: fetchInquiryStats helper to normalize backend response
  const fetchInquiryStats = async (branchCode) => {
    try {
      // Use the existing API helper to get counts; the API supports branchCode or email
      let resp;
      if (isAdmin) {
        resp = await getApplicationStatusCounts(branchCode || '');
      } else if (userBranch) {
        resp = await getApplicationStatusCounts(userBranch);
      } else if (userEmail) {
        resp = await getApplicationStatusCounts('', userEmail);
      } else {
        resp = { statusCounts: {}, total: 0 };
      }

      const statusCounts = resp?.statusCounts || {};
      const totalFromResp = Number(resp?.total) || Object.values(statusCounts).reduce((s, v) => s + (Number(v) || 0), 0);

      // Try to extract period counts if API provides them, otherwise default to 0
      const countsByPeriod = {
        today: Number(resp?.countsByPeriod?.today) || Number(resp?.today) || Number(resp?.todayCount) || 0,
        last7Days: Number(resp?.countsByPeriod?.last7Days) || Number(resp?.last7Days) || Number(resp?.last_7_days) || 0,
        last30Days: Number(resp?.countsByPeriod?.last30Days) || Number(resp?.last30Days) || Number(resp?.last_30_days) || 0,
        last365Days: Number(resp?.countsByPeriod?.last365Days) || Number(resp?.last365Days) || Number(resp?.last_365_days) || 0,
        total: totalFromResp
      };

      return {
        totalInquiries: totalFromResp,
        activeInquiries: Number(statusCounts?.app_proceed) || 0,
        newThisMonth: Number(resp?.newThisMonth) || Number(resp?.new_this_month) || 0,
        conversionRate: Number(resp?.conversionRate) || 0,
        countsByPeriod
      };
    } catch (err) {
      console.error('Error in fetchInquiryStats:', err);
      return {
        totalInquiries: 0,
        activeInquiries: 0,
        newThisMonth: 0,
        conversionRate: 0,
        countsByPeriod: { today: 0, last7Days: 0, last30Days: 0, last365Days: 0, total: 0 }
      };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const statsData = await fetchInquiryStats(selectedBranch || undefined);
        setInquiryStats(statsData);

        // Format time period data for the graph
        const timePeriodData = [
          { period: 'Today', count: statsData.countsByPeriod?.today || 0 },
          { period: 'Last 7 Days', count: statsData.countsByPeriod?.last7Days || 0 },
          { period: 'Last 30 Days', count: statsData.countsByPeriod?.last30Days || 0 },
          { period: 'Last 365 Days', count: statsData.countsByPeriod?.last365Days || 0 },
        ];

        setInquiryCountsData(timePeriodData);
      } catch (error) {
        console.error('Dashboard Load Error:', error);
        setInquiryCountsData([
          { period: 'Today', count: 0 },
          { period: 'Last 7 Days', count: 0 },
          { period: 'Last 30 Days', count: 0 },
          { period: 'Last 365 Days', count: 0 },
          { period: 'Total', count: 0 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedBranch, theme]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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

      {/* Branch Filter */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        {isAdmin && branches.length > 0 && (
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="branch-select-label">Filter by Branch</InputLabel>
            <Select
              labelId="branch-select-label"
              id="branch-select"
              value={selectedBranch}
              label="Filter by Branch"
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.code}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Charts */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ChartContainer title="Status Distribution" />
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartContainer title="Inquiries Over Time" />
          </Grid>
        </Grid>
    </Container>
  );
}
