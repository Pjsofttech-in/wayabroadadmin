import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme, CircularProgress, Container, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import TodayIcon from '@mui/icons-material/Today';
import WeekIcon from '@mui/icons-material/DateRange';
import MonthIcon from '@mui/icons-material/CalendarMonth';
import YearIcon from '@mui/icons-material/CalendarViewMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import { ResponsivePie } from '@nivo/pie';
import { fetchBranches } from '../MainDash/dashboardService';
import {
  getAllAdmissionForms,
  getAdmissionFormsByBranch,
  getApplicationStatusCounts,
} from './AbroadApplicationService';

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

// Chart section wrapper - keeps the existing dashboard chart dimensions and styling.
const ChartContainer = ({ title, children, height = 400 }) => (
  <div style={{ padding: '16px', height: `${height + 48}px`, width: '100%' }}>
    <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
      {title}
    </Typography>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        height: `${height}px`,
        minWidth: 0,
        border: '1px dashed #ccc',
        borderRadius: '4px',
      }}
    >
      {children}
    </Box>
  </div>
);

const statusLabels = {
  applied: 'Applied',
  visa_accepted: 'Visa Accepted',
  visa_rejected: 'Visa Rejected',
  passport_issued: 'Passport Issued',
  passport_rejected: 'Passport Rejected',
  doc_incomplete: 'Doc Incomplete',
  app_proceed: 'App Proceed',
  adm_completed: 'Admission Completed',
};

const statusColors = (theme) => ({
  applied: theme.palette.primary.main,
  visa_accepted: theme.palette.success.main,
  visa_rejected: theme.palette.error.main,
  passport_issued: theme.palette.info.main,
  passport_rejected: theme.palette.error.dark,
  doc_incomplete: theme.palette.warning.main,
  app_proceed: theme.palette.secondary.main,
  adm_completed: theme.palette.success.dark,
});

