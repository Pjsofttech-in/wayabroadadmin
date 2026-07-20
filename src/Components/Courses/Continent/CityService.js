import axiosInstance from "../../Common/axiosConfig";

const CityService = {
  // Create a new city
  createCity: async (cityData, image, stateId, role, email) => {
    const formData = new FormData();
    formData.append('city', JSON.stringify(cityData));
    formData.append('image', image);
    formData.append('stateId', stateId);
    formData.append('role', role);
    formData.append('email', email);

    try {
      const response = await axiosInstance.post('/createCity', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all cities
  getAllCities: async (role, email, stateId = null) => {
    const params = { role, email };
    if (stateId !== null) {
      params.stateId = stateId;
    }
    
    try {
      const response = await axiosInstance.get('/getAllCities', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get city by ID
  getCityById: async (id, role, email) => {
    try {
      const response = await axiosInstance.get(`/getCityById/${id}`, {
        params: { role, email }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update city
  updateCity: async (id, cityData, image = null, stateId = null, role, email) => {
    const formData = new FormData();
    formData.append('city', JSON.stringify(cityData));
    if (image) {
      formData.append('image', image);
    }
    if (stateId) {
      formData.append('stateId', stateId);
    }
    formData.append('role', role);
    formData.append('email', email);

    try {
      const response = await axiosInstance.put(`/updateCity/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete city
  deleteCity: async (id, role, email) => {
    try {
      const response = await axiosInstance.delete(`/deleteCity/${id}`, {
        params: { role, email }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default CityService;
