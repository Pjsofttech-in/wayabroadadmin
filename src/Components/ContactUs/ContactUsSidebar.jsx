import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Box, Button, Stack, Paper } from "@mui/material";
import LoadingOverlay from "../Common/LoadingOverlay";

const navItems = [
  { label: "Contact Us List", to: "/wayabroadadmin/admin/ContactUs" },
  { label: "Add Contact Us", to: "/wayabroadadmin/admin/ContactUs/create" },
];

const ContactUsSidebar = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const role = sessionStorage.getItem("role");

  const filteredNavItems = navItems.filter((item) => {
    if (
      role === "superAdmin" &&
      (item.label === "Lead Settings" || item.label === "To Do List" || item.label === "FeedBack")
    ) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
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
          border: "1px solid black",
        }}
      >
        <Stack direction="row" spacing={2} sx={{ justifyContent: "space-evenly", width: "100%" }}>
          {filteredNavItems.map((item, index) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink key={index} to={item.to} style={{ textDecoration: "none", flex: 1 }}>
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

export default ContactUsSidebar;
