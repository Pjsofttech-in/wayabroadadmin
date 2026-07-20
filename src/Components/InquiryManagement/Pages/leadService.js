import axiosInstance from '../../Common/axiosConfig';

// Create Lead
export const createLead = async (lead, continentId, countryId, courseId) => {
  const formData = new FormData();
  formData.append('lead', JSON.stringify(lead));
  if (continentId) formData.append('continentId', continentId);
  if (countryId) formData.append('countryId', countryId);
  if (courseId) formData.append('courseId', courseId);
  const response = await axiosInstance.post('/createLead', formData);
  return response.data;
};

// Get All Leads
export const getAllLeads = async (role, email) => {
  const response = await axiosInstance.get('/getAllLeads', { params: { role, email } });
  return response.data;
};

// Get Lead By ID
export const getLeadById = async (id, role, email) => {
  const response = await axiosInstance.get(`/getLeadById/${id}`, { params: { role, email } });
  return response.data;
};

// Update Lead
export const updateLead = async (id, lead, continentId, countryId, courseId, role, email) => {
  const formData = new FormData();
  formData.append('lead', JSON.stringify(lead));
  if (continentId) formData.append('continentId', continentId);
  if (countryId) formData.append('countryId', countryId);
  if (courseId) formData.append('courseId', courseId);
  formData.append('role', role);
  formData.append('email', email);
  const response = await axiosInstance.put(`/updateLead/${id}`, formData);
  return response.data;
};

// Delete Lead
export const deleteLead = async (id, role, email) => {
  const response = await axiosInstance.delete(`/deleteLead/${id}`, { params: { role, email } });
  return response.data;
};

// Add Lead Visit (Follow Up)
export const addLeadVisit = async (enquiry_id, remark, status, visitCount, role, email) => {
  try {
    // Validate required parameters
    if (!enquiry_id) throw new Error("Enquiry ID is required");
    if (!remark) throw new Error("Remark is required");
    if (!status) throw new Error("Status is required");
    if (!visitCount) throw new Error("Visit Count is required");
    if (!role) throw new Error("Role is required");
    if (!email) throw new Error("Email is required");
    
    console.log("Adding lead visit with params:", {
      enquiry_id,
      remark,
      status,
      visitCount,
      role,
      email
    });

    // Make the request with parameters in the request body as expected by the Java backend
    const response = await axiosInstance.post(`/addVisit/${enquiry_id}`, null, {
      params: {
        role,
        email,
        remark,
        visitCount,
        status
      }
    });
    
    console.log("Response received:", response);
    return response.data;
  } catch (error) {
    console.error("Failed to add lead visit:", error);

    // Log detailed error information
    if (error.response) {
      console.error("Error response:", {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    // Try an alternative approach with form data
    try {
      console.log("Trying alternative approach with form data...");
      
      const formData = new FormData();
      formData.append('role', role);
      formData.append('email', email);
      formData.append('remark', remark);
      formData.append('status', status);
      formData.append('visitCount', visitCount);
      formData.append('lead_id', enquiry_id);
      
      const formResponse = await axiosInstance.post(`/addLeadVisit/${enquiry_id}`, formData);
      console.log("Form data approach succeeded:", formResponse);
      return formResponse.data;
    } catch (formError) {
      console.error("Form data approach also failed:", formError);
      
      // Try one more approach with JSON body
      try {
        console.log("Trying JSON body approach...");
        
        const jsonResponse = await axiosInstance.post(`/addLeadVisit/${enquiry_id}`, {
          role,
          email,
          remark,
          status,
          visitCount,
          lead_id: enquiry_id
        });
        
        console.log("JSON body approach succeeded:", jsonResponse);
        return jsonResponse.data;
      } catch (jsonError) {
        console.error("All approaches failed");
        throw error; // Throw the original error
      }
    }
  }
};

// Get All Visits
export const getAllVisits = async (role, email) => {
  const response = await axiosInstance.get('/getAllVisits', { params: { role, email } });
  return response.data;
};

// Get Visit By ID
export const getVisitById = async (id, role, email) => {
  const response = await axiosInstance.get(`/getVisitById/${id}`, { params: { role, email } });
  return response.data;
};

// Delete Visit
export const deleteVisit = async (id, role, email) => {
  const response = await axiosInstance.delete(`/deleteVisit/${id}`, { params: { role, email } });
  return response.data;
};

// Get Visits By Lead ID
export const getVisitsByLeadId = async (enquiry_id, role, email) => {
  const response = await axiosInstance.get(`/getVisitByLeadId/${enquiry_id}`, { params: { role, email } });
  return response.data;
};