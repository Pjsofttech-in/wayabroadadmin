import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  useTheme,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { ResponsiveBar } from '@nivo/bar';
import { 
  fetchStreamWiseInquiriesByMonth, 
  fetchCourseWiseInquiriesByMonth, 
  fetchConductedByData,
  fetchDailyInquiryCounts,
  fetchConductWiseInquiriesByMonth,
  YEARS,
  MONTHS
} from '../Pages/AbroadDashboard';

const MonthlyInquiryGraphs = ({ branchCode = 'all' }) => {
  const theme = useTheme();
  // Use the YEARS array from AbroadDashboard
  const currentYear = YEARS[0].value; // Current year is the first in the array
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [startYear, setStartYear] = useState(YEARS[1]?.value || currentYear - 1); // Previous year
  const [endYear, setEndYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [streamData, setStreamData] = useState([]);
  const [courseData, setCourseData] = useState([]);
  const [conductData, setConductData] = useState([]);
  const [dailyData, setDailyData] = useState({ dailyCounts: [], total: 0 });
  const [activeTab, setActiveTab] = useState('stream');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useYearRange, setUseYearRange] = useState(false);
  const isDailyDisabled = useYearRange; // Move to top level
  
  // Calculate chart title based on current state
  const getChartTitle = () => {
    if (useYearRange) {
      return `Inquiries by ${activeTab === 'stream' ? 'Stream' : activeTab === 'course' ? 'Course' : 'Conduct Method'} (${startYear} - ${endYear})`;
    } else if (activeTab === 'daily' && selectedMonth !== 'all') {
      const month = MONTHS.find(m => m.value === parseInt(selectedMonth));
      return `Daily Inquiry Counts (${month?.label || ''} ${selectedYear})`;
    } else {
      const monthLabel = selectedMonth !== 'all' 
        ? ` - ${MONTHS.find(m => m.value === parseInt(selectedMonth))?.label || ''}` 
        : '';
      return `Inquiries by ${activeTab === 'stream' ? 'Stream' : activeTab === 'course' ? 'Course' : 'Conduct Method'} (${selectedYear}${monthLabel})`;
    }
  };
  
  const chartTitle = getChartTitle();

  // Common chart props
  const commonChartProps = {
    margin: { top: 20, right: 80, bottom: 120, left: 80 },
    padding: 0.3,
    valueScale: { type: 'linear', min: 0, nice: true },
    indexScale: { type: 'band', round: true },
    colors: { scheme: 'nivo' },
    borderColor: { from: 'color', modifiers: [['darker', 1.6]] },
    axisTop: null,
    axisRight: null,
    enableGridY: true,
    enableLabel: true,
    labelSkipWidth: 12,
    labelSkipHeight: 12,
    labelTextColor: { from: 'color', modifiers: [['darker', 1.6]] },
    animate: true,
    motionStiffness: 90,
    motionDamping: 15,
    layout: 'vertical',
    valueFormat: ' >-.0f',
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: -45,
      legend: '',
      legendPosition: 'middle',
      legendOffset: 60,
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Number of Inquiries',
      legendPosition: 'middle',
      legendOffset: -50,
    },
  };

  // Transform API response to match nivo bar chart expected format
  const transformData = (data, nameKey) => {
    // Handle null/undefined data
    if (!data) {
      console.log(`No data provided for ${nameKey}`);
      return [];
    }
    
    // Handle daily data format (only available for single month view)
    if (nameKey === 'daily') {
      if (useYearRange || !data.dailyCounts) {
        return [];
      }
      
      // Handle both array and object formats for dailyCounts
      let dailyData = [];
      
      if (Array.isArray(data.dailyCounts)) {
        dailyData = data.dailyCounts.map(item => ({
          id: `day-${item.day}`,
          day: item.day.toString(),
          count: Number(item.count) || 0,
          label: `Day ${item.day}`,
          date: item.date
        }));
      } else if (typeof data.dailyCounts === 'object') {
        dailyData = Object.entries(data.dailyCounts).map(([date, count]) => ({
          id: `day-${new Date(date).getDate()}`,
          day: new Date(date).getDate().toString(),
          count: Number(count) || 0,
          label: `Day ${new Date(date).getDate()}`,
          date: date
        }));
      }
      
      // Sort by day to ensure correct order
      return dailyData.sort((a, b) => parseInt(a.day) - parseInt(b.day));
    }

    // Handle array data for other types (stream, course, conduct)
    if (!Array.isArray(data)) {
      console.log(`Expected array for ${nameKey} but got:`, typeof data, data);
      return [];
    }
    
    // Log the raw data for debugging
    console.log(`Transforming ${nameKey} data:`, data);
    
    // Handle different data structures based on the nameKey
    const transformed = data.map(item => {
      let name, count;
      
      // Handle year range data structure
      if (useYearRange && item.year) {
        return {
          id: item.year.toString(),
          year: item.year.toString(),
          count: Number(item.count) || 0,
          label: item.year.toString()
        };
      }
      
      // Handle regular data structure
      switch (nameKey) {
        case 'stream':
          name = item.streamName || item.stream || item.name || 'Not Specified';
          count = Number(item.totalInquiries || item.count || item.inquiryCount || 0);
          break;
          
        case 'course':
          name = item.courseName || item.course || item.name || 'Not Specified';
          count = Number(item.totalInquiries || item.count || item.inquiryCount || 0);
          break;
          
        case 'conduct':
          name = item.conductBy || item.conductedBy || 'Not Specified';
          count = Number(item.count || item.totalInquiries || 0);
          break;
          
        default:
          name = item.name || 'Not Specified';
          count = Number(item.count || 0);
      }
      
      return {
        id: name,
        [nameKey === 'stream' ? 'stream' : nameKey === 'course' ? 'course' : 'conduct']: name,
        count: count,
        label: name
      };
    }).filter(item => item.count > 0); // Only include items with data
    
    console.log(`Transformed ${nameKey} data:`, transformed);
    return transformed;
  };

  // Handler for year change
  const handleYearChange = (event) => {
    const year = parseInt(event.target.value, 10);
    if (!isNaN(year)) {
      setSelectedYear(year);
      if (!useYearRange) {
        const month = selectedMonth === 'all' ? null : selectedMonth;
        fetchData(year, month);
      }
    }
  };

  // Handler for start year change
  const handleStartYearChange = (event) => {
    const year = parseInt(event.target.value, 10);
    if (!isNaN(year)) {
      setStartYear(year);
      if (useYearRange) {
        fetchData(null, null, year, endYear);
        
        // Ensure start year is not greater than end year
        if (year > endYear) {
          setEndYear(year);
        }
      }
    }
  };

  // Handler for end year change
  const handleEndYearChange = (event) => {
    const year = parseInt(event.target.value, 10);
    if (!isNaN(year)) {
      setEndYear(year);
      if (useYearRange) {
        // Ensure end year is not less than start year
        const actualStartYear = Math.min(startYear, year);
        if (actualStartYear !== startYear) {
          setStartYear(actualStartYear);
        }
        fetchData(null, null, actualStartYear, year);
      }
    }
  };

  // Toggle between single year and year range
  const toggleYearRange = (event) => {
    const useRange = event.target.checked;
    setUseYearRange(useRange);
    
    // Reset to stream tab when switching modes to avoid invalid states
    setActiveTab('stream');
    
    if (useRange) {
      fetchData(null, null, startYear, endYear);
    } else {
      fetchData(selectedYear, selectedMonth === 'all' ? null : selectedMonth);
    }
  };

  // Handler for month change
  const handleMonthChange = (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    if (!useYearRange) {
      fetchData(selectedYear, month);
      
      // If switching to 'All Months', ensure we're not on the daily tab
      if (month === 'all' && activeTab === 'daily') {
        setActiveTab('stream');
      }
    }
  };

  const fetchData = async (year, month, rangeStartYear, rangeEndYear) => {
    try {
      setIsLoading(true);
      setError(null);

      let streamRes, courseRes, conductRes, dailyRes;
      
      if (useYearRange) {
        // Fetch data for year range
        [streamRes, courseRes] = await Promise.all([
          fetchStreamWiseInquiriesByMonth(null, null, branchCode, rangeStartYear, rangeEndYear)
            .then(data => (Array.isArray(data) ? data : [])),
          fetchCourseWiseInquiriesByMonth(null, null, branchCode, rangeStartYear, rangeEndYear)
            .then(data => (Array.isArray(data) ? data : []))
        ]);
        
        // For year range, we don't show daily data
        [conductRes, dailyRes] = await Promise.all([
          fetchConductedByData(branchCode)
            .then(data => (Array.isArray(data) ? data : [])),
          Promise.resolve({ dailyCounts: [], total: 0 })
        ]);
      } else {
        // Single year/month mode
        const monthValue = month === 'all' ? null : parseInt(month);
        
        if (monthValue) {
          // For specific month, fetch all data including daily counts
          [streamRes, courseRes, conductRes, dailyRes] = await Promise.all([
            fetchStreamWiseInquiriesByMonth(monthValue, year, branchCode)
              .then(data => (Array.isArray(data) ? data : [])),
            fetchCourseWiseInquiriesByMonth(monthValue, year, branchCode)
              .then(data => (Array.isArray(data) ? data : [])),
            fetchConductedByData(branchCode)
              .then(data => (Array.isArray(data) ? data : [])),
            fetchDailyInquiryCounts(year, monthValue, branchCode)
              .catch(() => ({ dailyCounts: [], total: 0 }))
          ]);
        } else {
          // When 'All Months' is selected, fetch data for the entire year
          [streamRes, courseRes, conductRes, dailyRes] = await Promise.all([
            fetchStreamWiseInquiriesByMonth(null, year, branchCode, year, year)
              .then(data => (Array.isArray(data) ? data : [])),
            fetchCourseWiseInquiriesByMonth(null, year, branchCode, year, year)
              .then(data => (Array.isArray(data) ? data : [])),
            fetchConductedByData(branchCode)
              .then(data => (Array.isArray(data) ? data : [])),
            Promise.resolve({ dailyCounts: [], total: 0 }) // No daily data for 'All Months'
          ]);
        }
      }

      // Process and set the data
      setStreamData(streamRes || []);
      setCourseData(courseRes || []);
      setConductData(conductRes || []);
      setDailyData(dailyRes || { dailyCounts: [], total: 0 });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (useYearRange) {
      fetchData(null, null, startYear, endYear);
    } else {
      fetchData(selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, branchCode, startYear, endYear, useYearRange]);

  const renderChart = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      );
    }

    // Transform the data based on the active tab
    let chartData = [];
    
    try {
      switch (activeTab) {
        case 'stream':
          chartData = transformData(streamData, 'stream');
          break;
          
        case 'course':
          chartData = transformData(courseData, 'course');
          break;
          
        case 'daily':
          chartData = transformData(dailyData, 'daily');
          break;
          
        case 'conduct':
          chartData = transformData(conductData, 'conduct');
          break;
          
        default:
          chartData = [];
      }
    } catch (error) {
      console.error('Error transforming chart data:', error);
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <Typography color="error">Error loading chart data. Please try again.</Typography>
        </Box>
      );
    }

    // Determine the indexBy field based on the active tab and view mode
    const getIndexBy = () => {
      if (useYearRange && activeTab !== 'daily') return 'year';
      if (activeTab === 'stream') return 'stream';
      if (activeTab === 'course') return 'course';
      if (activeTab === 'daily') return 'day';
      return 'conduct';
    };
    
    const indexBy = getIndexBy();

    const xAxisLabel = useYearRange ? 'Year' :
                      activeTab === 'stream' ? 'Stream' : 
                      activeTab === 'course' ? 'Course' : 
                      activeTab === 'daily' ? 'Day of Month' : 'Conduct Method';
                      
    const xAxisFormat = activeTab === 'daily' 
      ? (value) => `Day ${value}`
      : (value) => value || 'Not Specified';
      
    // isDailyDisabled is now defined at the component level

    if (!chartData || chartData.length === 0) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="400px">
          <Typography color="textSecondary" variant="h6" gutterBottom>
            No data available for {selectedMonth !== 'all' ? `${MONTHS.find(m => m.value === parseInt(selectedMonth))?.label || ''} ` : ''}{selectedYear}
          </Typography>
          {activeTab === 'daily' && (
            <Typography color="textSecondary" variant="body2">
              Try selecting a different month or check back later for updates.
            </Typography>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ height: '500px' }}>
        <ResponsiveBar
          data={chartData}
          keys={['count']}
          indexBy={indexBy}
          margin={{ top: 50, right: 130, bottom: activeTab === 'daily' ? 100 : 80, left: 80 }}
          padding={0.3}
          valueScale={{ type: 'linear', min: 0, max: 'auto', round: true }}
          indexScale={{ type: 'band', round: true }}
          colors={{ scheme: 'nivo' }}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: activeTab === 'daily' ? 45 : -45,
            legend: xAxisLabel,
            legendPosition: 'middle',
            legendOffset: 60,
            format: xAxisFormat,
            tickValues: activeTab === 'daily' ? 'every 1' : undefined,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Number of Inquiries',
            legendPosition: 'middle',
            legendOffset: -60,
            format: value => Number.isInteger(value) ? value : ''
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          animate={true}
          motionStiffness={90}
          motionDamping={15}
          tooltip={({ id, value, indexValue, color }) => (
            <div style={{
              padding: '12px',
              background: '#fff',
              border: `2px solid ${color}`,
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ 
                  fontWeight: 'bold',
                  color: color,
                  borderBottom: '1px solid #eee',
                  paddingBottom: '4px',
                  marginBottom: '4px'
                }}>
                  {indexValue}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Inquiries:</span>
                  <span style={{ fontWeight: 'bold' }}>{value}</span>
                </div>
                {activeTab === 'daily' && (
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    {new Date(chartData.find(d => d.day === indexValue)?.date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
          theme={{
            axis: {
              ticks: {
                line: {
                  stroke: '#ddd'
                },
                text: {
                  fill: '#666',
                  fontSize: '12px'
                }
              },
              legend: {
                text: {
                  fill: '#333',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }
              }
            },
            grid: {
              line: {
                stroke: '#eee',
                strokeWidth: 1
              }
            },
            tooltip: {
              container: {
                background: '#fff',
                padding: '12px',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }
            }
          }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box mb={3} display="flex" flexDirection="column" gap={2}>
        <Box display="flex" justifyContent="center" gap={2} alignItems="center">
          <FormControlLabel
            control={
              <Checkbox 
                checked={useYearRange} 
                onChange={toggleYearRange} 
                color="primary"
              />
            }
            label="Use Year Range"
          />
        </Box>
        
        {useYearRange ? (
          <Box display="flex" justifyContent="center" gap={2} alignItems="center">
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="start-year-select-label">Start Year</InputLabel>
              <Select
                labelId="start-year-select-label"
                value={startYear}
                onChange={(e) => handleStartYearChange({ target: { value: e.target.value } })}
                label="Start Year"
              >
                {YEARS.map((year) => (
                  <MenuItem key={`start-${year.value}`} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography>to</Typography>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="end-year-select-label">End Year</InputLabel>
              <Select
                labelId="end-year-select-label"
                value={endYear}
                onChange={(e) => handleEndYearChange({ target: { value: e.target.value } })}
                label="End Year"
              >
                {YEARS.map((year) => (
                  <MenuItem key={`end-${year.value}`} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : (
          <Box display="flex" justifyContent="center" gap={2} alignItems="center">
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="year-select-label">Year</InputLabel>
              <Select
                labelId="year-select-label"
                value={selectedYear}
                onChange={handleYearChange}
                label="Year"
              >
                {YEARS.map((year) => (
                  <MenuItem key={year.value} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="month-select-label">Month</InputLabel>
              <Select
                labelId="month-select-label"
                value={selectedMonth}
                onChange={handleMonthChange}
                label="Month"
                disabled={useYearRange}
              >
                <MenuItem value="all">All Months</MenuItem>
                {MONTHS.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {error && (
        <Box mb={3}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="inquiry analytics tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="By Stream" value="stream" />
            <Tab label="By Course" value="course" />
            <Tab 
              label="Daily Counts" 
              value="daily" 
              disabled={isDailyDisabled}
              title={isDailyDisabled ? "Daily view is not available in year range mode" : ""}
            />
            <Tab label="By Conduct Method" value="conduct" />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {chartTitle}
            </Typography>
            {activeTab === 'daily' && (
              <Typography variant="subtitle1" color="primary">
                Total Inquiries: {dailyData.total}
              </Typography>
            )}
          </Box>
          {renderChart()}
        </Box>
      </Paper>
    </Box>
  );
};

export default MonthlyInquiryGraphs;
