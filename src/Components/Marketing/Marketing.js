
import axiosinstance from "../Common/axiosConfig";

// Legacy Contact Us APIs — retained for existing consumers.
export const getContactUsById = async (id, role, email) => {
  try {
    const response = await axiosinstance.get(`/getContactUsById/${id}`, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching contact by ID:', error);
    throw error;
  }
};

export const getAllContactUs = async (role, email) => {
  try {
    const response = await axiosinstance.get('/getAllContactUs', {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all contacts:', error);
    throw error;
  }
};

export const updateContactUs = async (id, contactData, role, email) => {
  try {
    const response = await axiosinstance.put(
      `/updateContactUS/${id}`,
      contactData,
      { params: { role, email } }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

export const deleteContactUs = async (id, role, email) => {
  try {
    const response = await axiosinstance.delete(`/deleteContactUs/${id}`, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
};

// Exam Preparation APIs — retained.
export const getAllExamPreparations = async () => {
  try {
    const response = await axiosinstance.get('/getAllExamsPreparation');
    return response.data;
  } catch (error) {
    console.error('Error fetching all exam preparations:', error);
    throw error;
  }
};

export const getExamPreparationById = async (id, role, email) => {
  try {
    const response = await axiosinstance.get(`/getExamPreparationById/${id}`, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching exam preparation by ID:', error);
    throw error;
  }
};

export const updateExamPreparation = async (id, examData, role, email) => {
  try {
    const response = await axiosinstance.put(
      `/updateExamPreparation/${id}`,
      examData,
      { params: { role, email } }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating exam preparation:', error);
    throw error;
  }
};

export const deleteExamPreparation = async (id, role, email) => {
  try {
    const response = await axiosinstance.delete(`/deleteExamPreparation/${id}`, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting exam preparation:', error);
    throw error;
  }
};

// Register Form APIs — retained.
export const updateRegisterForm = async (id, formData, role, email) => {
  try {
    const response = await axiosinstance.put(
      `/updateRegisterForm/${id}`,
      formData,
      { params: { role, email } }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating register form:', error);
    throw error;
  }
};

export const getAllRegisterForms = async (role, email) => {
  try {
    const response = await axiosinstance.get('/getAllRegisterForms', {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all register forms:', error);
    throw error;
  }
};

export const getRegisterFormById = async (id, role, email) => {
  try {
    const response = await axiosinstance.get(`/getRegisterFormById/${id}`, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching register form by ID:', error);
    throw error;
  }
};

export const deleteRegisterForm = async (id, role, email) => {
  try {
    const response = await axiosinstance.delete(`/deleteRegisterForm/${id}`, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting register form:', error);
    throw error;
  }
};

export const getAllCourses = async () => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';

  try {
    const response = await axiosinstance.get('/getAllCourseName', {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Web Inquiry (CONTACT_US) — consolidated Form Submission API.
export const getWebInquirySubmissions = async (role, email) => {
  const response = await axiosinstance.get('/form-submission', {
    params: {
      formType: 'CONTACT_US',
      role,
      email,
    },
  });
  return response.data;
};

export const updateWebInquirySubmission = async (
  id,
  submissionData,
  role,
  email
) => {
  const response = await axiosinstance.put(
    `/form-submission/${id}`,
    submissionData,
    { params: { role, email } }
  );
  return response.data;
};

export const deleteWebInquirySubmission = async (id, role, email) => {
  const response = await axiosinstance.delete(`/form-submission/${id}`, {
    params: { role, email },
  });
  return response.data;
};

export default {
  getWebInquirySubmissions,
  updateWebInquirySubmission,
  deleteWebInquirySubmission,

  getContactUsById,
  getAllContactUs,
  updateContactUs,
  deleteContactUs,

  getAllExamPreparations,
  getExamPreparationById,
  updateExamPreparation,
  deleteExamPreparation,

  updateRegisterForm,
  getAllRegisterForms,
  getRegisterFormById,
  deleteRegisterForm,
  getAllCourses,
};
