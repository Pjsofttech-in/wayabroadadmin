import axios from "axios";

//  const BASE_URL = "https://wayabroad.in:10443";

 const BASE_URL = "http://localhost:8080"; // Update if backend URL changes


//  const BASE_URL = "https://wayabroad.in:10443"; // Uncomment for production

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Automatically attach token for all requests
axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("authToken")||"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwdW5lQGdtYWlsLmNvbSIsImlhdCI6MTc0OTE5MTYxOSwiZXhwIjoxNzQ5Mjc4MDE5fQ.1ufTcrB2Bf6eAnjSw0NC8qmzPrEJWhL0AiE32EwhfQs";
  console.log("Token being sent:", token); // Debug the token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
