import axiosInstance from "../Common/axiosConfig";

// Helper function to get auth params
const getAuthParams = () => ({
  role: sessionStorage.getItem("role") || "staff",
  email: sessionStorage.getItem("email") || "",
  branchCode: sessionStorage.getItem("branchCode") || "",
});

// ========================= SCHOLARSHIP CRUD =========================

// Get All Scholarships
export const getAllScholarships = async () => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.get("/getAll", {
      params: { role, email, branchCode },
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching scholarships:", error);
    throw error;
  }
};

// Create Scholarship
export const createScholarship = async (data) => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.post("/create", data, {
      params: { role, email, branchCode },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating scholarship:", error);
    throw error;
  }
};

// Update Scholarship
export const updateScholarship = async (id, data) => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.put(`/update/${id}`, data, {
      params: { role, email, branchCode },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating scholarship:", error);
    throw error;
  }
};

// Delete Scholarship
export const deleteScholarship = async (id) => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.delete(`/delete/${id}`, {
      params: { role, email, branchCode },
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting scholarship:", error);
    throw error;
  }
};

// ========================= DROPDOWN APIs =========================

// Study Locations
export const getAllStudyLocations = async () => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.get("/getAllStudyLocations", {
      params: { role, email, branchCode },
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching study locations:", error);
    throw error;
  }
};

// Scholarship For
export const getAllScholarshipFor = async () => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.get("/getAllScholarshipFor", {
      params: { role, email, branchCode },
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching scholarship for:", error);
    throw error;
  }
};

// Scholarship Types
export const getAllScholarshipTypes = async () => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.get("/getAllScholarshipTypes", {
      params: { role, email, branchCode },
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching scholarship types:", error);
    throw error;
  }
};

// Scholarship Categories
export const getAllScholarshipCategories = async () => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.get("/getAllScholarshipCategories", {
      params: { role, email, branchCode },
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching scholarship categories:", error);
    throw error;
  }
};

// ========================= SCHOLARSHIP LEAD APIs =========================

// Create Scholarship Lead
export const createScholarshipLead = async (data) => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.post("/leads/create", data, {
      params: { role, email, branchCode },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating scholarship lead:", error);
    throw error;
  }
};

// Get All Scholarship Leads
export const getAllScholarshipLeads = async () => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.get("/leads/getAll", {
      params: { role, email, branchCode },
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching scholarship leads:", error);
    throw error;
  }
};

// Update Scholarship Lead
export const updateScholarshipLead = async (id, data) => {
  try {
    const { role, email, branchCode } = getAuthParams();

    const response = await axiosInstance.put(`/leads/update/${id}`, data, {
      params: { role, email, branchCode },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating scholarship lead:", error);
    throw error;
  }
};
