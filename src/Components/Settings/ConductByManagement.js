// src/api/AbroadConductByService.js
import axiosInstance from "../Common/axiosConfig";

// Create a new "Conducted By"
export const createConductBy = async (conductByData) => {
  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  try {
    // Validate conductByData
    if (!conductByData || !conductByData.conductBy || !conductByData.conductBy.trim()) {
      throw new Error('Conduct By is required');
    }

    const payload = {
      conductBy: conductByData.conductBy.trim()
    };

    const response = await axiosInstance.post("/addConductBy", payload, {
      params: { role, email },
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: (status) => status >= 200 && status < 300,
    });

    if (!response.data) {
      throw new Error("Empty response from server");
    }

    // Check for either 'conductBy' or 'name' in the response for backward compatibility
    if (!response.data.conductBy && !response.data.name) {
      console.warn('Unexpected response format:', response.data);
      // Still return the data as the operation might have succeeded
      return response.data;
    }

    return response.data;
  } catch (error) {
    console.error("Error creating Conducted By:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

// Get all "Conducted By" records
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

// Get a "Conducted By" record by ID
export const getConductByById = async (id) => {
  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  try {
    const response = await axiosInstance.get(`/getConductByById/${id}`, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Conducted By by ID:", error);
    throw error;
  }
};

// Update "Conducted By" record
export const updateConductBy = async (id, updatedData) => {
  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  if (!updatedData || !updatedData.conductBy || !updatedData.conductBy.trim()) {
    throw new Error("Conducted By name is required");
  }

  try {
    const payload = {
      ...updatedData,
      conductBy: updatedData.conductBy.trim(),
    };

    const response = await axiosInstance.put(`/updateConductBy/${id}`, payload, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating Conducted By:", error);
    throw error;
  }
};

// Delete "Conducted By" record
export const deleteConductBy = async (id) => {
  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  try {
    const response = await axiosInstance.delete(`/deleteConductBy/${id}`, {
      params: { role, email },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to delete Conducted By";
    console.error("Error deleting Conducted By:", errorMessage);
    throw new Error(errorMessage);
  }
};