const formatStatusLabel = (status) =>
  statusLabels[status] || status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const parseApplicationDate = (value) => {
  if (!value) return null;

  // Preserve calendar dates supplied without a time component.
  const dateOnlyMatch = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsedDate = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getBucketStart = (date, granularity) => {
  const bucketDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (granularity === 'weekly') {
    const daysSinceMonday = (bucketDate.getDay() + 6) % 7;
    bucketDate.setDate(bucketDate.getDate() - daysSinceMonday);
  } else if (granularity === 'monthly') {
    bucketDate.setDate(1);
  }

  return bucketDate;
};

// Uses the entered inquiry date first, then createdDateTime for older/incomplete records.
const buildApplicationsTimeline = (applications) => {
  const datedApplications = applications
    .map((application) => (
      parseApplicationDate(application?.enquiryDate)
      || parseApplicationDate(application?.createdDateTime)
    ))
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (!datedApplications.length) {
    return { data: [], granularity: 'daily' };
  }

  const firstDate = new Date(
    datedApplications[0].getFullYear(),
    datedApplications[0].getMonth(),
    datedApplications[0].getDate()
  );
  const lastDate = new Date(
    datedApplications[datedApplications.length - 1].getFullYear(),
    datedApplications[datedApplications.length - 1].getMonth(),
    datedApplications[datedApplications.length - 1].getDate()
  );
  const daySpan = Math.floor((lastDate - firstDate) / 86400000);
  const granularity = daySpan <= 31 ? 'daily' : daySpan <= 210 ? 'weekly' : 'monthly';

  const countsByBucket = new Map();
  datedApplications.forEach((date) => {
    const bucketStart = getBucketStart(date, granularity);
    const key = getDateKey(bucketStart);
    countsByBucket.set(key, (countsByBucket.get(key) || 0) + 1);
  });

  const firstBucket = getBucketStart(firstDate, granularity);
  const lastBucket = getBucketStart(lastDate, granularity);
  const data = [];
  const cursor = new Date(firstBucket);

  while (cursor <= lastBucket) {
    const key = getDateKey(cursor);
    const label = granularity === 'monthly'
      ? cursor.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
      : cursor.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

    data.push({
      key,
      label,
      tooltipLabel: granularity === 'weekly' ? `Week of ${label}` : label,
      count: countsByBucket.get(key) || 0,
    });

    if (granularity === 'daily') cursor.setDate(cursor.getDate() + 1);
    else if (granularity === 'weekly') cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  return { data, granularity };
};

const TimelineLineChart = ({ data, granularity, theme }) => {
  if (!data.length) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Typography color="text.secondary" textAlign="center">
          No application records with a valid created date are available for this selection.
        </Typography>
      </Box>
    );
  }

  const width = 760;
  const height = 300;
  const margin = { top: 18, right: 24, bottom: 58, left: 52 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const highestCount = Math.max(...data.map((point) => point.count), 0);
  const yMax = Math.max(4, Math.ceil(highestCount / 4) * 4);
  const xForIndex = (index) => data.length === 1
    ? margin.left + plotWidth / 2
    : margin.left + (index / (data.length - 1)) * plotWidth;
  const yForCount = (count) => margin.top + plotHeight - (count / yMax) * plotHeight;
  const linePath = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForIndex(index)} ${yForCount(point.count)}`)
    .join(' ');
  const labelStep = Math.max(1, Math.ceil(data.length / 7));
  const xLabelIndexes = data
    .map((point, index) => index)
    .filter((index) => index === 0 || index === data.length - 1 || index % labelStep === 0);
  const yTicks = [0, 1, 2, 3, 4].map((tick) => (yMax / 4) * tick);

  return (
    <Box sx={{ width: '100%', height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.75, pr: 1, pt: 0.5 }}>
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: theme.palette.primary.main }} />
        <Typography variant="caption" color="text.secondary">Applications</Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          role="img"
          aria-label={`Applications over time, grouped ${granularity}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {yTicks.map((tick) => {
            const y = yForCount(tick);
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                  stroke={theme.palette.divider}
                  strokeDasharray="4 4"
                />
                <text
                  x={margin.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill={theme.palette.text.secondary}
                >
                  {Math.round(tick).toLocaleString()}
                </text>
              </g>
            );
          })}

          <path
            d={linePath}
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((point, index) => (
            <circle
              key={point.key}
              cx={xForIndex(index)}
              cy={yForCount(point.count)}
              r="4.5"
              fill={theme.palette.primary.main}
              stroke={theme.palette.background.paper}
              strokeWidth="2"
            >
              <title>{`${point.tooltipLabel}: ${point.count.toLocaleString()} applications`}</title>
            </circle>
          ))}

          {xLabelIndexes.map((index) => (
            <text
              key={`x-${data[index].key}`}
              x={xForIndex(index)}
              y={height - margin.bottom + 24}
              textAnchor="middle"
              fontSize="11"
              fill={theme.palette.text.secondary}
            >
              {data[index].label}
            </text>
          ))}
        </svg>
      </Box>
      <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ pb: 0.25 }}>
        Grouped by {granularity} inquiry / application date
      </Typography>
    </Box>
  );
};

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
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [timelineGranularity, setTimelineGranularity] = useState('daily');
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  
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

          // Build chart slices from the actual statusCount API response.
          const knownStatusColors = statusColors(theme);
          const fallbackColors = [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.info.main,
            theme.palette.error.main,
          ];
          const distributionRows = Object.entries(statusCounts)
            .filter(([status, count]) => status !== 'total' && Number(count) > 0)
            .map(([status, count], index) => ({
              id: status,
              label: formatStatusLabel(status),
              value: Number(count) || 0,
              color: knownStatusColors[status] || fallbackColors[index % fallbackColors.length],
            }));
          setStatusDistribution(distributionRows);
          
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
        } else {
          setStatusDistribution([]);
        }
      } catch (error) {
        setStatusDistribution([]);
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

  // Fetch real application records for the date-based chart only.
  // The same existing admission-form endpoints used by Application List are reused.
  useEffect(() => {
    let isActive = true;

    const loadTimelineApplications = async () => {
      try {
        setIsTimelineLoading(true);
        const response = !isAdmin && userBranch
          ? await getAdmissionFormsByBranch(userBranch)
          : await getAllAdmissionForms();
        const applications = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.content)
              ? response.content
              : [];

        const scopedApplications = selectedBranch
          ? applications.filter((application) => application?.branchCode === selectedBranch)
          : !isAdmin && userEmail
            ? applications.filter((application) => {
                const email = userEmail.toLowerCase();
                return application?.createdByEmail?.toLowerCase() === email
                  || application?.assignedStaffEmail?.toLowerCase() === email;
              })
            : applications;
        const { data, granularity } = buildApplicationsTimeline(scopedApplications);

        if (isActive) {
          setTimelineData(data);
          setTimelineGranularity(granularity);
        }
      } catch (error) {
        console.error('Error fetching application records for timeline chart:', error);
        if (isActive) {
          setTimelineData([]);
        }
      } finally {
        if (isActive) {
          setIsTimelineLoading(false);
        }
      }
    };

    loadTimelineApplications();

    return () => {
      isActive = false;
    };
  }, [isAdmin, userBranch, userEmail, selectedBranch]);

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

      {/* Requested dashboard charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <ChartContainer title="Status Distribution">
            {statusDistribution.length > 0 ? (
              <>
                <Box sx={{ width: '100%', height: 285, minWidth: 0 }}>
                  <ResponsivePie
                    data={statusDistribution}
                    margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                    innerRadius={0.58}
                    padAngle={1}
                    cornerRadius={4}
                    activeOuterRadiusOffset={7}
                    colors={({ data }) => data.color}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    enableArcLabels
                    arcLabel="value"
                    arcLabelsSkipAngle={8}
                    arcLabelsTextColor="#ffffff"
                    tooltip={({ datum }) => (
                      <Box sx={{ bgcolor: 'background.paper', px: 1.5, py: 1, borderRadius: 1, boxShadow: 2 }}>
                        <Typography variant="body2" fontWeight={700}>{datum.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {datum.value.toLocaleString()} applications
                        </Typography>
                      </Box>
                    )}
                    theme={{
                      textColor: theme.palette.text.primary,
                      fontSize: 12,
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 1,
                    px: 1,
                    py: 0.5,
                    overflowY: 'auto',
                    minHeight: 0,
                  }}
                >
                  {statusDistribution.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      <Box sx={{ width: 10, height: 10, flex: '0 0 10px', borderRadius: '2px', bgcolor: item.color }} />
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {item.label}: {item.value.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
                <Typography color="text.secondary" textAlign="center">
                  No application status data is available for this selection.
                </Typography>
              </Box>
            )}
          </ChartContainer>
        </Grid>

        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <ChartContainer title="Inquiries Over Time">
            {isTimelineLoading ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <TimelineLineChart data={timelineData} granularity={timelineGranularity} theme={theme} />
            )}
          </ChartContainer>
        </Grid>
      </Grid>
    </Container>
  );
}
