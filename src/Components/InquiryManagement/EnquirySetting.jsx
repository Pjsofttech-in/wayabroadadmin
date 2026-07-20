import React, { useState, lazy, Suspense } from "react";
import { Box, Paper, Typography } from "@mui/material";
import {
  Source as SourceIcon,
  School as ConductIcon,
  QrCodeScanner as QrCodeIcon,
  MenuBook as CategoryIcon,
  AutoStories as CourseIcon,
  MoreHoriz as StatusIcon,
  AutoStories as DeptIcon,
  QrCodeScanner as FeedbackQRIcon,
} from "@mui/icons-material";
import LoadingOverlay from "../Components/Common/LoadingOverlay";

const Source = lazy(() => import("./SettingPages/Source"));
const Conduct = lazy(() => import("./SettingPages/Conduct"));
const Department = lazy(() => import("./SettingPages/Department"));
const FeedBackQR = lazy(() => import("./SettingPages/FeedBackQR"));
const QRCode = lazy(() => import("./SettingPages/QRCode"));
const EnquiryStatus = lazy(() => import("./SettingPages/EnquiryStatus"));
const Category = lazy(() => import("./SettingPages/Category"));
const Course = lazy(() => import("./SettingPages/Course"));

const menuItems = [
  { id: "course", label: "Course (Catalogue)", icon: <CourseIcon /> },
  { id: "source", label: "Add Source", icon: <SourceIcon /> },
  { id: "conduct", label: "Add Conduct", icon: <ConductIcon /> },
  { id: "Department", label: "Department", icon: <DeptIcon /> },
  { id: "FeedBackQR", label: "Feedback QR", icon: <FeedbackQRIcon /> },
  { id: "qrcode", label: "Generate QR", icon: <QrCodeIcon /> },
  { id: "EnquiryStatus", label: "Todo Status", icon: <StatusIcon /> },
  { id: "category", label: "Add Category", icon: <CategoryIcon /> },
];

const Sidebar = ({ selectedComponent, onSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

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
        height: "100%",
        overflowY: "hidden",
        border: "1px solid black"
      }}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {menuItems.map((item) => (
        <Box
          key={item.id}
          title={isCollapsed ? item.label : ""}
          placement="right"
        >
          <Typography
            onClick={() => onSelect(item.id)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              padding: "10px",
              cursor: "pointer",
              fontSize: 13,
              color: selectedComponent === item.id ? "black" : "white",
              border: selectedComponent === item.id ? "1px solid black" : "white",
              fontWeight: selectedComponent === item.id ? 600 : 400,
              borderRadius: 16,
              backgroundColor:
                selectedComponent === item.id ? "white" : "transparent",
              boxShadow:
                selectedComponent === item.id
                  ? "0px 4px 10px rgba(0, 0, 0, 0.2)"
                  : "none",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            {item.icon}
            {!isCollapsed && item.label}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

const EnquirySetting = () => {
  const [selectedComponent, setSelectedComponent] = useState("course");

  const renderSelectedComponent = () => {
    const components = {
      course: <Course />,
      source: <Source />,
      conduct: <Conduct />,
      Department: <Department />,
      FeedBackQR: <FeedBackQR />,
      qrcode: <QRCode />,
      EnquiryStatus: <EnquiryStatus />,
      category: <Category />,
    };
    return components[selectedComponent] || null;
  };

  return (
    <Box sx={{ display: "flex", padding: 2, height: "100%" }}>
      <Sidebar
        selectedComponent={selectedComponent}
        onSelect={setSelectedComponent}
      />
      <Box
        sx={{
          flexGrow: 1,
          padding: 2,
          marginLeft: 2,
          border: "1px solid black",
          borderRadius: 2,
          backgroundColor: "#f9f9f9",
          position: "relative", // for LoadingOverlay if needed
        }}
      >
        <Suspense fallback={<LoadingOverlay loading={true} />}>
          {renderSelectedComponent()}
        </Suspense>
      </Box>
    </Box>
  );
};

export default EnquirySetting;
