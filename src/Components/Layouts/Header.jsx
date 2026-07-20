import React, { useState, memo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  AppBar,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  Avatar,
  Box,
  Fade
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import logo from "../../assets/Images/LOGO.png"; // Adjust the path as needed
import { logout } from "../Common/authUtils"; // Adjust path as needed

const Header = memo(() => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  
  const role = sessionStorage.getItem("role");
  let displayName = "Guest Account";

  if (role === "superAdmin") {
    displayName = sessionStorage.getItem("instituteName") || "Admin";
  } else if (role === "branch") {
    displayName = sessionStorage.getItem("branchName") || "Branch";
  } else if (role === "department") {
    displayName = sessionStorage.getItem("departmentName") || "Department";
  } else if (role === "staff") {
    displayName = sessionStorage.getItem("staffName") || "Staff";
  }
  const navigate = useNavigate();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleClose();
    // Route based on role
    if (role === "superAdmin") {
      navigate("/admin/Admin-Profile");
    } else if (role === "branch") {
      // const branchId = sessionStorage.getItem("branchId"); // Get the branch ID from sessionStorage
      navigate(`/admin/BranchProfile`); // Navigate to the branch profile with the ID
    } else if (role === "department") {
      navigate("/admin/DepartmentProfile");
    } else if (role === "staff") {
      navigate("/admin/StaffProfile");
    } else {
      navigate("/admin/Admin-Profile"); // fallback
    }
  };

  const handleLogout = () => {
    handleClose();
    Swal.fire({
      title: "Are you sure you want to logout?",
      text: "This will clear your session and local storage data.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, logout!",
      background: "#f8f9fa",
      borderRadius: "10px",
      showClass: {
        popup: `animate__animated animate__fadeInDown animate__faster`
      },
      hideClass: {
        popup: `animate__animated animate__fadeOutUp animate__faster`
      }
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogoutConfirm();
      }
    });
  };

  const handleLogoutConfirm = () => {
    logout(navigate); // Call shared logout logic
    showNotification("Logged out successfully", "success");
  };

  const showNotification = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setShowSnackbar(false);
  };

  return (
    <AppBar
      position="fixed"
      elevation={3}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "linear-gradient(90deg, #2980B9 0%, #3498db 100%)",
        transition: "all 0.3s ease",
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Left: Logo + Company Name */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Link
            to="/admin/combineDash"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Avatar
              src={logo}
              alt="Logo"
              sx={{
                marginRight: "10px",
                height: "38px",
                width: "38px",
                transition: "all 0.3s ease",
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            />
            <Typography
              variant="h6"
              noWrap
              sx={{
                color: "white",
                fontWeight: "bold",
                letterSpacing: "0.5px",
                textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
                position: "relative",
                "&:after": {
                  content: '""',
                  position: "absolute",
                  bottom: "-3px",
                  left: 0,
                  width: "0%",
                  height: "2px",
                  backgroundColor: "white",
                  transition: "width 0.3s ease"
                },
                "&:hover:after": {
                  width: "100%"
                }
              }}
            >
              Wayabroad
            </Typography>
          </Link>
        </Box>

        {/* Center: Welcome Message */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            padding: "5px 15px",
            borderRadius: "15px",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(5px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
          }}
        >
          <Fade in={true} timeout={800}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                color: "white",
                fontWeight: "600",
                textAlign: "center",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)"
                }
              }}
            >
              {displayName}
            </Typography>
          </Fade>
        </Box>

        {/* Right: Account Icon */}
        <Tooltip
          title="Account Menu"
          arrow
          TransitionProps={{ timeout: 600 }}
        >
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
            sx={{
              background: "rgba(255, 255, 255, 0.1)",
              transition: "all 0.2s ease",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.2)",
                transform: "scale(1.1)"
              }
            }}
          >
            <AccountCircle fontSize="large" />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {/* Menu for Profile/Logout */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        TransitionComponent={Fade}
        transitionDuration={300}
        sx={{
          "& .MuiPaper-root": {
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            mt: 1,
            "& .MuiMenuItem-root": {
              transition: "background-color 0.2s ease",
              py: 1.5,
              px: 2
            }
          }
        }}
      >
        <MenuItem 
          onClick={handleProfileClick}
          sx={{
            "&:hover": {
              backgroundColor: "rgba(41, 128, 185, 0.1)"
            }
          }}
        >
          Profile
        </MenuItem>
        <MenuItem 
          onClick={handleLogout}
          sx={{
            "&:hover": {
              backgroundColor: "rgba(211, 47, 47, 0.1)"
            }
          }}
        >
          Logout
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        TransitionComponent={Fade}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          variant="filled"
          elevation={6}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </AppBar>
  );
});

