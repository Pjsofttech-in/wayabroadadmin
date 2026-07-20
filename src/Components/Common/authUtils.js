import { jwtDecode } from "jwt-decode"; // Use named import

export const isTokenValid = () => {
  const token = sessionStorage.getItem("authToken");
  if (!token) return false;

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Current time in seconds
    return decodedToken.exp > currentTime; // Check if token is still valid
  } catch (error) {
    console.error("Invalid token:", error);
    return false;
  }
};

export const logout = (navigate) => {
  sessionStorage.clear();
  navigate("/wayabroadadmin");
};