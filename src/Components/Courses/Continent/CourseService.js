import axiosInstance from '../../Common/axiosConfig';


// Helper function to handle file uploads
const createFormData = (courseData, thumbnail, image) => {
  const formData = new FormData();
  
  // Convert course data to JSON string for the 'course' part
  formData.append('course', JSON.stringify(courseData));
  
  // Append files if they exist
  if (thumbnail) formData.append('image', thumbnail);
  if (image) formData.append('image', image);
  
  return formData;
};

export const getAllCourses = async ({ email, role, streamId }) => {
  try {
    const response = await axiosInstance.get(`/getAllCourses`, {
      params: {
        email,
        role,
        streamId
      },
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const createCourse = async (courseData, thumbnail, image, role, email, collegeId) => {
  try {
    const formData = createFormData(courseData, thumbnail, image);
    
    const response = await axiosInstance.post(
      `/createCourse`,
      formData,
      {
        params: {
          role,
          email,
          collegeId
        },
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const updateCourse = async (id, courseData, thumbnail, image, role, email) => {
  try {
    const formData = createFormData(courseData, thumbnail, image);
    
    const response = await axiosInstance.put(
      `/updateCourse/${id}`,
      formData,
      {
        params: {
          role,
          email
        },
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

export const getCourseById = async (id, role, email) => {
  try {
    const response = await axiosInstance.get(`/getCourseById/${id}`, {
      params: {
        role,
        email
      },
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    throw error;
  }
};

export const deleteCourse = async (id, role, email) => {
  try {
    const response = await axiosInstance.delete(`/deleteCourse/${id}`, {
      params: {
        role,
        email
      },
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting course:', error);
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

// Get all courses
export const getAllCoursesName = async () => {
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