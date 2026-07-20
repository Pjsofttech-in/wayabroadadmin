import axiosInstance from "../../Common/axiosConfig";

export const getAllColleges = async ({ search = "", email, role, branchCode, universityId }) => {
  const params = { role, email, branchCode };
  if (search) params.search = search;
  if (universityId) params.universityId = universityId;
  const res = await axiosInstance.get("/getAllColleges", { params });
  return res.data;
};

export const createCollege = async (formData, email, role) => {
  console.log('Creating college with auth:', { email, role });
  
  if (!email || !role) {
    // Try to get from session storage as fallback
    const sessionEmail = sessionStorage.getItem('email');
    const sessionRole = sessionStorage.getItem('role');
    
    if (!sessionEmail || !sessionRole) {
      throw new Error('Authentication required: Email and role are required. Please log in again.');
    }
    
    email = sessionEmail;
    role = sessionRole;
    console.log('Using auth data from session storage');
  }
  
  const params = new URLSearchParams();
  params.append('email', email);
  params.append('role', role);
  
  try {
    console.log('Sending create college request with data:', {
      url: `/createCollege?${params.toString()}`,
      formData: Object.fromEntries(formData.entries()),
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    const response = await axiosInstance.post(`/createCollege?${params.toString()}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      validateStatus: function (status) {
        return status < 500; // Reject only if the status code is greater than or equal to 500
      }
    });
    
    if (response.status === 403) {
      const error = new Error(response.data?.message || 'You do not have permission to perform this action');
      error.response = response;
      throw error;
    }
    
    if (response.status >= 400) {
      const error = new Error(response.data?.message || 'Failed to create college');
      error.response = response;
      throw error;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in createCollege:', error);
    if (!error.response) {
      error.message = 'Network error: Could not connect to the server';
    }
    throw error;
  }
};

export const updateCollege = async (id, formData, email, role) => {
  console.log('Updating college with auth:', { email, role });
  
  if (!email || !role) {
    // Try to get from session storage as fallback
    const sessionEmail = sessionStorage.getItem('email');
    const sessionRole = sessionStorage.getItem('role');
    
    if (!sessionEmail || !sessionRole) {
      throw new Error('Authentication required: Email and role are required. Please log in again.');
    }
    
    email = sessionEmail;
    role = sessionRole;
    console.log('Using auth data from session storage');
  }
  
  const params = new URLSearchParams();
  params.append('email', email);
  params.append('role', role);
  
  try {
    console.log('Sending update college request with data:', {
      url: `/updateCollege/${id}?${params.toString()}`,
      formData: Object.fromEntries(formData.entries()),
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    const response = await axiosInstance.put(`/updateCollege/${id}?${params.toString()}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      validateStatus: function (status) {
        return status < 500; // Reject only if the status code is greater than or equal to 500
      }
    });
    
    if (response.status === 403) {
      const error = new Error(response.data?.message || 'You do not have permission to update this college');
      error.response = response;
      throw error;
    }
    
    if (response.status >= 400) {
      const error = new Error(response.data?.message || 'Failed to update college');
      error.response = response;
      throw error;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in updateCollege:', error);
    if (!error.response) {
      error.message = 'Network error: Could not connect to the server';
    }
    throw error;
  }
};

export const deleteCollege = async (id, email, role, branchCode) => {
  await axiosInstance.delete(`/deleteCollege/${id}`, { params: { role, email, branchCode } });
};
