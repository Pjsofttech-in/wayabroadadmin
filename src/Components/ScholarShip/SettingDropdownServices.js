import axiosInstance from "../Common/axiosConfig";

// Helper function to get auth params
const getAuthParams = () => ({
  role: sessionStorage.getItem("role") || "staff",
  email: sessionStorage.getItem("email") || "",
});

// GET Study Location
export const getAllStudyLocation = async () => {
  const { role, email } = getAuthParams();
  return axiosInstance
    .get("getAllScholarshipStudyLocation", { params: { role, email } })
    .then((res) => res.data);
};

// GET Scholarship For
export const getAllScholarshipFor = async () => {
  const { role, email } = getAuthParams();
  return axiosInstance
    .get("/GetByAllScholarshipFor", { params: { role, email } })
    .then((res) => res.data);
};

// GET Scholarship Type
export const getAllScholarshipTypes = async () => {
  const { role, email } = getAuthParams();
  return axiosInstance
    .get("/getAllScholarshipType", { params: { role, email } })
    .then((res) => res.data);
};

// GET Category
export const getAllScholarshipCategories = async () => {
  const { role, email } = getAuthParams();
  return axiosInstance
    .get("/CategorygetAll", { params: { role, email } })
    .then((res) => res.data);
};
