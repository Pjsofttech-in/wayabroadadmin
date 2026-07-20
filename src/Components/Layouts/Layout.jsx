import React, { useState, useEffect, memo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

import Header from "./Header";
import Sidebar from "./Sidebar";
import logo from "../../assets/Images/LOGO.png";

const Layout = memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const contentVariants = {
    open: {
      marginLeft: !isMobile ? 215 : 0,
      transition: { duration: 0.4 },
    },
    closed: {
      marginLeft: !isMobile ? 50 : 0,
      transition: { duration: 0.4 },
    },
  };

  return (
   <Box display="flex" flexDirection="column" minHeight="100vh" bgcolor="#F8F9FA">
  <Header />
  <Box display="flex" flexGrow={1} mt="64px">
    <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          ...contentVariants[sidebarOpen ? "open" : "closed"],
        }}
        exit={{ opacity: 0 }}
        style={{ flexGrow: 1, display: "flex", flexDirection: "column",overflowX:'hidden' }}
      >
        <Box
          display="flex"
          flexDirection="column"
          flexGrow={1}
          bgcolor="white"
          p={0.9}
          borderRadius={1}
          boxShadow="0 4px 20px rgba(0,0,0,0.08)"
          sx={{
            transition: "box-shadow 0.3s ease",
            "&:hover": {
              boxShadow: "0 6px 25px rgba(0,0,0,0.12)",
            },
          }}
        >
          {/* Content */}
          <Box flexGrow={1} overflow="auto">
            <Outlet />
          </Box>

          {/* Footer */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            borderTop="1px solid rgba(0,0,0,0.05)"
            py={1}
            px={2}
          >
            <Typography
              variant="body2"
              align="center"
              display="flex"
              justifyContent="center"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
            >
              <a
                href="https://pjsofttech.com/solutions"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.color = "#2980B9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.color = "inherit";
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="Logo"
                  width={14}
                  height={14}
                  borderRadius="50%"
                />
                Software Designed By Wayabroad Pvt. Ltd.
              </a>
              <Typography
                component="span"
                variant="caption"
                color="red"
                fontWeight="medium"
              >
                © All Rights Reserved
              </Typography>
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </AnimatePresence>
  </Box>
</Box>

  );
});

export default Layout;