export default Header;

// import React, { useState, memo, useEffect } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import Swal from "sweetalert2";
// import {
//   AppBar,
//   Toolbar,
//   Typography,
//   IconButton,
//   Snackbar,
//   Alert,
//   Tooltip,
//   Avatar,
//   Box,
//   Fade,
//   Menu,
//   MenuItem,
//   Chip,
//   Badge,
//   Divider,
//   Popover,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Collapse
// } from "@mui/material";
// import AccountCircle from "@mui/icons-material/AccountCircle";
// import AppsIcon from "@mui/icons-material/Apps";
// import DashboardIcon from "@mui/icons-material/Dashboard";
// import PersonSearchIcon from "@mui/icons-material/PersonSearch";
// import AddHomeIcon from "@mui/icons-material/AddHome";
// import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
// import SwitchAccountIcon from "@mui/icons-material/SwitchAccount";
// import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
// import LocalShippingIcon from "@mui/icons-material/LocalShipping";
// import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
// import MenuBookIcon from "@mui/icons-material/MenuBook";
// import LanguageIcon from "@mui/icons-material/Language";
// import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
// import WorkIcon from "@mui/icons-material/Work";
// import ExpandLess from "@mui/icons-material/ExpandLess";
// import ExpandMore from "@mui/icons-material/ExpandMore";
// import ChevronRightIcon from "@mui/icons-material/ChevronRight";
// import logo from "../../assets/Images/Logo.jpg";
// import { logout } from "../Common/authUtils"; // Adjust path as needed

// const Header = memo(() => {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [systemsAnchorEl, setSystemsAnchorEl] = useState(null);
//   const [showSnackbar, setShowSnackbar] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState("");
//   const [snackbarSeverity, setSnackbarSeverity] = useState("info");
//   const [enabledSystems, setEnabledSystems] = useState([]);
//   const [activeSystem, setActiveSystem] = useState(null);
//   const [employeeSubsystemOpen, setEmployeeSubsystemOpen] = useState(false);
  
//   const role = sessionStorage.getItem("role");
//   const location = useLocation();
//   const navigate = useNavigate();
  
//   let displayName = "Guest Account";

//   if (role === "superAdmin") {
//     displayName = sessionStorage.getItem("instituteName") || "Admin";
//   } else if (role === "branch") {
//     displayName = sessionStorage.getItem("branchName") || "Branch";
//   } else if (role === "department") {
//     displayName = sessionStorage.getItem("departmentName") || "Department";
//   } else if (role === "staff") {
//     displayName = sessionStorage.getItem("staffName") || "Staff";
//   }

//   // Get enabled systems from sessionStorage and enhance with subsystem structure
//  useEffect(() => {
//   const role = sessionStorage.getItem("role");
//   const storedSystems = sessionStorage.getItem("enabledSystems");

//   if (role === "staff" && storedSystems) {
//     let parsedSystems = JSON.parse(storedSystems);

//     const hasEmployee = parsedSystems.some(sys => sys.name === "Employee Management Software" && sys.enabled);
//     const hasHRLead = parsedSystems.some(sys => sys.name === "hrLead");

//     // If both Employee and HR Lead are assigned
//     if (hasEmployee && hasHRLead) {
//       parsedSystems = parsedSystems.filter(sys => sys.name !== "hrLead");
//       const employeeSystem = parsedSystems.find(sys => sys.name === "Employee Management Software");

//       employeeSystem.subsystems = [
//         {
//           name: "HR Lead",
//           path: "/admin/hrLead",
//           icon: <WorkIcon />,
//           originalName: "hrLead"
//         }
//       ];
//     }

//     setEnabledSystems(parsedSystems);
//   }
// }, []);


//   // Determine active system based on current route
//   useEffect(() => {
//     const path = location.pathname;
    
