// Single HTTP entry point for the Paid Plan module. It reuses the shared API client
// (Bearer token + session-expiry handling). If these endpoints live on the admin
// API instead, change only this import.
import axiosInstance from "../Common/axiosConfig";

// Paths are used exactly as documented in the implementation guide (§4.1).
export const PAYMENTS_API = "/api/payments";

// Same caller context the existing Jobs service also sends (role + email query params).
export const authParams = () => ({
  role: sessionStorage.getItem("role") || "",
  email: sessionStorage.getItem("email") || "",
});

export const unwrap = (response) => response?.data;

export default axiosInstance;
