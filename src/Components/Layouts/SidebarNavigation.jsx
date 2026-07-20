// src/config/navigationConfig.js
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AddHomeIcon from "@mui/icons-material/AddHome";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import SwitchAccountIcon from "@mui/icons-material/SwitchAccount";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LanguageIcon from "@mui/icons-material/Language";
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import HubIcon from "@mui/icons-material/Hub";
import GridViewIcon from "@mui/icons-material/GridView";
import GroupIcon from "@mui/icons-material/Group";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArticleIcon from '@mui/icons-material/Article';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';


export const NAVIGATION = [
    {
      title: "Main Dashboard",
      segment: "/wayabroadadmin/admin/dashboard",
      icon: <DashboardIcon />,
      description: "View main dashboard",
      roles: ["superAdmin", "branch"],
    },
    {
      title: "Inquiry Management",
      segment: "/wayabroadadmin/admin/abroadinquiry",
      icon: <PersonSearchIcon />,
      description: "Manage inquiries",
      system: "Lead Management Software", 
      roles: ["superAdmin", "branch",  "staff"],
    },
    {
      title: "Application Management",
      segment: "/wayabroadadmin/admin/application/dashboard",
      icon: <AddHomeIcon />,
      description: "Manage Application",
      system: "Application Management Software", 
      roles: ["superAdmin", "branch",  "staff"],
    },
    {
      title: "Registration Management",
      segment: "/wayabroadadmin/admin/registration",
      icon: <ReceiptLongIcon />,
      description: "Manage Registration",
      system: "Registration Management Software", 
      roles: ["superAdmin", "branch",  "staff"],
    },
    // {
    //   title: "Contact Us",
    //   segment: "/wayabroadadmin/admin/ContactUs",
    //   icon: <HelpOutlineIcon />,
    //   description: "Manage Contact Us",
    //   system: "Contact Us Management Software", 
    //   roles: ["superAdmin", "branch"],
    // },
    {
      title: "Marketing",
      segment: "/wayabroadadmin/admin/Marketing",
      icon: <WorkOutlineIcon />,
      description: "Marketing Management",
      system: "Marketing Management System",
      roles: ["superAdmin"],
    },
    {
      title: "Income & Expense",
      segment: "/wayabroadadmin/admin/incomeexpense",
      icon: <CurrencyRupeeIcon />,
      description: "Income & Expense",
      system: "Income/Expense Management Software", 
      roles: ["superAdmin", "branch",  "staff"],
    },
    {
      title: "Branch",
      segment: "/wayabroadadmin/admin/CreateBranch",
      icon: <HubIcon />,
      description: "Create Branch",
      roles: ["superAdmin"],
    },
    // {
    //   title: "Staff",
    //   segment: "/wayabroadadmin/admin/CreateStaff",
    //   icon: <GroupIcon />,
    //   description: "Create Staff",
    //   roles: ["superAdmin"],
    // },
    {
      title: "Partner Details",
      segment: "/wayabroadadmin/admin/partner",
      icon: <HelpOutlineIcon />,
      description: "Partner Details",
      roles: ["superAdmin"],
    },
     {
      title: "Blog Management",
      segment: "/wayabroadadmin/admin/blog",
      icon: <ArticleIcon />,
      description: "Manage Blog Content",
      system: "Blog Management System",
      roles: ["superAdmin"],
    },
     {
      title: "Course Finder",
      segment: "/wayabroadadmin/admin/CourceFinder ",
      icon: <SchoolIcon />,
      description: "Course Finder",
      roles: ["superAdmin","branch","staff"],
    },
     {
      title: "Courses",
      segment: "/wayabroadadmin/admin/courses",
      icon: <MenuBookIcon />,
      description: "Manage Courses",
      roles: ["superAdmin"],
    },
    {
      title: "Scholarship",
      segment: "/wayabroadadmin/admin/scholarship",
      icon: <SchoolIcon />,
      description: "Manage Scholarship",
      roles: ["superAdmin"],
    },
    {
      title: "Settings",
      segment: "/wayabroadadmin/admin/settings",
      icon: <SettingsIcon />,
      description: "System Settings",
      roles: ["superAdmin"],
    },
  ];