import axiosInstance from "../../Common/axiosConfig";

// Get all enquiries (for superAdmin)
export const getAllEnquiries = async (role, email, branchCode) => {
  const params = { role, email };
  if (branchCode && branchCode !== 'All') {
    params.branchCode = branchCode;
  }
  console.log('Fetching all enquiries with params:', params);
  try {
    const res = await axiosInstance.get("/getAllEnquiries", { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching all enquiries:', error);
    throw error;
  }
};

export const getEnquiryById = async (id, role, email) => {
  const params = { role, email };
  const res = await axiosInstance.get(`/getEnquiryById/${id}`, { params });
  return res.data;
};

export const updateEnquiry = async (id, formData, image, role, email) => {
  // Build FormData for update endpoint
  const data = new FormData();

  // Extract the enquiry data (all fields except photo)
  const enquiryData = { ...formData };
  const photo = enquiryData.photo;

  // Remove photo from enquiry data as it will be added separately
  delete enquiryData.photo;

  // Handle date fields properly for backend
  const formatDateForBackend = (dateValue) => {
    if (!dateValue) return null;

    // If it's a Date object, convert to ISO string
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    // If it's already a string, ensure it's in YYYY-MM-DD format
    else if (typeof dateValue === 'string') {
      try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Could not parse date:', dateValue);
      }
    }
    return dateValue;
  };

  // Format all date fields
  const dateFields = ['enquiry_date', 'created_date', 'updated_date', 'date_of_birth'];
  dateFields.forEach(field => {
    if (enquiryData[field]) {
      const formattedDate = formatDateForBackend(enquiryData[field]);
      if (formattedDate) {
        enquiryData[field] = formattedDate;
      } else {
        // If we can't format the date properly, remove it to avoid backend issues
        delete enquiryData[field];
        console.warn(`Removed problematic date field: ${field}`);
      }
    }
  });

  // Handle DOB field specifically (entity expects SQL Date)
  if (enquiryData.dob) {
    const dobDate = formatDateForBackend(enquiryData.dob);
    if (dobDate) {
      enquiryData.dob = dobDate;
    } else {
      delete enquiryData.dob;
    }
  }

  // Clean the data to remove any problematic fields
  const cleanEnquiryData = { ...enquiryData };

  // Remove any undefined or null values that might cause issues
  Object.keys(cleanEnquiryData).forEach(key => {
    if (cleanEnquiryData[key] === undefined) {
      delete cleanEnquiryData[key];
    }
  });

  // For update operations, exclude fields that cause issues with the backend's ObjectMapper
  const fieldsToExcludeForUpdate = [
    'created_date',
    'updated_date',
    'id',
    'enquiry_date'  // Exclude enquiry_date as it's causing LocalDate serialization issues
  ];
  fieldsToExcludeForUpdate.forEach(field => {
    if (cleanEnquiryData[field] !== undefined) {
      delete cleanEnquiryData[field];
    }
  });

  // Ensure basic fields are properly formatted for backend validation
  if (cleanEnquiryData.name === null || cleanEnquiryData.name === '') {
    delete cleanEnquiryData.name; // Don't send empty name
  }

  if (cleanEnquiryData.phone_no === null || cleanEnquiryData.phone_no === '') {
    delete cleanEnquiryData.phone_no; // Don't send empty phone
  } else if (typeof cleanEnquiryData.phone_no === 'string') {
    // Convert string phone number to Long for backend
    const phoneNum = parseInt(cleanEnquiryData.phone_no);
    cleanEnquiryData.phone_no = isNaN(phoneNum) ? null : phoneNum;
  }

  if (cleanEnquiryData.email === null || cleanEnquiryData.email === '') {
    delete cleanEnquiryData.email; // Don't send empty email
  }

  // Handle numeric fields that should be numbers
  if (cleanEnquiryData.percentage !== undefined && cleanEnquiryData.percentage !== null) {
    cleanEnquiryData.percentage = parseFloat(cleanEnquiryData.percentage) || 0.0;
  }

  if (cleanEnquiryData.fathersIncome !== undefined && cleanEnquiryData.fathersIncome !== null) {
    cleanEnquiryData.fathersIncome = parseFloat(cleanEnquiryData.fathersIncome) || 0.0;
  }

  // Add the enquiry object as a JSON string
  console.log('Sending enquiry data for update:', cleanEnquiryData);
  data.append('enquiry', JSON.stringify(cleanEnquiryData));

  // Add the photo if it exists
  if (photo) {
    data.append('image', photo);
  }

  // Add role and email as separate fields
  data.append('role', role);
  data.append('email', email);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  const res = await axiosInstance.put(`/updateEnquiry/${id}`, data, config);
  return res.data;
};

export const deleteEnquiry = async (id, role, email) => {
  await axiosInstance.delete(`/deleteEnquiry/${id}`, { params: { role, email } });
};

export const filterEnquiries = async (
  continent,
  country,
   state,
  city,
  college,
  university,
  year,
  stream,
  course,
  status,
  fullName,
  enquiryDateFilter,
  startDate,
  endDate,
  branchCode,
  role,
  email,
  page = 0,
  size = 10,
  applyFor,
  conductBy,
  staffName
) => {
  // Prepare request parameters
  const params = new URLSearchParams();
  
  // Add all parameters to the URL for GET request
  const queryParams = {
    continent,
    country,
     state,
  city,
  college,
  university,
  year,
    stream,
    course,
    status,
    fullName,
    enquiryDateFilter,
    startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : undefined,
    endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : undefined,
    branchCode,
    applyFor,
    conductBy,
    staffName,
    role,
    email,
    page: Math.max(0, parseInt(page) || 0),
    size: Math.max(1, Math.min(100, parseInt(size) || 10))
  };

  // Add non-empty parameters to URL
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  try {
    const response = await axiosInstance.post(`/filter?${params.toString()}`, null, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error filtering enquiries:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      params: queryParams
    });
    throw error;
  }
};
