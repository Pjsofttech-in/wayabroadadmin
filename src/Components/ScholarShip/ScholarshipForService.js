import axiosInstance from "../Common/axiosConfig";

// Helper function to get auth params
const getAuthParams = () => ({
  role: sessionStorage.getItem("role") || "staff",
  email: sessionStorage.getItem("email") || "",
});

// ================== SCHOLARSHIP FOR CRUD ==================

// Create ScholarshipFor
export const createScholarshipFor = async (data) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.post("/createScholarshipFor", data, {
    params: { role, email },
  });

  return response.data;
};

// Get All ScholarshipFor
export const getAllScholarshipFor = async () => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.get("/GetByAllScholarshipFor", {
    params: { role, email },
  });

  return response.data;
};

// Get ScholarshipFor By ID
export const getScholarshipForById = async (id) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.get(`/GetByIdScholarshipFor/${id}`, {
    params: { role, email },
  });

  return response.data;
};

// Update ScholarshipFor
export const updateScholarshipFor = async (id, data) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.put(`/UpdateScholarshipFor/${id}`, data, {
    params: { role, email },
  });

  return response.data;
};

// Delete ScholarshipFor
export const deleteScholarshipFor = async (id) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.delete(`/deleteScholarship/${id}`, {
    params: { role, email },
  });

  return response.data;
};
