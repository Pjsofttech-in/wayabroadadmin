import axiosInstance from "../../Common/axiosConfig";

// Array of month names for the dropdown
// Array of month names for the dropdown
export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

// Generate last 5 years for the year dropdown
export const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year, label: year.toString() };
});

/**
 * Fetches inquiry counts based on the provided time period
 * @param {number} [year] - The year to fetch data for (e.g., 2023)
 * @param {number} [month] - The month to fetch data for (1-12)
 * @param {number} [startYear] - Start year for range
 * @param {number} [endYear] - End year for range
 * @param {string} [branchCode] - Optional branch code to filter by
 * @returns {Promise<Object>} Response containing counts and data
 */
export const fetchInquiryCounts = async ({ 
  year, 
  month, 
  startYear, 
  endYear, 
  branchCode = 'all' 
} = {}) => {
  try {
    const params = {
      year,
      month,
      startYear,
      endYear,
      branchCode: branchCode === 'all' ? undefined : branchCode
    };

    const response = await axiosInstance.get('/inquiry-counts', { params });
    
    // Transform the response based on the query type
    if (year != null && month != null) {
      // Day-wise data
      const dailyCounts = Object.entries(response.data.dailyCounts || {}).map(([date, count]) => ({
        day: parseInt(date.split('-')[2], 10),
        count: count || 0
      })).sort((a, b) => a.day - b.day);

      return {
        type: 'daily',
        data: dailyCounts,
        total: response.data.totalCount || 0
      };
    } else if (startYear != null) {
      // Month-wise data
      return {
        type: 'monthly',
        data: response.data.monthlyCounts || [],
        total: response.data.totalCount || 0
      };
    } else {
      // Yearly data
      return {
        type: 'yearly',
        data: response.data.yearlyCounts || [],
        total: response.data.totalCount || 0
      };
    }
  } catch (error) {
    console.error('Error fetching inquiry counts:', error);
    
    // Return appropriate empty response based on the expected type
    if (year != null && month != null) {
      const daysInMonth = new Date(year, month, 0).getDate();
      return {
        type: 'daily',
        data: Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          count: 0
        })),
        total: 0
      };
    } else if (startYear != null) {
      return {
        type: 'monthly',
        data: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          count: 0
        })),
        total: 0
      };
    } else {
      return {
        type: 'yearly',
        data: [],
        total: 0
      };
    }
  }
};

// For backward compatibility
export const fetchDailyInquiryCounts = async (year, month, branchCode = 'all') => {
  const result = await fetchInquiryCounts({ year, month, branchCode });
  return {
    dailyCounts: result.data,
    total: result.total
  };
};

/**
 * Fetches all branches (admin only)
 * @returns {Promise<Array>} List of branches
 */
export const fetchBranches = async () => {
  try {
    const response = await axiosInstance.get('/dashboard/branches');
    return response.data || [];
  } catch (error) {
    return [];
  }
};

/**
 * Fetches stream-wise inquiry statistics
 * @param {string} branchCode - Branch code to filter by (optional)
 * @returns {Promise<Array>} Stream-wise inquiry data with time periods
 */
/**
 * Fetches inquiry count by stream for a specific month or year range
 * @param {number} month - Month (1-12, optional)
 * @param {number} year - Year (e.g., 2023, used if month is provided)
 * @param {string} branchCode - Branch code to filter by (optional)
 * @param {number} [startYear] - Start year for year range (optional)
 * @param {number} [endYear] - End year for year range (optional)
 * @returns {Promise<Array>} Stream-wise inquiry data
 */