//     // Map paths to system names
//     if (path.includes("/admin/inquiry")) {
//       setActiveSystem("Lead Management Software");
//     } else if (path.includes("/admin/admission")) {
//       setActiveSystem("Admission Management Software");
//     } else if (path.includes("/admin/Income&Expense")) {
//       setActiveSystem("Income/Expense Management Software");
//     } else if (path.includes("/admin/EmployeeSystem")) {
//       setActiveSystem("Employee Management Software");
//     } else if (path.includes("/admin/hrLead")) {
//       setActiveSystem("Employee Management Software"); // Map HR Lead to Employee system
//     } else if (path.includes("/admin/StudentSystem")) {
//       setActiveSystem("Student Management Software");
//     } else if (path.includes("/admin/ShipmentSystem")) {
//       setActiveSystem("shipment");
//     } else if (path.includes("/admin/PayrollSystem")) {
//       setActiveSystem("payroll");
//     } else if (path.includes("/admin/E-BookSystem")) {
//       setActiveSystem("ebook");
//     } else if (path.includes("/admin/websiteadmin")) {
//       setActiveSystem("website");
//     } else if (path.includes("/admin/HelpDesk")) {
//       setActiveSystem("helpdesk");
//     } else if (path.includes("/admin/dashboard") || path.includes("/admin/combineDash")) {
//       setActiveSystem("Dashboard Management System");
//     }
    
//     // Open Employee subsystem menu if we're on HR Lead route
//     if (path.includes("/admin/hrLead")) {
//       setEmployeeSubsystemOpen(true);
//     }
//   }, [location.pathname]);

//   // System icons mapping
//   const getSystemIcon = (systemName) => {
//     switch (systemName) {
//       case "Lead Management Software":
//         return <PersonSearchIcon />;
//       case "Admission Management Software":
//         return <AddHomeIcon />;
//       case "Income/Expense Management Software":
//         return <CurrencyRupeeIcon />;
//       case "Employee Management Software":
//         return <SwitchAccountIcon />;
//       case "Student Management Software":
//         return <EmojiPeopleIcon />;
//       case "shipment":
//         return <LocalShippingIcon />;
//       case "payroll":
//         return <AccountBalanceWalletIcon />;
//       case "ebook":
//         return <MenuBookIcon />;
//       case "website":
//         return <LanguageIcon />;
//       case "helpdesk":
//         return <HelpOutlineIcon />;
//       case "hrLead":
//         return <WorkIcon />;
//       case "Dashboard Management System":
//       default:
//         return <DashboardIcon />;
//     }
//   };

//   // System paths mapping
//   const getSystemPath = (systemName) => {
//     switch (systemName) {
//       case "Lead Management Software":
//         return "/admin/inquiry";
//       case "Admission Management Software":
//         return "/admin/admission";
//       case "Income/Expense Management Software":
//         return "/admin/Income&Expense";
//       case "Employee Management Software":
//         return "/admin/EmployeeSystem";
//       case "Student Management Software":
//         return "/admin/StudentSystem";
//       case "shipment":
//         return "/admin/ShipmentSystem";
//       case "payroll":
//         return "/admin/PayrollSystem";
//       case "ebook":
//         return "/admin/E-BookSystem";
//       case "website":
//         return "/admin/websiteadmin";
//       case "helpdesk":
//         return "/admin/HelpDesk";
//       case "hrLead":
//         return "/admin/hrLead"; 
//       case "Dashboard Management System":
//       default:
//         return "/admin/dashboard";
//     }
//   };

//   // Format system name for display
//   const formatSystemName = (systemName) => {
//     switch (systemName) {
//       case "shipment":
//         return "Shipment System";
//       case "payroll":
//         return "Payroll System";
//       case "ebook":
//         return "E-Book System";
//       case "website":
//         return "Website System";
//       case "helpdesk":
//         return "Help Desk";
//       case "hrLead":
//         return "HR Lead";
//       default:
//         return systemName;
//     }
//   };

//   const handleSystemClick = (systemName) => {
//     const path = getSystemPath(systemName);
//     navigate(path);
//     setSystemsAnchorEl(null);
//   };

//   const handleSubsystemClick = (path) => {
//     navigate(path);
//     setSystemsAnchorEl(null);
//   };

//   const handleSystemsMenu = (event) => {
//     setSystemsAnchorEl(event.currentTarget);
//   };

//   const handleSystemsClose = () => {
//     setSystemsAnchorEl(null);
//   };

