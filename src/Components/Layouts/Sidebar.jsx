import React, { memo, useCallback, useEffect, useState } from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Tooltip,
  Zoom,
  Collapse,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
  width: 210px;
  overflow: hidden;
  z-index: 1200;
}

  
  .sidebar-container.open {
    width: 210px;
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
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    transition: background-color 0.2s ease, transform 0.2s ease;
    min-height: 40px;
    box-sizing: border-box;
    padding: 6px 12px;
    margin: 2px 6px;
    width: calc(100% - 12px);
  }
  
  .sidebar-item:hover {
    background-color: rgba(255, 255, 255, 0.12);
    transform: translateX(2px);
  }

  .sidebar-item.active {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.2);
  }

  .sidebar-item.active .MuiListItemIcon-root {
    color: #fff;
  }

  .sidebar-item .MuiListItemIcon-root {
    min-width: 34px;
  }

  .sidebar-container.closed .sidebar-item {
    width: 40px;
    margin: 2px 5px;
    padding: 6px 0;
    justify-content: center;
  }

  .sidebar-container.closed .sidebar-item .MuiListItemIcon-root {
    margin: 0;
    justify-content: center;
  }

  @media (max-width: 600px) {
    .sidebar-item {
      min-height: 38px;
      padding: 5px 10px;
      margin: 2px 4px;
      width: calc(100% - 8px);
    }
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

// Normalize paths without changing case-sensitive route semantics.
// Query strings are not part of location.pathname; this also handles trailing slashes.
const normalizePath = (path = "") => {
  const trimmedPath = path.trim();
  if (!trimmedPath) return "/";
  const withoutTrailingSlashes = trimmedPath.replace(/\/+$/, "");
  return withoutTrailingSlashes || "/";
};

// Match a route itself or one of its nested routes, but not a similarly-prefixed route.
const isRouteActive = (pathname, route) => {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(route);
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

const Sidebar = memo(({ open, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem("role");
  const coursesRoute = "/wayabroadadmin/admin/courses";
  const jobsRoute = "/wayabroadadmin/admin/jobs";
  const applicationRoute = "/wayabroadadmin/admin/application";
  const isCoursesRouteActive = isRouteActive(location.pathname, coursesRoute);
  const isJobsRouteActive = isRouteActive(location.pathname, jobsRoute);
  const isApplicationRouteActive = isRouteActive(location.pathname, applicationRoute);
  const [coursesExpanded, setCoursesExpanded] = useState(() =>
    isRouteActive(location.pathname, coursesRoute)
  );
  const [jobsExpanded, setJobsExpanded] = useState(() =>
    isRouteActive(location.pathname, jobsRoute)
  );

  useEffect(() => {
    // Keep the relevant submenu open on direct URL access and browser navigation.
    if (isCoursesRouteActive) setCoursesExpanded(true);
    if (isJobsRouteActive) setJobsExpanded(true);
  }, [isCoursesRouteActive, isJobsRouteActive]);

  // Filter navigation items by the current user's role.
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
        initial={{ width: open ? "210px" : "50px" }}
        animate={{ width: open ? "210px" : "50px" }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <List className="sidebar-list">
          {filteredNavigation.map((item, idx) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            const isJobsSection = item.title === "Jobs Management";
            const isCoursesSection = item.title === "Courses";
            const isApplicationSection = item.title === "Application Management";
            const isActive = hasChildren
              ? (isCoursesSection ? isCoursesRouteActive : isJobsSection ? isJobsRouteActive : isRouteActive(location.pathname, item.segment))
              : (isApplicationSection ? isApplicationRouteActive : isRouteActive(location.pathname, item.segment));
            const sectionExpanded = isCoursesSection
              ? coursesExpanded
              : isJobsSection
                ? jobsExpanded
                : false;
            return (
              <React.Fragment key={item.segment + idx}>
                <Tooltip
                  title={!open ? item.title : ""}
                  placement="right"
                  TransitionComponent={Zoom}
                  arrow
                  enterDelay={500}
                >
                  <MotionListItem
                    button
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      if (hasChildren) {
                        if (isCoursesSection) setCoursesExpanded((previous) => !previous);
                        else if (isJobsSection) setJobsExpanded((previous) => !previous);
                        navigate(isJobsSection && userRole === "branch"
                          ? "/wayabroadadmin/admin/jobs/list"
                          : item.segment);
                      } else {
                        handleNavigation(item.segment);
                      }
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ListItemIcon sx={{ color: "white", minWidth: 34 }}>
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
                        }}
                        sx={{ opacity: 1, marginLeft: "-10px" }}
                      />
                    )}
                    {open && hasChildren && (sectionExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
                  </MotionListItem>
                </Tooltip>
                {hasChildren && open && (
                  <Collapse in={sectionExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children.filter((child) => !child.roles || child.roles.includes(userRole)).map((child) => {
                        const childActive = normalizePath(location.pathname) === normalizePath(child.segment);
                        return (
                          <ListItem
                            key={child.segment}
                            button
                            onClick={() => handleNavigation(child.segment)}
                            sx={{
                              pl: 5,
                              py: 0.7,
                              color: "white",
                              borderRadius: 2,
                              backgroundColor: childActive ? "rgba(255,255,255,0.2)" : "transparent",
                              borderRadius: 1.5,
                              mx: 0.75,
                              my: 0.25,
                              width: "calc(100% - 12px)",
                              py: 0.55,
                              "&:hover": { backgroundColor: childActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)" },
                            }}
                          >
                            <ListItemText
                              primary={child.title}
                              primaryTypographyProps={{
                                fontSize: "12px",
                                fontWeight: childActive ? 700 : 400,
                                color: "white",
                                noWrap: true,
                              }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>
      {/* Toggle button */}
      <Box
        className="toggle-button-container"
        sx={{ left: open ? "205px" : "50px" }}
        component={motion.div}
        initial={{ left: open ? "205px" : "50px" }}
        animate={{ left: open ? "205px" : "50px" }}
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
