
import axiosinstance from "../Common/axiosConfig";

// Create Admission Form with file uploads
export async function createAdmissionForm(formData) {
  try {
    console.log("Sending form data to server...");
    const response = await axiosinstance.post(`/admissionForms/create`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log("Server response:", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Update Admission Form
export async function updateAdmissionForm(id, formData, role, email) {
  try {
    // Create a new FormData object
    const formDataToSend = new FormData();
    
    // Append the form data as a JSON string under the 'form' key
    formDataToSend.append('form', new Blob([JSON.stringify(formData)], { type: 'application/json' }));
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('role', role);
    queryParams.append('email', email || ''); // Ensure email is never undefined
    
    const response = await axiosinstance.put(
      `/admissionForms/update/${id}?${queryParams.toString()}`,
      formDataToSend,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating admission form:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error status:", error.response.status);
      console.error("Error headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    throw error;
  }
}

// Delete Admission Form
export async function deleteAdmissionForm(id, role, email) {
  try {
    const response = await axiosinstance.delete(`/admissionForms/delete/${id}`, {
      params: { role, email }
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting admission form:", error);
    throw error;
  }
}

// Get Admission Form by ID
export async function getAdmissionFormById(id) {
  try {
    const response = await axiosinstance.get(`/admissionForms/getById/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching admission form:", error);
    throw error;
  }
}

// Get All Admission Forms
export async function getAllAdmissionForms() {
  try {
    const response = await axiosinstance.get(`/admissionForms/getAll`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all admission forms:", error);
    throw error;
  }
}

// Get Admission Forms by Branch
export async function getAdmissionFormsByBranch(branchCode) {
  try {
    const response = await axiosinstance.get(`/admissionForms/getAllByBranch/${branchCode}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching admission forms for branch ${branchCode}:`, error);
    throw error;
  }
}

// Get Personal and Academic Information
export async function getPersonalAcademicInfo(id) {
  try {
    const response = await axiosinstance.get(`/admissionForms/PersonalInformation/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching personal and academic information:", error);
    throw error;
  }
}

// Get All Enquiries
export async function getAllEnquiries(role, email) {
  try {
    const response = await axiosinstance.get(`/getAllEnquiries`, {
      params: { role, email }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    throw error;
  }
}

// Search Enquiries by ID, Name, Email, or Phone
export async function searchEnquiries(searchParams) {
  try {
    const { id, name, email, phoneNo } = searchParams;
    const response = await axiosinstance.get(`/search`, {
      params: {
        ...(id && { id }),
        ...(name && { name }),
        ...(email && { email }),
        ...(phoneNo && { phoneNo })
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error searching enquiries:", error);
    throw error;
  }
}

// Get application status counts with optional branch and email filtering
export async function getApplicationStatusCounts(branchCode = '', email = '') {
  try {
    const params = {};
    
    if (branchCode) {
      params.branchCode = branchCode;
    }
    
    if (email) {
      params.email = email;
    }
    
    const response = await axiosinstance.get('/admissionForms/statusCount', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching status counts:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    // Return empty counts object instead of throwing to prevent UI breakage
    return { statusCounts: {}, total: 0 };
  }
}