//   const handleMenu = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   const handleProfileClick = () => {
//     handleClose();
//     // Route based on role
//     if (role === "superAdmin") {
//       navigate("/admin/Admin-Profile");
//     } else if (role === "branch") {
//       const branchId = sessionStorage.getItem("branchId"); // Get the branch ID from sessionStorage
//       navigate(`/admin/BranchProfile/${branchId}`); // Navigate to the branch profile with the ID
//     } else if (role === "department") {
//       navigate("/admin/DepartmentProfile");
//     } else if (role === "staff") {
//       navigate("/admin/StaffProfile");
//     } else {
//       navigate("/admin/Admin-Profile"); // fallback
//     }
//   };

//   const handleToggleEmployeeSubsystem = (e) => {
//     e.stopPropagation();
//     setEmployeeSubsystemOpen(!employeeSubsystemOpen);
//   };

//   const handleLogout = () => {
//     handleClose();
//     Swal.fire({
//       title: "Are you sure you want to logout?",
//       text: "This will clear your session and local storage data.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Yes, logout!",
//       background: "#f8f9fa",
//       borderRadius: "10px",
//       showClass: {
//         popup: `animate__animated animate__fadeInDown animate__faster`
//       },
//       hideClass: {
//         popup: `animate__animated animate__fadeOutUp animate__faster`
//       }
//     }).then((result) => {
//       if (result.isConfirmed) {
//         handleLogoutConfirm();
//       }
//     });
//   };

//   const handleLogoutConfirm = () => {
//     logout(navigate); // Call shared logout logic
//     showNotification("Logged out successfully", "success");
//   };

//   const showNotification = (message, severity = "info") => {
//     setSnackbarMessage(message);
//     setSnackbarSeverity(severity);
//     setShowSnackbar(true);
//   };

//   const handleSnackbarClose = (event, reason) => {
//     if (reason === "clickaway") return;
//     setShowSnackbar(false);
//   };

//   return (
//     <AppBar
//       position="fixed"
//       elevation={3}
//       sx={{
//         zIndex: (theme) => theme.zIndex.drawer + 1,
//         background: "linear-gradient(90deg, #2980B9 0%, #3498db 100%)",
//         transition: "all 0.3s ease",
//         '&:hover': {
//           boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
//         }
//       }}
//     >
//       <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         {/* Left: Logo + Company Name */}
//         <Box sx={{ display: "flex", alignItems: "center" }}>
//           <Link
//             to="/admin/combineDash"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               textDecoration: "none",
//               color: "inherit",
//             }}
//           >
//             <Avatar
//               src={logo}
//               alt="Logo"
//               sx={{
//                 marginRight: "10px",
//                 height: "38px",
//                 width: "38px",
//                 transition: "all 0.3s ease",
//                 '&:hover': {
//                   transform: 'scale(1.05)'
//                 }
//               }}
//             />
//             <Typography
//               variant="h6"
//               noWrap
//               sx={{
//                 color: "white",
//                 fontWeight: "bold",
//                 letterSpacing: "0.5px",
//                 textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
//                 position: "relative",
//                 "&:after": {
//                   content: '""',
//                   position: "absolute",
//                   bottom: "-3px",
//                   left: 0,
//                   width: "0%",
//                   height: "2px",
//                   backgroundColor: "white",
//                   transition: "width 0.3s ease"
//                 },
//                 "&:hover:after": {
//                   width: "100%"
//                 }
//               }}
//             >
//               PJSOFTTECH
//             </Typography>
//           </Link>
//         </Box>

//         {/* Center: Welcome Message */}
//         <Box
//           sx={{
//             position: "relative",
//             overflow: "hidden",
//             padding: "5px 15px",
//             borderRadius: "15px",
//             background: "rgba(255, 255, 255, 0.1)",
//             backdropFilter: "blur(5px)",
//             boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
//             display: "flex",
//             alignItems: "center"
//           }}
//         >
//           <Fade in={true} timeout={800}>
//             <Typography
//               variant="h6"
//               noWrap
//               sx={{
//                 color: "white",
//                 fontWeight: "600",
//                 textAlign: "center",
//                 transition: "all 0.3s ease",
//                 "&:hover": {
//                   transform: "translateY(-2px)"
//                 }
//               }}
//             >
//               {displayName}
//             </Typography>
//           </Fade>
//         </Box>

