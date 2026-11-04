import axiosInstance from "../../Common/axiosConfig";

const StateService = {
  // Create a new state
  createState: async (stateData, countryId, role, email) => {
    const formData = new FormData();
    formData.append('state', JSON.stringify(stateData));
    formData.append('countryId', countryId);
    formData.append('role', role);
    formData.append('email', email);

    try {
      const response = await axiosInstance.post('/createState', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all states
  getAllStates: async (role, email, countryId = null) => {
    const params = {};
    if (countryId !== null) {
      params.countryId = countryId;
    }
    
    try {
      const response = await axiosInstance.get('/getAllStates', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get state by ID
  getStateById: async (id, role, email) => {
    try {
      const response = await axiosInstance.get(`/getStateById/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update state
  updateState: async (id, stateData, countryId = null, role, email) => {
    const formData = new FormData();
    formData.append('state', JSON.stringify(stateData));
    if (countryId) {
      formData.append('countryId', countryId);
    }
    formData.append('role', role);
    formData.append('email', email);

    try {
      const response = await axiosInstance.put(`/updateState/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete state
  deleteState: async (id, role, email) => {
    try {
      const response = await axiosInstance.delete(`/deleteState/${id}`, {
        params: { role, email }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default StateService;