import axiosInstance from "../Common/axiosConfig";
import { message } from 'antd';
//
// Create a new stream
export const createStream = async (streamData, imageFile) => {
  const formData = new FormData();
  formData.append('stream', new Blob([JSON.stringify(streamData)], { type: 'application/json' }));
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    const response = await axiosInstance.post('/createStream', formData, {
      params: { role, email },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating stream:', error);
    throw error;
  }
};

// Update an existing stream
export const updateStream = async (id, streamData, imageFile) => {
  const formData = new FormData();
  formData.append('stream', new Blob([JSON.stringify(streamData)], { type: 'application/json' }));
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    const response = await axiosInstance.put(`/updateStream/${id}`, formData, {
      params: { role, email },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating stream:', error);
    throw error;
  }
};

// Get all streams
export const getAllStreams = async () => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    const response = await axiosInstance.get('/getAllStreams', {
      params: { role, email }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching streams:', error);
    throw error;
  }
};

// Get stream by ID
export const getStreamById = async (id) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    const response = await axiosInstance.get(`/getStreamById/${id}`, {
      params: { role, email }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching stream:', error);
    throw error;
  }
};

// Delete a stream
export const deleteStream = async (id) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    const response = await axiosInstance.delete(`/deleteStream/${id}`, {
      params: { role, email }
    });
    return response.data;
  } catch (error) {
    console.log('Raw error:', error);
    
    // Check for the specific error structure we're seeing
    if (error.response?.data?.message?.includes('foreign key constraint fails')) {
      throw new Error('Cannot delete stream because it has associated courses. Please remove or reassign the courses first.');
    }
    
    // Fallback error handling
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to delete stream';
    
    throw new Error(`Failed to delete stream: ${errorMessage}`);
  }
};

// No need for this export block as we're using named exports above