//         {/* Right: System switcher for staff + Profile Icon */}
//         <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//           {/* System switcher (only for staff) */}
//           {role === "staff" && enabledSystems.length > 0 && (
//             <>
//               <Tooltip title="Switch Systems" arrow>
//                 <IconButton
//                   color="inherit"
//                   onClick={handleSystemsMenu}
//                   sx={{
//                     background: "rgba(255, 255, 255, 0.1)",
//                     transition: "all 0.2s ease",
//                     "&:hover": {
//                       background: "rgba(255, 255, 255, 0.2)",
//                       transform: "scale(1.1)"
//                     }
//                   }}
//                 >
//                   <Badge
//                     badgeContent={enabledSystems.length}
//                     color="error"
//                     sx={{
//                       "& .MuiBadge-badge": {
//                         fontSize: "10px",
//                         height: "18px",
//                         minWidth: "18px"
//                       }
//                     }}
//                   >
//                     <AppsIcon />
//                   </Badge>
//                 </IconButton>
//               </Tooltip>

//               <Popover
//                 id="systems-menu"
//                 open={Boolean(systemsAnchorEl)}
//                 anchorEl={systemsAnchorEl}
//                 onClose={handleSystemsClose}
//                 anchorOrigin={{
//                   vertical: "bottom",
//                   horizontal: "center",
//                 }}
//                 transformOrigin={{
//                   vertical: "top",
//                   horizontal: "center",
//                 }}
//                 TransitionComponent={Fade}
//                 transitionDuration={250}
//                 PaperProps={{
//                   sx: {
//                     mt: 1.5,
//                     borderRadius: "12px",
//                     boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
//                     width: "320px",
//                     overflow: "hidden"
//                   }
//                 }}
//               >
//                 <Box sx={{ p: 2 }}>
//                   <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
//                     Assigned Systems
//                   </Typography>
//                   <Divider sx={{ mb: 2 }} />
//                   <List dense disablePadding>
//                     {enabledSystems.map((system) => (
//                       <React.Fragment key={system.name}>
//                         <ListItem
//                           button
//                          onClick={() => {
//   if (system.name === "Employee Management Software") {
//     handleToggleEmployeeSubsystem();
//   } else {
//     handleSystemClick(system.name);
//   }
// }}

//                           sx={{
//                             borderRadius: "8px",
//                             mb: 1,
//                             backgroundColor: activeSystem === system.name ? "rgba(25, 118, 210, 0.08)" : "transparent",
//                             border: activeSystem === system.name ? "1px solid rgba(25, 118, 210, 0.5)" : "1px solid rgba(0, 0, 0, 0.12)",
//                             transition: "all 0.2s ease",
//                             "&:hover": {
//                               backgroundColor: activeSystem === system.name ? "rgba(25, 118, 210, 0.12)" : "rgba(0, 0, 0, 0.04)",
//                               transform: "translateY(-2px)",
//                               boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
//                             }
//                           }}
//                         >
//                           <ListItemIcon 
//                             sx={{ 
//                               color: activeSystem === system.name ? "primary.main" : "action.active",
//                               minWidth: "40px"
//                             }}
//                           >
//                             {getSystemIcon(system.name)}
//                           </ListItemIcon>
//                           <ListItemText 
//                             primary={formatSystemName(system.name)} 
//                             sx={{ 
//                               '& .MuiListItemText-primary': {
//                                 fontWeight: activeSystem === system.name ? "bold" : "normal",
//                                 color: activeSystem === system.name ? "primary.main" : "text.primary",
//                               }
//                             }}
//                           />
//                           {system.subsystems && (
//                             <IconButton 
//                               edge="end" 
//                               size="small" 
//                               onClick={handleToggleEmployeeSubsystem}
//                               sx={{ ml: 1 }}
//                             >
//                               {employeeSubsystemOpen ? <ExpandLess /> : <ExpandMore />}
//                             </IconButton>
//                           )}
//                         </ListItem>
                        
