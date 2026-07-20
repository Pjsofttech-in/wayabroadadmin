import api from './api';

export const getFeedbackList = async (params = {}) => {
  try {
    const response = await api.get('/api/feedback', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback list:', error);
    throw error;
  }
};

export const updateFeedbackStatus = async (id, status) => {
  try {
    const response = await api.patch(`/api/feedback/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating feedback status:', error);
    throw error;
  }
};

export const getFeedbackDetails = async (id) => {
  try {
    const response = await api.get(`/api/feedback/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback details:', error);
    throw error;
  }
};
