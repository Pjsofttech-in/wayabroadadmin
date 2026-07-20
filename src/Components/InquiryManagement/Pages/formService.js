// src/components/formService.js
import axiosInstance from "../../Common/axiosConfig";
//import { message } from "antd";
export async function createAbroadInquiry(formData, email, role) {
  try {
    // Create a new FormData instance
    const data = new FormData();
    
    // Extract the enquiry data (all fields except photo and IDs)
    const enquiryData = { ...formData };
    const photo = enquiryData.photo;
    
    // Remove photo and IDs from enquiry data as they will be added separately
    // Use 'collage' (with correct spelling for backend) to match backend expectations
    const idFields = ['continentId', 'countryId', 'stateId', 'cityId', 'universityId', 'streamId', 'courseId'];
    
    // Remove IDs from enquiry data
    idFields.forEach(id => delete enquiryData[id]);
    
    // Remove collageId since we'll use collage instead
    delete enquiryData.collageId;
    delete enquiryData.photo;
    
    // Remove documents from JSON data - they will be sent as separate FormData fields
    delete enquiryData.document1;
    delete enquiryData.document2;
    
    // Add the enquiry object as a JSON string
    data.append('enquiry', JSON.stringify(enquiryData));
    
    // Add all IDs as separate form fields
    idFields.forEach(id => {
      if (formData[id] !== undefined && formData[id] !== null) {
        data.append(id, String(formData[id]));
      }
    });
    
    // Handle college relationship
    if (formData.abroadCollege?.id) {
      data.append('collegeId', String(formData.abroadCollege.id));
    } else if (formData.collageId) {
      data.append('collegeId', String(formData.collageId));
    }
    
    // Add the photo if it exists
    if (photo) {
      data.append('photo', photo);
    }
    
    // Add documents if they exist
    if (formData.document1) {
      data.append('document1', formData.document1);
    }
    if (formData.document2) {
      data.append('document2', formData.document2);
    }
    
    // Add role, email, and branchCode as separate fields
    data.append('role', role);
    data.append('email', email);
    data.append('createdByEmail', email); // Add createdByEmail for role-based filtering
    const branchCode = sessionStorage.getItem("branchCode") || "";
    data.append('branchCode', branchCode);
    
    // Ensure all required fields are present in the form data
    const requiredFields = [
      'continentId', 'countryId', 'stateId', 'cityId', 
      'universityId', 'courseId'
    ];
    
    // Add collegeId separately as it's handled specially
    if (!data.has('collegeId') && formData.abroadCollege?.id) {
      data.append('collegeId', String(formData.abroadCollege.id));
    } else if (!data.has('collegeId') && formData.collageId) {
      data.append('collegeId', String(formData.collageId));
    }
    
    // Add other required fields
    requiredFields.forEach(field => {
      if (!data.has(field) && formData[field]) {
        data.append(field, String(formData[field]));
      }
    });
    
    // Log the data being sent (for debugging)
    console.log('FormData entries:');
    for (let [key, value] of data.entries()) {
      console.log(`${key}:`, key === 'enquiry' ? JSON.parse(value) : value);
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await axiosInstance.post("/createEnquiry", data, config);
    return response.data;
  } catch (error) {
    console.error("Error in createAbroadInquiry:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    throw error;
  }
}

// Get all courses
export const getAllCourses = async () => {
  try {
    const role = sessionStorage.getItem('role') || 'staff';
    const email = sessionStorage.getItem('email') || '';
    const response = await axiosInstance.get('/getAllCourses', {
      params: { 
        role,
        email,
        branchCode: sessionStorage.getItem("branchCode") || ""
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
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

// Get all Conducted By
export const getAllConductBy = async () => {
  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  try {
    const response = await axiosInstance.get("/getAllConductBy", {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Conducted By list:", error);
    throw error;
  }
};

// Add this to your formService.js
export const updateAbroadInquiry = async (id, formData) => {
  try {
    const response = await axiosInstance.put(`/updateEnquiry/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Get all staff by branchCode
export const getAllStaffWithBranchCode = async () => {
  try {
    const branchCode = sessionStorage.getItem("branchCode") || "";
    
    const response = await axiosInstance.get("/getAllStaffWithBranchCode", {
      params: {
        branchCode: branchCode
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching staff with branchCode:", error);
    throw error;
  }
};