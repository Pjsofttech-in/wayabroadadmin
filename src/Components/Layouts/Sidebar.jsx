import React, { memo, useCallback } from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Tooltip,
  Zoom,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { motion } from "framer-motion";
import { NAVIGATION } from "./SidebarNavigation";

const sidebarStyles = `
  .sidebar-container {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  height: calc(100% - 64px);
  width: 220px;
  overflow: hidden;
  z-index: 1200;
}

  
  .sidebar-container.open {
    width: 220px;
  }
  
  .sidebar-container.closed {
    width: 50px;
  }
  
  .sidebar-list {
  overflow-y: scroll;
  height: 100%;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.sidebar-list::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  display: none !important;
}

  
  .sidebar-list::-webkit-scrollbar-thumb {
    background-color: rgba(160, 0, 0, 0.78);
    border-radius: 4px;
  }
  
  .sidebar-item {
    color: #fff;
    border-radius: 30px;
    font-family: 'Poppins', sans-serif;
    transition: all 0.3s ease;
    padding: 8px 14px;
  }
  
  .sidebar-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }
  
  .sidebar-item.active {
    color: black;
    background-color: white;
  }
  
  .toggle-button-container {
    position: fixed;
    top: 50%;
    transform: translateX(-50%);
    z-index: 1300;
    transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .toggle-button {
    background-color: black;
    color: white;
    padding: 6px;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
  
  .toggle-button:hover {
    background-color: black;
  }
`;

const MotionListItem = motion(ListItem);

const Sidebar = memo(({ open, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem("role");

  // Only filter NAVIGATION based on roles (no submenu logic)
  const filteredNavigation = NAVIGATION.filter((item) =>
    item.roles?.includes(userRole)
  );

  const handleNavigation = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  return (
    <>
      <style>{sidebarStyles}</style>
      <Box
        className={`sidebar-container ${open ? "open" : "closed"}`}
        component={motion.div}
        initial={{ width: open ? "220px" : "50px" }}
        animate={{ width: open ? "220px" : "50px" }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <List className="sidebar-list">
          {filteredNavigation.map((item, idx) => {
            const isActive = location.pathname === item.segment;
            return (
              <Tooltip
                key={item.segment + idx}
                title={!open ? item.title : ""}
                placement="right"
                TransitionComponent={Zoom}
                arrow
                enterDelay={500}
              >
                <MotionListItem
                  button
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                  onClick={() => handleNavigation(item.segment)}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "black" : "white",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && (
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontWeight: isActive ? "bold" : "medium",
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        transition: "all 0.3s ease",
                      }}
                      sx={{
                        opacity: open ? 1 : 0,
                        transition: "opacity 0.3s",
                        marginLeft: "-10px",
                      }}
                    />
                  )}
                </MotionListItem>
              </Tooltip>
            );
          })}
        </List>
      </Box>
      {/* Toggle button */}
      <Box
        className="toggle-button-container"
        sx={{ left: open ? "215px" : "50px" }}
        component={motion.div}
        initial={{ left: open ? "215px" : "50px" }}
        animate={{ left: open ? "215px" : "50px" }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Tooltip
          title={open ? "Collapse Sidebar" : "Expand Sidebar"}
          placement="right"
          arrow
        >
          <IconButton
            onClick={toggleSidebar}
            className="toggle-button"
            size="small"
            component={motion.button}
            whileHover={{ rotate: open ? -180 : 180, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            aria-label={open ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
});


export default Sidebar;
