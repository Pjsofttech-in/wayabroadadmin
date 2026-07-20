import axiosInstance from "../Common/axiosConfig";

const getAuthParams = () => ({
  role: sessionStorage.getItem("role") || "staff",
  email: sessionStorage.getItem("email") || "",
});

// ================== STUDY LOCATION CRUD ==================

// Create Study Location
export const createStudyLocation = async (data) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.post("/createScholarshipStudyLocation", data, {
    params: { role, email },
  });

  return response.data;
};

// Get All Study Locations
export const getAllStudyLocations = async () => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.get("/getAllScholarshipStudyLocation", {
    params: { role, email },
  });

  return response.data;
};

// Get Study Location By ID
export const getStudyLocationById = async (id) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.get(`/ScholarshipStudyLocation/${id}`, {
    params: { role, email },
  });

  return response.data;
};

// Update Study Location
export const updateStudyLocation = async (id, data) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.put(`/ScholarshipStudyLocation/${id}`, data, {
    params: { role, email },
  });

  return response.data;
};

// Delete Study Location
export const deleteStudyLocation = async (id) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.delete(`/ScholarshipStudyLocation/${id}`, {
    params: { role, email },
  });

  return response.data;
};
