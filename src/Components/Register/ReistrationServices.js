import axiosInstance from "../Common/axiosConfig";

// Helper function to get the QR owner's registration context.
const getAuthParams = () => ({
  role: sessionStorage.getItem("role") || "staff",
  email: sessionStorage.getItem("email") || "",
  branchCode: sessionStorage.getItem("branchCode") || "",
});

// Create a registration from the public QR form. The backend endpoint is permitAll.
export const createRegistration = async (formData) => {
  try {
    const { role, email } = getAuthParams();
    const response = await axiosInstance.post("/createRegisterForm", formData, {
      params: { role, email },
      skipAuth: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating registration form:", error);
    throw error;
  }
};

// Get all registration forms (admin operation; authenticated).
export const getRegistrations = async () => {
  try {
    const { role, email, branchCode } = getAuthParams();
    console.log("Fetching registrations with:", { role, email, branchCode });

    const params = { role, email };
    if (branchCode) {
      params.branchCode = branchCode;
    }

    const response = await axiosInstance.get("/getAllRegisterForms", { params });
    console.log("Raw API response:", response);

    const data = Array.isArray(response.data) ? response.data : [];
    console.log("Processed registrations:", data);
    return data;
  } catch (error) {
    console.error("Error fetching registrations:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return [];
  }
};

// Get a single registration form by ID (admin operation; authenticated).
export const getRegistrationById = async (id) => {
  try {
    const { role, email, branchCode } = getAuthParams();
    const response = await axiosInstance.get(`/getRegisterFormById/${id}`, {
      params: { role, email, branchCode },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching registration form with ID ${id}:`, error);
    throw error;
  }
};

// Update a registration form (admin operation; authenticated).
export const updateRegistration = async (id, updatedData) => {
  try {
    const { role, email } = getAuthParams();
    const response = await axiosInstance.put(`/updateRegisterForm/${id}`, updatedData, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating registration form with ID ${id}:`, error);
    throw error;
  }
};

// Delete a registration form (admin operation; authenticated).
export const deleteRegistration = async (id) => {
  try {
    const { role, email } = getAuthParams();
    const response = await axiosInstance.delete(`/deleteRegisterForm/${id}`, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting registration form with ID ${id}:`, error);
    throw error;
  }
};

// These lookup endpoints are explicitly permitAll in the backend.
// They must work on a phone that scans the QR without an admin session.
export const getAllStreams = async () => {
  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  try {
    const response = await axiosInstance.get("/getAllStreams", {
      params: { role, email },
      skipAuth: true,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching streams:", error);
    return [];
  }
};

export const getAllCourses = async () => {
  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  try {
    const response = await axiosInstance.get("/getAllCourseName", {
      params: { role, email },
      skipAuth: true,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};
