import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:8080";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Never fall back to a hardcoded JWT. Attach only the current user's token.
axiosInstance.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const token = sessionStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
    delete config.headers.authorization;
  }

  return config;
});

export default axiosInstance;
