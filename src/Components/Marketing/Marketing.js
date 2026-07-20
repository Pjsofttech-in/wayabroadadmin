import axiosinstance from "../Common/axiosConfig";

// Create a new contact us entry
// export const createContactUs = async (contactData) => {
//     try {
//         const response = await axiosinstance.post('/createContactUS', contactData);
//         return response.data;
//     } catch (error) {
//         console.error('Error creating contact:', error);
//         throw error;
//     }
// };

// Get contact us entry by ID
export const getContactUsById = async (id, role, email) => {
    try {
        const response = await axiosinstance.get(`/getContactUsById/${id}`, {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching contact by ID:', error);
        throw error;
    }
};

// Get all contact us entries
export const getAllContactUs = async (role, email) => {
    try {
        const response = await axiosinstance.get('/getAllContactUs', {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching all contacts:', error);
        throw error;
    }
};

// Update contact us entry
export const updateContactUs = async (id, contactData, role, email) => {
    try {
        const response = await axiosinstance.put(`/updateContactUS/${id}`, contactData, {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating contact:', error);
        throw error;
    }
};

// Delete contact us entry
export const deleteContactUs = async (id, role, email) => {
    try {
        const response = await axiosinstance.delete(`/deleteContactUs/${id}`, {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting contact:', error);
        throw error;
    }
};

// Exam Preparation APIs

// Create a new exam preparation entry
// export const createExamPreparation = async (examData) => {
//     try {
//         const response = await axiosinstance.post('/createExamPreparation', examData);
//         return response.data;
//     } catch (error) {
//         console.error('Error creating exam preparation:', error);
//         throw error;
//     }
// };

// Get all exam preparation entries
export const getAllExamPreparations = async () => {
    try {
        const response = await axiosinstance.get('/getAllExamsPreparation');
        return response.data;
    } catch (error) {
        console.error('Error fetching all exam preparations:', error);
        throw error;
    }
};

// Get exam preparation by ID
export const getExamPreparationById = async (id, role, email) => {
    try {
        const response = await axiosinstance.get(`/getExamPreparationById/${id}`, {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching exam preparation by ID:', error);
        throw error;
    }
};

// Update exam preparation entry
export const updateExamPreparation = async (id, examData, role, email) => {
    try {
        const response = await axiosinstance.put(`/updateExamPreparation/${id}`, examData, {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating exam preparation:', error);
        throw error;
    }
};

// Delete exam preparation entry
export const deleteExamPreparation = async (id, role, email) => {
    try {
        const response = await axiosinstance.delete(`/deleteExamPreparation/${id}`, {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting exam preparation:', error);
        throw error;
    }
};

// Register Form APIs

// Create a new register form entry
// export const createRegisterForm = async (formData) => {
//     try {
//         const response = await axiosinstance.post('/createRegisterForm', formData);
//         return response.data;
//     } catch (error) {
//         console.error('Error creating register form:', error);
//         throw error;
//     }
// };

// Update an existing register form
export const updateRegisterForm = async (id, formData, role, email) => {
    try {
        const response = await axiosinstance.put(`/updateRegisterForm/${id}`, formData, {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating register form:', error);
        throw error;
    }
};

// Get all register forms
export const getAllRegisterForms = async (role, email) => {
    try {
        const response = await axiosinstance.get('/getAllRegisterForms', {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching all register forms:', error);
        throw error;
    }
};

// Get register form by ID
export const getRegisterFormById = async (id, role, email) => {
    try {
        const response = await axiosinstance.get(`/getRegisterFormById/${id}`, {
            params: { role, email }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching register form by ID:', error);
        throw error;
    }
};

// Delete a register form
export const deleteRegisterForm = async (id, role, email) => {
    try {
        const response = await axiosinstance.delete(`/deleteRegisterForm/${id}`, {
            params: { role, email }
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
        params: { role, email }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  };

export default {
    // Contact Us APIs
    // createContactUs,
    getContactUsById,
    getAllContactUs,
    updateContactUs,
    deleteContactUs,
    
    // Exam Preparation APIs
    // createExamPreparation,
    getAllExamPreparations,
    getExamPreparationById,
    updateExamPreparation,
    deleteExamPreparation,
    
    // Register Form APIs
    // createRegisterForm,
    updateRegisterForm,
    getAllRegisterForms,
    getRegisterFormById,
    deleteRegisterForm,
    getAllCourses
};
