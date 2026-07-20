import axiosInstance from "../Common/axiosConfig";
//import { message } from "antd";
// Create a new course
export const createCourse = async (courseData) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    // Validate courseData
    if (!courseData || !courseData.courseName || !courseData.courseName.trim()) {
      throw new Error('Course name is required');
    }
    
    // Ensure the payload matches exactly what the backend expects
    const payload = {
      courseName: courseData.courseName.trim()
    };
    
    const response = await axiosInstance.post('/createCourseName', payload, {
      params: { role, email },
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Reject only if status is outside 2xx
      }
    });
    
    // Verify the response contains the expected data
    if (!response.data || response.data.courseName === null || response.data.courseName === undefined) {
      console.error('Invalid response from server:', response.data);
      throw new Error('Failed to create course: Invalid response from server');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating course:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Get course by ID
export const getCourseById = async (id) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    const response = await axiosInstance.get(`/getCourseNameById/${id}`, {
      params: { role, email }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

// Get all courses
export const getAllCourses = async () => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    const response = await axiosInstance.get('/getAllCourseName', {
      params: { role, email }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Update course
export const updateCourse = async (id, courseData) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    // Validate courseData
    if (!courseData || !courseData.courseName || !courseData.courseName.trim()) {
      throw new Error('Course name is required');
    }
    
    const payload = {
      ...courseData,
      courseName: courseData.courseName.trim()
    };
    
    const response = await axiosInstance.put(`/updateCourseName/${id}`, payload, {
      params: { role, email },
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });
    
    // Verify the response contains the expected data
    if (!response.data || response.data.courseName === null || response.data.courseName === undefined) {
      console.error('Invalid response from server:', response.data);
      throw new Error('Failed to update course: Invalid response from server');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating course:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Delete course
export const deleteCourse = async (id) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  
  try {
    const response = await axiosInstance.delete(`/deleteCourseName/${id}`, {
      params: { role, email }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting course:', error);
    
    // Handle foreign key constraint error
    if (error.response?.data?.message?.includes('foreign key constraint fails')) {
      throw new Error('Cannot delete course because it has associated records. Please remove or reassign them first.');
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to delete course';
    
    throw new Error(errorMessage);
  }
};

// No need for this export block as we're using named exports above