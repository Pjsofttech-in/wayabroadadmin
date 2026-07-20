// import axios from "axios";

// const BASE_URL = "http://localhost:8097"; // Update if backend URL changes

// const axiosInstance = axios.create({
//   baseURL: BASE_URL,
// });

// // Automatically attach token for all requests
// axiosInstance.interceptors.request.use((config) => {
//   const token = sessionStorage.getItem("authToken");
//   console.log("Token being sent:", token); // Debug the token
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default axiosInstance;

import axios from "axios";
import Swal from "sweetalert2";
const axiosInstance = axios.create({
  baseURL: "http://localhost:8097", // your base URL
  // baseURL: "https://wayabroad.in:11443", // Uncomment for production
});
// Request Interceptor: attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("authToken") || "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJydXNoYWJoc2hldGUxODhAZ21haWwuY29tIiwiaWF0IjoxNzUwODI5NTc3LCJleHAiOjE3NTA5MTU5Nzd9.5URgO-c4fi5ARNvfdw9IdlnNAqg1RbYmd0BcB0Fv-ys";
    console.log("Token before request:", token) ;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Response Interceptor: handle expired token
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please login again.",
        confirmButtonColor: "#3085D6",
      }).then(() => {
        sessionStorage.clear(); // Clear token and other session data
        window.location.href = "/wayabroadadmin"; // Navigate to login
      });
    }
    return Promise.reject(error);
  }
);
export default axiosInstance;