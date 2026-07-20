// src/components/Auth/SidebarLoginContainer.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserOutlined, BranchesOutlined, AppstoreOutlined, TeamOutlined } from "@ant-design/icons";
import SuperAdminLogin from "./SuperAdminLogin";
import BranchLogin from "./BranchLogin";
import StaffLogin from "./StaffLogin";
import "./SidebarLogin.css";
import logo from "../../assets/Images/LOGO.png"; // Adjust the path as necessary

// Add login circles data and animation variants
const loginCircles = [
  { label: "Academy Teacher", color: "#1890ff", path: "/admission-teacher" },
  { label: "Student Teacher", color: "#52c41a", path: "/student-teacher-login" },
  { label: "Academy Student", color: "#faad14", path: "/admissionuser" },
  { label: "Student", color: "#eb2f96", path: "/student-login" },
  { label: "Employee", color: "#722ed1", path: "/employee-login" },
];

const circleVariants = {
  hidden: { opacity: 0, scale: 0.7, y: 30 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.12, type: "spring", stiffness: 200 },
  }),
};

const SidebarLoginContainer = () => {
  const [activeType, setActiveType] = useState("superAdmin");

  // Define login types with their components and icons
  const loginTypes = [
    {
      key: "superAdmin",
      label: "Super Admin",
      icon: <UserOutlined />,
      component: <SuperAdminLogin />,
      color: "#2E86C1"
    },
    {
      key: "branch",
      label: "Branch",
      icon: <BranchesOutlined />,
      component: <BranchLogin />,
      color: "#16A085"
    },
    // {
    //   key: "department",
    //   label: "Department",
    //   icon: <AppstoreOutlined />,
    //   component: <DepartmentLogin />,
    //   color: "#E67E22"
    // },
    {
      key: "staff",
      label: "Staff",
      icon: <TeamOutlined />,
      component: <StaffLogin />,
      color: "#8E44AD"
    }
  ];

  return (
    <div className="sidebar-login-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      {/* Animated Circles Panel (fully left, outside main card) */}
      {/* <div
        style={{
          width: 120,
          minHeight: 420,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "2px 0 8px #f0f1f2",
          borderRadius: "16px 0 0 16px",
          marginRight: 28,
          padding: "24px 0",
          zIndex: 2,
        }}
      > */}
        {/* <div style={{ marginBottom: 18, fontWeight: 600, fontSize: 14, color: "#333" }}>Other Logins</div> */}
        {/* <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {loginCircles.map((circle, i) => (
            <motion.div
              key={circle.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={circleVariants}
              whileHover={{ scale: 1.09, boxShadow: "0 0 0 4px #e6f7ff" }}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: circle.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                transition: "box-shadow 0.2s",
                color: "#fff",
                fontWeight: 500,
                fontSize: 11,
                textAlign: "center",
                userSelect: "none",
                overflow: "hidden",
                padding: 0,
              }}
              onClick={() => window.location.href = circle.path}
            >
              <span style={{ lineHeight: 1.1, width: "90%", wordBreak: "break-word" }}>
                {circle.label}
              </span>
            </motion.div>
          ))}
        </div> */}
      {/* </div> */}
      {/* Main login card */}
      <div className="sidebar-login-admin">
        {/* Sidebar navigation */}
        <div className="login-sidebar">
          <div className="sidebar-logo">
            <img src={logo} alt="Logo" />
          </div>
          
          <div className="sidebar-nav">
            {loginTypes.map((type) => (
              <motion.div
                key={type.key}
                className={`sidebar-nav-item ${activeType === type.key ? 'active' : ''}`}
                onClick={() => setActiveType(type.key)}
                whileHover={{ x: 5 }}
                style={{
                  borderLeftColor: activeType === type.key ? type.color : 'transparent'
                }}
              >
                <div className="nav-icon" style={{ color: activeType === type.key ? type.color : '#666' }}>
                  {type.icon}
                </div>
                <span>{type.label}</span>
              </motion.div>
            ))}
          </div>
          
          <div className="sidebar-footer">
            <p>© 2025 Wayabroad PVT. LTD.</p>
          </div>
        </div>
        
        {/* Main content area with login form */}
        <div className="login-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="login-form-wrapper"
            >
              <div 
                className="login-header-color" 
                style={{ backgroundColor: loginTypes.find(t => t.key === activeType).color }}
              ></div>
              {loginTypes.find(t => t.key === activeType).component}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SidebarLoginContainer;