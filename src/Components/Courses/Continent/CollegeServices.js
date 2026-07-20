import axiosInstance from "../../Common/axiosConfig";

const CollegeService = {
  // Create a new college
  createCollege: async (collegeData, image = null, role, email, universityId) => {
    const formData = new FormData();
    formData.append('college', JSON.stringify(collegeData));
    if (image) {
      formData.append('image', image);
    }
    formData.append('role', role);
    formData.append('email', email);
    formData.append('universityId', universityId);

    try {
      const response = await axiosInstance.post('/createCollege', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all colleges
  getAllColleges: async (role, email, universityId = null) => {
    const params = { role, email };
    if (universityId !== null) {
      params.universityId = universityId;
    }
    
    try {
      const response = await axiosInstance.get('/getAllColleges', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get college by ID
  getCollegeById: async (id, role, email) => {
    try {
      const response = await axiosInstance.get(`/getCollegeById/${id}`, {
        params: { role, email }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update college
  updateCollege: async (id, collegeData, image = null, role, email) => {
    const formData = new FormData();
    formData.append('college', JSON.stringify(collegeData));
    if (image) {
      formData.append('image', image);
    }
    formData.append('role', role);
    formData.append('email', email);

    try {
      const response = await axiosInstance.put(`/updateCollege/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete college
  deleteCollege: async (id, role, email) => {
    try {
      const response = await axiosInstance.delete(`/deleteCollege/${id}`, {
        params: { role, email }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default CollegeService;