export const fetchStreamWiseInquiriesByMonth = async (month, year, branchCode = 'all', startYear, endYear) => {
  try {
    const params = {
      branchCode: branchCode === 'all' ? undefined : branchCode
    };

    if (month) {
      params.month = month;
      if (year) params.year = year;
    } else if (startYear && endYear) {
      params.startYear = startYear;
      params.endYear = endYear;
    } else {
      throw new Error("Either month or both startYear and endYear must be provided");
    }

    const response = await axiosInstance.get('/dashboard/stream/by-month', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching stream-wise inquiries:', error);
    return [];
  }
};

/**
 * Fetches inquiry count by course for a specific month or year range
 * @param {number} month - Month (1-12, optional)
 * @param {number} year - Year (e.g., 2023, used if month is provided)
 * @param {string} branchCode - Branch code to filter by (optional)
 * @param {number} [startYear] - Start year for year range (optional)
 * @param {number} [endYear] - End year for year range (optional)
 * @returns {Promise<Array>} Course-wise inquiry data
 */
export const fetchCourseWiseInquiriesByMonth = async (month, year, branchCode = 'all', startYear, endYear) => {
  try {
    const params = {
      branchCode: branchCode === 'all' ? undefined : branchCode
    };

    if (month) {
      params.month = month;
      if (year) params.year = year;
    } else if (startYear && endYear) {
      params.startYear = startYear;
      params.endYear = endYear;
    } else {
      throw new Error("Either month or both startYear and endYear must be provided");
    }

    const response = await axiosInstance.get('/dashboard/course/by-month', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
};

/**
 * Fetches stream-wise inquiry statistics
 * @param {string} branchCode - Branch code to filter by (optional)
 * @returns {Promise<Array>} Stream-wise inquiry data with time periods
 */
export const fetchStreamWiseInquiries = async (branchCode = 'all') => {
  try {
    const response = await axiosInstance.get('/dashboard/count/by-stream', {
      params: { branchCode: branchCode === 'all' ? undefined : branchCode }
    });
    
    // Transform the response to include time periods
    if (!Array.isArray(response.data) || response.data.length === 0) {
      return [];
    }
    
    return response.data.map(item => ({
      streamName: item.streamName || 'Not Specified',
      today: item.today || 0,
      last7Days: item.last7Days || 0,
      last30Days: item.last30Days || 0,
      last365Days: item.last365Days || 0,
      totalInquiries: item.totalInquiries || 0
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Fetches course-wise inquiry statistics
 * @param {string} branchCode - Branch code to filter by (optional)
 * @returns {Promise<Array>} Course-wise inquiry data with time periods
 */
export const fetchCourseWiseInquiries = async (branchCode = 'all') => {
  try {
    const response = await axiosInstance.get('/dashboard/count/by-course', {
      params: { branchCode: branchCode === 'all' ? undefined : branchCode }
    });
    
    // Transform the response to include time periods
    if (!Array.isArray(response.data) || response.data.length === 0) {
      return [];
    }
    
    return response.data.map(item => ({
      courseName: item.courseName || 'Not Specified',
      today: item.today || 0,
      last7Days: item.last7Days || 0,
      last30Days: item.last30Days || 0,
      last365Days: item.last365Days || 0,
      totalInquiries: item.totalInquiries || 0
    }));
  } catch (error) {
    console.error('Error fetching course-wise inquiries:', error);
    return [];
  }
};

/**
 * Fetches all data needed for the dashboard
 * @param {string} branchId - Branch ID to filter by (optional)
 * @returns {Promise<Object>} Dashboard data
 */
/**
 * Fetches inquiry count by conducted by
 * @param {string} branchCode - Branch code to filter by (optional)
 * @returns {Promise<Array>} Array of objects containing conducted by data
 */
export const fetchConductedByData = async (branchCode = 'all') => {
  try {
    // Make sure this matches your Spring Boot controller's @GetMapping path
    const response = await axiosInstance.get('/dashboard/count/by-conduct', {
      params: { 
        branchCode: branchCode === 'all' ? undefined : branchCode 
      }
    });
    
    if (!Array.isArray(response.data)) {
      return [];
    }
    
    // Transform the response data to match the expected format
    const transformedData = response.data.map((item) => {
      // Ensure we have a valid conductedBy field
      const conductedBy = item.conductBy || item.conductedBy || 'Not Specified';
      
      // Ensure all numeric fields are properly converted to numbers
      return {
        conductedBy: conductedBy.trim(),
        count: Number(item.totalInquiries) || 0,
        today: Number(item.today) || 0,
        last7Days: Number(item.last7Days) || 0,
        last30Days: Number(item.last30Days) || 0,
        last365Days: Number(item.last365Days) || 0,
        ...item
      };
    }).filter(item => {
      // Only include items with some data
      return item.today > 0 || item.last7Days > 0 || 
             item.last30Days > 0 || item.last365Days > 0;
    });
    
    return transformedData;
  } catch (error) {
    return [];
  }
};

/**
 * Fetches inquiry count by conduct method for a specific month
 * @param {number} month - Month (1-12)
 * @param {string} branchCode - Branch code to filter by (optional)
 * @returns {Promise<Array>} Conduct-wise inquiry data for the specified month
 */
export const fetchConductWiseInquiriesByMonth = async (month, branchCode = 'all') => {
  try {
    const response = await axiosInstance.get('/dashboard/conduct/by-month', {
      params: { 
        month,
        branchCode: branchCode === 'all' ? undefined : branchCode 
      }
    });
    
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
};

export const fetchDashboardData = async (branchId = 'all') => {
  try {
    const [branches, streamData, courseData, conductedByData, streamWiseInquiriesByMonth, courseWiseInquiriesByMonth, conductWiseInquiriesByMonth] = await Promise.all([
      fetchBranches(),
      fetchStreamWiseInquiries(branchId),
      fetchCourseWiseInquiries(branchId),
      fetchConductedByData(branchId),
      fetchStreamWiseInquiriesByMonth(1, 2023, branchId),
      fetchCourseWiseInquiriesByMonth(1, 2023, branchId),
      fetchConductWiseInquiriesByMonth(1, branchId)
    ]);
    
    // Ensure branches have the correct structure
    const formattedBranches = Array.isArray(branches) ? branches.map(branch => ({
      id: branch.code || branch.id,
      name: branch.name || 'Unnamed Branch',
      code: branch.code || branch.id
    })) : [];
    
    return {
      branches,
      streamWiseData: streamData,
      courseWiseData: courseData,
      conductedByData: conductedByData || []
    };
  } catch (error) {
    throw error;
  }
};
