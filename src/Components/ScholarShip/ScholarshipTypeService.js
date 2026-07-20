import axiosInstance from "../Common/axiosConfig";

const getAuthParams = () => ({
  role: sessionStorage.getItem("role") || "staff",
  email: sessionStorage.getItem("email") || "",
});

// ================== SCHOLARSHIP TYPE CRUD ==================

// Create ScholarshipType
export const createScholarshipType = async (data) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.post("/createScholarshipType", data, {
    params: { role, email },
  });

  return response.data;
};

// Get All ScholarshipTypes
export const getAllScholarshipType = async () => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.get("/getAllScholarshipType", {
    params: { role, email },
  });

  return response.data;
};

// Get ScholarshipType By ID
export const getScholarshipTypeById = async (id) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.get(`/getByIdScholarshipType/${id}`, {
    params: { role, email },
  });

  return response.data;
};

// Update ScholarshipType
export const updateScholarshipType = async (id, data) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.put(`/updateScholarshipType/${id}`, data, {
    params: { role, email },
  });

  return response.data;
};

// Delete ScholarshipType
export const deleteScholarshipType = async (id) => {
  const { role, email } = getAuthParams();

  const response = await axiosInstance.delete(`/deleteScholarshiptype/${id}`, {
    params: { role, email },
  });

  return response.data;
};
