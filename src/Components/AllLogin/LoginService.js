// src/components/Auth/Service/LoginService.js
import axios from "axios";
import axiosInstance from "../Utils/axiosConfig";

  const API_BASE_URL = "http://localhost:8080";
  // const API_BASE_URL = "https://wayabroad.in:10443"; // Uncomment for production

// Create axios instance with common settings
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

// Super Admin Login API
export const loginSuperAdmin = async (loginRequest) => {
  const response = await apiClient.post("/login", loginRequest, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

// Branch Login API
export const loginBranch = async (loginRequest) => {
  const response = await apiClient.post("/branchlogin", loginRequest, {
    headers: {
      "Content-Type": "application/json", // <-- Explicitly set JSON header
    },
  });
  return response.data;
};

// Department Login API
export const loginDepartment = async (loginRequest) => {
  const response = await apiClient.post("/departmentlogin", loginRequest, {
    headers: {
      "Content-Type": "application/json", // Set Content-Type to JSON
    },
  });
  return response.data;
};

// Staff Login API
export const loginStaff = async (loginRequest) => {
  const response = await apiClient.post("/stafflogin", loginRequest, {
    headers: {
      "Content-Type": "application/json", // Set Content-Type to JSON
    },
  });
  return response.data;
};


// Super Admin Registration API
export const registerSuperAdmin = async (data) => {
  try {
    const res = await fetch(`${API_BASE_URL}/superAdmin/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error("Registration Error:", err);
    throw err;
  }
};

// Forgot Password - Send OTP API for Super Admin
export const sendOTPSuperAdmin = async (email) => {
  try {
    const response = await apiClient.get(`/send-otp?email=${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

// Forgot Password - Reset Password API for Super Admin
export const resetPasswordSuperAdmin = async (email, otp, newPassword) => {
  try {
    const response = await apiClient.post(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&newPassword=${encodeURIComponent(newPassword)}`);
    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};

// Get Branch Code-Name Mapping
export const getBranchCodeNameMap = async () => {
  try {
    const response = await axiosInstance.get("/getBranchCodeNameMap");
    return response.data;
  } catch (error) {
    console.error("Error fetching branch code-name map:", error);
    throw error;
  }
};