//                         {/* Subsystems (HR Lead under Employee System) */}
//                         {system.subsystems && (
//                           <Collapse in={employeeSubsystemOpen} timeout="auto" unmountOnExit>
//                             <List component="div" disablePadding>
//                               {system.subsystems.map(subsystem => (
//                                 <ListItem 
//                                   key={subsystem.name} 
//                                   button
//                                   onClick={() => handleSubsystemClick(subsystem.path)}
//                                   sx={{
//                                     pl: 4,
//                                     ml: 3,
//                                     borderRadius: "8px",
//                                     mb: 1,
//                                     backgroundColor: location.pathname.includes(subsystem.path) ? "rgba(25, 118, 210, 0.08)" : "transparent",
//                                     border: location.pathname.includes(subsystem.path) ? "1px solid rgba(25, 118, 210, 0.5)" : "1px solid rgba(0, 0, 0, 0.12)",
//                                     transition: "all 0.2s ease",
//                                     "&:hover": {
//                                       backgroundColor: location.pathname.includes(subsystem.path) ? "rgba(25, 118, 210, 0.12)" : "rgba(0, 0, 0, 0.04)",
//                                       transform: "translateY(-2px)"
//                                     }
//                                   }}
//                                 >
//                                   <ListItemIcon 
//                                     sx={{ 
//                                       color: location.pathname.includes(subsystem.path) ? "primary.main" : "action.active",
//                                       minWidth: "30px"
//                                     }}
//                                   >
//                                     <ChevronRightIcon fontSize="small" />
//                                   </ListItemIcon>
//                                   <ListItemText 
//                                     primary={subsystem.name} 
//                                     sx={{ 
//                                       '& .MuiListItemText-primary': {
//                                         fontWeight: location.pathname.includes(subsystem.path) ? "bold" : "normal",
//                                         color: location.pathname.includes(subsystem.path) ? "primary.main" : "text.primary",
//                                         fontSize: "0.875rem"
//                                       }
//                                     }}
//                                   />
//                                 </ListItem>
//                               ))}
//                             </List>
//                           </Collapse>
//                         )}
//                       </React.Fragment>
//                     ))}
//                   </List>
//                 </Box>
//               </Popover>
//             </>
//           )}

//           {/* Profile Icon */}
//           <Tooltip
//             title="Account Settings"
//             arrow
//             TransitionProps={{ timeout: 600 }}
//           >
//             <IconButton
//               size="large"
//               aria-label="account of current user"
//               aria-controls="menu-appbar"
//               aria-haspopup="true"
//               onClick={handleMenu}
//               color="inherit"
//               sx={{
//                 background: "rgba(255, 255, 255, 0.1)",
//                 transition: "all 0.2s ease",
//                 "&:hover": {
//                   background: "rgba(255, 255, 255, 0.2)",
//                   transform: "scale(1.1)"
//                 }
//               }}
//             >
//               <AccountCircle fontSize="large" />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       </Toolbar>

//       {/* Menu for Profile/Logout */}
//         <Menu
//           id="menu-appbar"
//           anchorEl={anchorEl}
//           anchorOrigin={{
//             vertical: "bottom",
//             horizontal: "right",
//           }}
//           keepMounted
//           transformOrigin={{
//             vertical: "top",
//             horizontal: "right",
//           }}
//           open={Boolean(anchorEl)}
//           onClose={handleClose}
//           TransitionComponent={Fade}
//           transitionDuration={300}
//           sx={{
//             "& .MuiPaper-root": {
//           borderRadius: "10px",
//           boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
//           mt: 1,
//           "& .MuiMenuItem-root": {
//             transition: "background-color 0.2s ease",
//             py: 1.5,
//             px: 2
//           }
//             }
//           }}
//         >
//           <MenuItem 
//             onClick={() => {
//           handleClose();
//           navigate("Profile"); // Navigate to profile component
//             }}
//             sx={{
//           "&:hover": {
//             backgroundColor: "rgba(41, 128, 185, 0.1)"
//           }
//             }}
//           >
//             Profile
//           </MenuItem>
//           <MenuItem 
//             onClick={handleLogout}
//             sx={{
//           "&:hover": {
//             backgroundColor: "rgba(211, 47, 47, 0.1)"
//           }
//             }}
//           >
//             Logout
//           </MenuItem>
//         </Menu>

//         {/* Snackbar for notifications */}
//       <Snackbar
//         open={showSnackbar}
//         autoHideDuration={4000}
//         onClose={handleSnackbarClose}
//         TransitionComponent={Fade}
//         anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
//       >
//         <Alert 
//           onClose={handleSnackbarClose} 
//           severity={snackbarSeverity}
//           variant="filled"
//           elevation={6}
//           sx={{ width: "100%" }}
//         >
//           {snackbarMessage}
//         </Alert>
//       </Snackbar>
//     </AppBar>
//   );
// });

// export default Header;