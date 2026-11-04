import axiosInstance from '../../Common/axiosConfig';


// Helper function to handle file uploads
const createFormData = (courseData, image) => {
  const formData = new FormData();

  // CourseController accepts one JSON part and one optional image upload.
  formData.append('course', JSON.stringify(courseData));
  if (image instanceof File) {
    formData.append('image', image);
  }

  return formData;
};

export const getAllCourses = async ({ email, role, collegeId }) => {
  try {
    const response = await axiosInstance.get(`/getAllCourses`, {
      params: {
        email,
        role,
        // Backend still names this request parameter `streamId`; its repository
        // query uses the value as AbroadCourse.abroadCollege.id (the College ID).
        streamId: collegeId
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

export const createCourse = async (courseData, image, role, email, collegeId) => {
  try {
    const formData = createFormData(courseData, image);
    
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

export const updateCourse = async (id, courseData, image, role, email) => {
  try {
    const formData = createFormData(courseData, image);
    
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
  try {
    const response = await axiosInstance.get('/getAllStreams');
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