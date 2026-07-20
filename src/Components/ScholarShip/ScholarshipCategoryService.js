import axiosInstance from "../Common/axiosConfig";

// Helper function to get auth params
const getAuthParams = () => ({
  role: sessionStorage.getItem("role") || "staff",
  email: sessionStorage.getItem("email") || "",
});

// Create Category
export const createScholarshipCategory = async (data) => {
  const { role, email } = getAuthParams();
  return axiosInstance
    .post("/Categorycreate", data, { params: { role, email } })
    .then((res) => res.data);
};

// Get All Categories
export const getAllScholarshipCategories = async () => {
  const { role, email } = getAuthParams();
  return axiosInstance
    .get("/CategorygetAll", { params: { role, email } })
    .then((res) => res.data);
};

// Get Category By ID
export const getScholarshipCategoryById = async (id) => {
  const { role, email } = getAuthParams();
  return axiosInstance
    .get(`/CategorygetById/${id}`, { params: { role, email } })
    .then((res) => res.data);
};

// Update Category
export const updateScholarshipCategory = async (id, data) => {
  const { role, email } = getAuthParams();
  return axiosInstance
    .put(`/Categoryupdate/${id}`, data, { params: { role, email } })
    .then((res) => res.data);
};

// Delete Category
export const deleteScholarshipCategory = async (id) => {
  const { role, email } = getAuthParams();
  return axiosInstance
    .delete(`/Categorydelete/${id}`, { params: { role, email } })
    .then((res) => res.data);
};
