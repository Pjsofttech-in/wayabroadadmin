import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Attach a real signed-in user's token only to protected requests.
// Public registration requests set { skipAuth: true } in their request config.
axiosInstance.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    if (config.skipAuth === true) {
      delete config.headers.Authorization;
      delete config.headers.authorization;
      return config;
    }

    const token = sessionStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
      delete config.headers.authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Only an authenticated request expiring should send an admin user to login.
// A public QR registration request must never trigger this redirect.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const authorizationHeader =
      originalRequest?.headers?.Authorization ||
      originalRequest?.headers?.authorization ||
      originalRequest?.headers?.get?.("Authorization");

    if (
      status === 401 &&
      originalRequest?.skipAuth !== true &&
      Boolean(authorizationHeader)
    ) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please login again.",
        confirmButtonColor: "#3085D6",
      }).then(() => {
        sessionStorage.clear();
        window.location.href = "/wayabroadadmin";
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
