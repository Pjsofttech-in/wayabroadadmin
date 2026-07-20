import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const authToken = sessionStorage.getItem("authToken");

  if (!authToken) {
    // Redirect to login if not authenticated
    return <Navigate to="/wayabroadadmin" />;
  }

  // Render the protected route
  return children;
};

export default PrivateRoute;
