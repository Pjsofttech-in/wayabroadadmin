import React, { useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import {
  School as StreamIcon,
  MenuBook as CourseIcon,
  People as ConductIcon,
  Article as ArticleIcon,
} from "@mui/icons-material";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";

const menuItems = [
  { id: "stream", label: "Stream", icon: <StreamIcon />, path: "stream" },
  { id: "course", label: "Course", icon: <CourseIcon />, path: "course" },
  {id: "blogCourses", label: "Blog Category", icon: <ArticleIcon />, path: "blogCourses"},
  { id: "conduct-by", label: "Conduct By", icon: <ConductIcon />, path: "conduct-by" },
];

const Sidebar = ({ selectedComponent, onSelect, isCollapsed }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: isCollapsed ? 45 : 230,
        padding: 1,
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        backgroundColor: "#2980B9",
        transition: "width 0.3s ease",
        height: "auto",
        minHeight: "30%",
      }}
    >
      {menuItems.map((item) => (
        <Typography
          key={item.id}
          onClick={() => onSelect(item)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            padding: "10px",
            cursor: "pointer",
            fontSize: 13,
            color: selectedComponent === item.id ? "black" : "white",
            fontWeight: selectedComponent === item.id ? 600 : 400,
            borderRadius: 16,
            backgroundColor: selectedComponent === item.id ? "white" : "transparent",
            boxShadow: selectedComponent === item.id
              ? "0px 4px 10px rgba(0, 0, 0, 0.2)"
              : "none",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
            '&:hover': {
              backgroundColor: selectedComponent === item.id ? "white" : "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          {item.icon}
          {!isCollapsed && item.label}
        </Typography>
      ))}
    </Paper>
  );
};

const SettingSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return menuItems.find(item => item.path === path)?.id || 'stream';
  };

  const handleSelect = (item) => {
    navigate(item.path);
  };

  React.useEffect(() => {
    // Ensure we have a default route if the path is just /settings
    if (location.pathname.endsWith('/settings')) {
      navigate('stream', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Box sx={{ display: "flex", minHeight: "50%", height: "auto" }}>
      <Box 
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        sx={{ height: 'auto' }}
      >
        <Sidebar
          selectedComponent={getActiveTab()}
          onSelect={handleSelect}
          isCollapsed={isCollapsed}
        />
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          padding: 2,
          marginLeft: 2,
          border: "1px solid #ddd",
          borderRadius: 2,
          backgroundColor: "#ffffff",
          minHeight: '400px',
          position: 'relative',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default SettingSidebar;