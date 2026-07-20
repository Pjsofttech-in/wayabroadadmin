import axiosInstance from '../Common/axiosConfig';

// Fetch all branches
export const fetchBranches = async () => {
  try {
    const response = await axiosInstance.get('/branches');
    return response.data || [];
  } catch (error) {
    return [];
  }
};

// Fetch inquiry statistics from API
export const fetchInquiryStats = async (branchCode = '') => {
  try {
    const params = {};
    if (branchCode) {
      params.branchCode = branchCode;
    }

    const response = await axiosInstance.get('/dashboard/TotalCount', { params });
    
    // Map the API response to match the expected format
    return {
      // Main stats
      totalInquiries: response.data.totalInquiries || 0,
      activeInquiries: response.data.activeInquiries || 0,
      newThisMonth: response.data.newThisMonth || 0,
      conversionRate: response.data.conversionRate || 0,
      
      // Time period counts for the graph
      countsByPeriod: {
        today: response.data.today || 0,
        last7Days: response.data.last7Days || 0,
        last30Days: response.data.last30Days || 0,
        last365Days: response.data.last365Days || 0,
        total: response.data.total || 0  // Changed from totalInquiries to total to match API response
      }
    };
  } catch (error) {
    // Return default values in case of error
    return {
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
    };
  }
};

// Fetch inquiry counts by time period from API
export const fetchInquiryCountsByPeriod = async (branchCode = '') => {
  try {
    const params = {};
    if (branchCode) {
      params.branchCode = branchCode;
    }

    const response = await axiosInstance.get('/dashboard/counts-by-period', { params });
    
    // Map the API response to the expected format
    return {
      today: response.data.today || 0,
      last7Days: response.data.last7Days || 0,
      last30Days: response.data.last30Days || 0,
      last365Days: response.data.last365Days || 0,
      total: response.data.total || 0
    };
  } catch (error) {
    // Return default values in case of error
    return {
      today: 0,
      last7Days: 0,
      last30Days: 0,
      last365Days: 0,
      total: 0
    };
  }
};


export const fetchStatusWiseCount = async (branchCode = '') => {
  try {
    const params = {};
    if (branchCode) {
      params.branchCode = branchCode;
    }

    const endpoint = '/dashboard/status-count';
    const response = await axiosInstance.get(endpoint, { params });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server');
    } else {
      throw new Error('Request error');
    }
  }
};

// Test function to manually check API connectivity (call from browser console)
export const testStatusCountAPI = async (branchCode = '') => {
  try {
    const params = {};
    if (branchCode) {
      params.branchCode = branchCode;
    }

    const endpoint = '/dashboard/status-count';
    const response = await axiosInstance.get(endpoint, { params });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server');
    } else {
      throw new Error('Request error');
    }
  }
};
