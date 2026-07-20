// npm run build npm run preview

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Box, Button, Stack, Paper } from "@mui/material";
import LoadingOverlay from "../Common/LoadingOverlay"; // Make sure path is correct

const navItems = [
  { label: "Scholarship Form", to: "/wayabroadadmin/admin/scholarship" },
  { label: "Scholarship List", to: "/wayabroadadmin/admin/scholarship/list" },
  // { label: "Scholarship Lead Form", to: "/wayabroadadmin/admin/scholarship/lead-form" },
  { label: "Lead List", to: "/wayabroadadmin/admin/scholarship/lead-list" },
  { label: "Settings", to: "/wayabroadadmin/admin/scholarship/settings" },
];

const ScholarshipSidebar = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Get role from sessionStorage
  const role = sessionStorage.getItem("role");

  // Filter nav items based on role
  const filteredNavItems = navItems.filter((item) => {
    // For superAdmin, show all items
    if (role === "superAdmin") {
      return true;
    }
    // For other roles, only show 'Add Registration'
    return item.label !== "Registration List";
  });

  // Track route changes
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // Adjust delay as needed
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <Box>
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "5px",
          backgroundColor: "#2980B9",
          padding: "8px",
          borderRadius: "30px",
          boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
          border: "1px solid black"
        }}
      >
        <Stack direction="row" spacing={2} sx={{ justifyContent: "space-evenly", width: "100%" }}>
          {filteredNavItems.map((item, index) => {
            // Check if current path matches the item's path or if it's the index route
            const isActive = location.pathname === item.to || 
                            (location.pathname.endsWith('/registration') && item.to === 'registrationForm');

            return (
              <NavLink
                key={index}
                to={item.to}
                style={{ textDecoration: "none", flex: 1 }}
              >
                <Button
                  fullWidth
                  sx={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: isActive ? "bold" : "normal",
                    textAlign: "center",
                    color: isActive ? "black" : "white",
                    backgroundColor: isActive ? "white" : "transparent",
                    borderRadius: "30px",
                    textTransform: "none",
                    border: isActive ? "1px solid black" : "",
                    cursor: "pointer",
                    boxShadow: isActive ? "0px 4px 8px rgba(0, 0, 0, 0.2)" : "none",
                    transition: "background-color 0.3s ease, color 0.3s ease",
                    "&:hover": {
                      backgroundColor: isActive ? "#f5f5f5" : "#1f618d",
                    },
                  }}
                >
                  {item.label}
                </Button>
              </NavLink>
            );
          })}
        </Stack>
      </Paper>

      <Box sx={{ position: "relative" }}>
        <LoadingOverlay loading={loading} />
        <Outlet />
      </Box>
    </Box>
  );
};

export default ScholarshipSidebar;