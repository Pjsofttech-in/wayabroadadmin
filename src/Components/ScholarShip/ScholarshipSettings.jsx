import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AlertService from "../Common/AlertService";

import {
  Public as LocationIcon,
  School as ScholarshipForIcon,
  Category as TypeIcon,
  ListAlt as CategoryIcon,
} from "@mui/icons-material";

// ✅ Import APIs
import {
  createScholarshipCategory,
  getAllScholarshipCategories,
  deleteScholarshipCategory,
  updateScholarshipCategory,
} from "./ScholarshipCategoryService";

import {
  createScholarshipFor,
  getAllScholarshipFor,
  deleteScholarshipFor,
  updateScholarshipFor,
} from "./ScholarshipForService";

import {
  createScholarshipType,
  getAllScholarshipType,
  deleteScholarshipType,
  updateScholarshipType,
} from "./ScholarshipTypeService";

import {
  createStudyLocation,
  getAllStudyLocations,
  deleteStudyLocation,
  updateStudyLocation,
} from "./StudyLocationService";

// Sidebar Items
const menuItems = [
  { id: "studyLocation", label: "Study Location", icon: <LocationIcon /> },
  {
    id: "scholarshipFor",
    label: "Scholarship For",
    icon: <ScholarshipForIcon />,
  },
  { id: "scholarshipType", label: "Scholarship Type", icon: <TypeIcon /> },
  { id: "category", label: "Category", icon: <CategoryIcon /> },
];

const Sidebar = ({ selectedComponent, onSelect, isCollapsed }) => (
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
          backgroundColor:
            selectedComponent === item.id ? "white" : "transparent",
          boxShadow:
            selectedComponent === item.id
              ? "0px 4px 10px rgba(0, 0, 0, 0.2)"
              : "none",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
          "&:hover": {
            backgroundColor:
              selectedComponent === item.id
                ? "white"
                : "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        {item.icon} {!isCollapsed && item.label}
      </Typography>
    ))}
  </Paper>
);

const ScholarshipSettings = () => {
  const [activeTab, setActiveTab] = useState("studyLocation");
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState("");

  // 🔥 Dynamic functions based on tab
  const getFunctions = () => {
    switch (activeTab) {
      case "studyLocation":
        return {
          title: "Study Location Management",
          buttonText: "ADD STUDY LOCATION",
          modalTitle: "Add New Study Location",
          inputLabel: "Study Location Name",
          getAll: getAllStudyLocations,
          create: createStudyLocation,
          remove: deleteStudyLocation,
          update: updateStudyLocation,
        };

      case "scholarshipFor":
        return {
          title: "Scholarship For Management",
          buttonText: "ADD SCHOLARSHIP FOR",
          modalTitle: "Add New Scholarship For",
          inputLabel: "Scholarship For Name",
          getAll: getAllScholarshipFor,
          create: createScholarshipFor,
          remove: deleteScholarshipFor,
          update: updateScholarshipFor,
        };

      case "scholarshipType":
        return {
          title: "Scholarship Type Management",
          buttonText: "ADD SCHOLARSHIP TYPE",
          modalTitle: "Add New Scholarship Type",
          inputLabel: "Scholarship Type Name",
          getAll: getAllScholarshipType,
          create: createScholarshipType,
          remove: deleteScholarshipType,
          update: updateScholarshipType,
        };

      case "category":
        return {
          title: "Category Management",
          buttonText: "ADD CATEGORY",
          modalTitle: "Add New Category",
          inputLabel: "Category Name",
          getAll: getAllScholarshipCategories,
          create: createScholarshipCategory,
          remove: deleteScholarshipCategory,
          update: updateScholarshipCategory,
        };

      default:
        return {};
    }
  };

  const current = getFunctions();

  // ✅ Fetch list
  const fetchData = async () => {
    try {
      const res = await current.getAll();
      setData(res || []);
    } catch (error) {
      console.log("Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // ✅ Open modal for Add
  const handleAddClick = () => {
    setName("");
    setOpenModal(true);
  };

  // ✅ Save Add
  const handleModalSave = async () => {
    if (!name.trim()) return alert("Name is required!");

    try {
      await current.create({ name });

      setOpenModal(false);
      setName("");
      fetchData();
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save!");
    }
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await current.remove(id);
      fetchData();
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Failed to delete!");
    }
  };

  // ✅ Filtered data based on search
  const filteredData = data.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: "flex", minHeight: "50%", height: "auto" }}>
      {/* LEFT SIDEBAR */}
      <Box
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <Sidebar
          selectedComponent={activeTab}
          onSelect={(item) => setActiveTab(item.id)}
          isCollapsed={isCollapsed}
        />
      </Box>

      {/* RIGHT CONTENT */}
      <Box
        sx={{
          flexGrow: 1,
          padding: 2,
          marginLeft: 2,
          border: "1px solid #ddd",
          borderRadius: 2,
          backgroundColor: "#fff",
          minHeight: "400px",
        }}
      >
        {/* HEADER */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          {current.title}
        </Typography>

        {/* SEARCH + TOTAL + ADD BUTTON */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              placeholder="Search..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 300 }}
            />

            <Typography sx={{ fontWeight: 500 }}>
              Total: {filteredData.length}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: "#0B5394",
              fontWeight: 600,
              borderRadius: 2,
              px: 2,
            }}
            onClick={handleAddClick}
          >
            {current.buttonText}
          </Button>
        </Box>

        {/* TABLE */}
        <Box sx={{ border: "1px solid #ddd", borderRadius: 2 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f5f5f5" }}>
              <tr>
                <th style={thStyle}>SR NO</th>
                <th style={thStyle}>NAME</th>
                <th style={thStyle}>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", padding: 30 }}>
                    No data
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id}>
                    {/* ✅ SERIAL NUMBER */}
                    <td style={tdStyle}>{index + 1}</td>

                    <td style={tdStyle}>{item.name}</td>

                    <td style={tdStyle}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>

        {/* MODAL */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>
            {current.modalTitle}
          </DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              label={current.inputLabel}
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleModalSave()}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleModalSave}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

// styles
const thStyle = {
  padding: "12px",
  textAlign: "left",
  fontSize: "14px",
  fontWeight: 600,
};

const tdStyle = {
  padding: "12px",
  borderTop: "1px solid #ddd",
  fontSize: "14px",
};

export default ScholarshipSettings;
