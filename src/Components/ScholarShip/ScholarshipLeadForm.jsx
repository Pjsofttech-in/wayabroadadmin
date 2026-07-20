import React, { useEffect, useState } from "react";
import {
  Grid,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  MenuItem,
  CircularProgress,
} from "@mui/material";

import LoadingOverlay from "../Common/LoadingOverlay";
import AlertService from "../Common/AlertService";
import "../Common/Design.css";

import {
  createScholarshipLead,
  getAllStudyLocations,
  getAllScholarshipFor,
  getAllScholarshipTypes,
} from "./ScholarShipServices.js";

const ScholarshipLeadForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    location: "",
    scholarshipFor: "",
    scholarshipType: "",
  });

  const [studyLocations, setStudyLocations] = useState([]);
  const [scholarshipForList, setScholarshipForList] = useState([]);
  const [scholarshipTypes, setScholarshipTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ================== FETCH DROPDOWN DATA ==================
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);

        const [locationsData, scholarshipForData, scholarshipTypesData] =
          await Promise.all([
            getAllStudyLocations(),
            getAllScholarshipFor(),
            getAllScholarshipTypes(),
          ]);

        setStudyLocations(locationsData || []);
        setScholarshipForList(scholarshipForData || []);
        setScholarshipTypes(scholarshipTypesData || []);
      } catch (error) {
        console.error("Dropdown Fetch Error:", error);
        AlertService.error("Failed to load dropdown data!");
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  // ================== HANDLE CHANGE ==================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================== SUBMIT FORM ==================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const role = sessionStorage.getItem("role") || "staff";
      const email = sessionStorage.getItem("email") || "";
      const branchCode = sessionStorage.getItem("branchCode") || "";

      const payload = {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        location: formData.location,
        scholarshipFor: formData.scholarshipFor,
        scholarshipType: formData.scholarshipType,

        // extra fields backend may need
        branchCode: branchCode,
        role: role,
        createdByEmail: email,
      };

      await createScholarshipLead(payload);

      AlertService.success("Scholarship Lead Submitted Successfully!");

      setFormData({
        name: "",
        mobileNumber: "",
        email: "",
        location: "",
        scholarshipFor: "",
        scholarshipType: "",
      });
    } catch (error) {
      console.error("Submit Error:", error);
      AlertService.error(error.message || "Failed to submit Scholarship Lead!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <LoadingOverlay loading={loading || isSubmitting} />

      <Paper elevation={3} sx={{ p: 4, borderRadius: "12px" }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", mb: 3, textAlign: "center" }}
        >
          Scholarship Lead Form
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Name */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Mobile */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Mobile Number"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
                inputProps={{
                  maxLength: 10,
                  pattern: "[0-9]{10}",
                  title: "Enter valid 10-digit mobile number",
                }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Study Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Location
                </MenuItem>

                {studyLocations.map((loc) => {
                  const value =
                    typeof loc === "string"
                      ? loc
                      : loc.locationName || loc.name || JSON.stringify(loc);

                  const label =
                    typeof loc === "string"
                      ? loc
                      : loc.locationName || loc.name || "Unnamed Location";

                  return (
                    <MenuItem key={loc.id || value} value={value}>
                      {label}
                    </MenuItem>
                  );
                })}

                {studyLocations.length === 0 && (
                  <MenuItem disabled>No Locations Available</MenuItem>
                )}
              </TextField>
            </Grid>

            {/* Scholarship For */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Scholarship For"
                name="scholarshipFor"
                value={formData.scholarshipFor}
                onChange={handleChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Scholarship For
                </MenuItem>

                {scholarshipForList.map((item) => {
                  const value =
                    typeof item === "string"
                      ? item
                      : item.scholarshipForName ||
                        item.name ||
                        JSON.stringify(item);

                  const label =
                    typeof item === "string"
                      ? item
                      : item.scholarshipForName || item.name || "Unnamed";

                  return (
                    <MenuItem key={item.id || value} value={value}>
                      {label}
                    </MenuItem>
                  );
                })}

                {scholarshipForList.length === 0 && (
                  <MenuItem disabled>No Scholarship For Available</MenuItem>
                )}
              </TextField>
            </Grid>

            {/* Scholarship Type */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Scholarship Type"
                name="scholarshipType"
                value={formData.scholarshipType}
                onChange={handleChange}
                required
              >
                <MenuItem value="" disabled>
                  Select Scholarship Type
                </MenuItem>

                {scholarshipTypes.map((type) => {
                  const value =
                    typeof type === "string"
                      ? type
                      : type.scholarshipTypeName ||
                        type.name ||
                        JSON.stringify(type);

                  const label =
                    typeof type === "string"
                      ? type
                      : type.scholarshipTypeName || type.name || "Unnamed Type";

                  return (
                    <MenuItem key={type.id || value} value={value}>
                      {label}
                    </MenuItem>
                  );
                })}

                {scholarshipTypes.length === 0 && (
                  <MenuItem disabled>No Scholarship Types Available</MenuItem>
                )}
              </TextField>
            </Grid>
          </Grid>

          {/* Submit Button */}
          <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              sx={{ px: 5 }}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={22} color="inherit" />
                ) : null
              }
            >
              {isSubmitting ? "Submitting..." : "Submit Lead"}
            </Button>
          </Box>
        </form>
      </Paper>
    </div>
  );
};

export default ScholarshipLeadForm;
