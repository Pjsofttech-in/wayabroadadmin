import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Avatar,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Slide,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LoadingOverlay from "../Common/LoadingOverlay";
import AlertService from "../Common/AlertService";
import { deleteAdmissionForm, updateAdmissionForm } from "./AbroadApplicationService";
import axiosinstance from "../Common/axiosConfig";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

// Reusable EditableField component
const EditableField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  isEditing, 
  type = 'text',
  select = false,
  options = [],
  fullWidth = true,
  required = false
}) => {
  if (isEditing) {
    if (select) {
      return (
        <FormControl fullWidth={fullWidth} size="small" required={required}>
          <InputLabel>{label}</InputLabel>
          <Select
            name={name}
            value={value || ''}
            onChange={onChange}
            label={label}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    
    return (
      <TextField
        name={name}
        label={label}
        value={value || ''}
        onChange={onChange}
        type={type}
        fullWidth={fullWidth}
        size="small"
        margin="normal"
        variant="outlined"
        required={required}
      />
    );
  }
  
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2">{value || '-'}</Typography>
    </Box>
  );
};

// Transition animation for full-screen dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ApplicationEditDialog = ({ open, onClose, application, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});

  useEffect(() => {
    if (application) {
      setFormData(application);
      setInitialData(application);
    }
  }, [application]);

  if (!application) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    const newValue = type === 'number' ? parseInt(value, 10) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const handleRemoveDocument = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const userRole = sessionStorage.getItem("role") || "admin";
      const userEmail = sessionStorage.getItem("email") || "";
      
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Separate files from regular data
      const regularData = {};
      const fileFields = [
        'sop', 'sop2', 'lors', 'resume', 'testScores',
        'passportCopy', 'passportInHandPhoto', 'studentVisa', 'passportPhotos',
        'tenthDigitalMarksheet', 'twelfthDigitalMarksheet', 'degreeMarkList',
        'transcripts', 'bonafideCertificate', 'moiCertificate',
        'moiWithSealAndSign', 'workOrInternshipExperienceCertificate',
        'fatherPanCard', 'fatherITR1', 'fatherITR2', 'fatherITR3',
        'fatherBankStatement', 'bankBalanceCertificate', 'parentsIDProof', 'bankStatement'
      ];
      
      Object.keys(formData).forEach(key => {
        if (fileFields.includes(key) && formData[key] instanceof File) {
          // Append new file uploads
          formDataToSend.append(key, formData[key]);
        } else if (!fileFields.includes(key)) {
          // Regular fields
          regularData[key] = formData[key];
        }
      });
      
      // Append regular data as JSON blob
      formDataToSend.append('form', new Blob([JSON.stringify(regularData)], { type: 'application/json' }));
      
      const queryParams = new URLSearchParams();
      queryParams.append('role', userRole);
      queryParams.append('email', userEmail);
      
      const response = await axiosinstance.put(
        `/admissionForms/update/${application.id}?${queryParams.toString()}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      AlertService.success("Application updated successfully");
      setIsEditing(false);
      
      // Update with response data
      if (response.data) {
        setFormData(response.data);
        setInitialData(response.data);
        if (onEdit) onEdit(response.data);
      }
    } catch (error) {
      console.error("Update error:", error);
      AlertService.error(
        error.response?.data?.message || "Failed to update application"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      const confirmed = await AlertService.confirm(
        "Are you sure you want to delete this application? This action cannot be undone."
      );
      if (!confirmed) return;

      setLoading(true);
      const userRole = sessionStorage.getItem("role") || "admin";
      const userEmail = sessionStorage.getItem("email") || "";

      await deleteAdmissionForm(application.id, userRole, userEmail);

      AlertService.success("Application deleted successfully");
      if (onDelete) onDelete(application.id);
      onClose();
    } catch (error) {
      console.error("Delete error:", error);
      AlertService.error(
        error.response?.data?.message || "Failed to delete application"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: { bgcolor: "#f9fafb" },
      }}
    >
      <LoadingOverlay loading={loading} />

      {/* Top App Bar */}
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: "white", color: "black" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={onClose} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">
              Back to List
            </Typography>
          </Box>

          <Box>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  sx={{ borderRadius: 2, mr: 1 }}
                  disabled={loading}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleCancel}
                  sx={{ borderRadius: 2, mr: 1 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                sx={{ borderRadius: 2, mr: 1 }}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              sx={{ borderRadius: 2 }}
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </Box>
        </Toolbar>

        {/* Tabs under top bar */}
        <Box sx={{ borderTop: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
          <Tabs
            value={activeTab}
            onChange={(e, newVal) => setActiveTab(newVal)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
          >
            <Tab label="Personal Details" />
            <Tab label="Documents" />
          </Tabs>
        </Box>
      </AppBar>

      {/* Dialog Content */}
      <Box sx={{ p: 3, overflowY: "auto", height: "100%" }}>
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Left Column (Photo + Quick Info) */}
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 3, textAlign: "center", borderRadius: 3, height: '100%' }}>
                <Avatar
                  src="/default-profile.jpg"
                  sx={{ width: 120, height: 120, mx: "auto", mb: 3 }}
                />
                <EditableField
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  isEditing={isEditing}
                  required
                />
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => window.open(`mailto:${application.email}`)}
                    sx={{ minWidth: 'auto', p: 1 }}
                    title="Email"
                  >
                    <EmailIcon fontSize="small" />
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => window.open(`https://wa.me/${application.phone?.replace(/\D/g, '')}`)}
                    sx={{ minWidth: 'auto', p: 1, bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
                    title="WhatsApp"
                  >
                    <WhatsAppIcon fontSize="small" />
                  </Button>
                </Box>
                
                <Box sx={{ textAlign: 'left', mt: 2, '& > div': { mb: 2 } }}>
                  <EditableField
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isEditing={isEditing}
                    type="email"
                    required
                  />
                  <EditableField
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    isEditing={isEditing}
                    type="tel"
                    required
                  />
                  <EditableField
                    label="Alternate Phone"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    isEditing={isEditing}
                    type="tel"
                  />
                </Box>
                
                <Box mt={2}>
                  <EditableField
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    isEditing={isEditing}
                    select
                    options={[
                      { value: 'applied', label: 'Applied' },
                      { value: 'visa_accepted', label: 'Visa Accepted' },
                      { value: 'visa_rejected', label: 'Visa Rejected' },
                      { value: 'passport_issued', label: 'Passport Issued' },
                      { value: 'passport_rejected', label: 'Passport Rejected' },
                      { value: 'doc_incomplete', label: 'Doc Incomplete' },
                      { value: 'app_proceed', label: 'App Proceed' },
                      { value: 'adm_completed', label: 'Adm Completed' },
                    ]}
                  />
                </Box>
              </Card>
            </Grid>

            {/* Right Column (Details) */}
            <Grid item xs={12} md={9}>
              {/* Additional Information */}
              {/* <Card sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Additional Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}> */}
                    {/* Add other information fields here */}
                  {/* </Grid>
                </CardContent>
              </Card> */}

              {/* Academic Info */}
              <Card sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Academic Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <EditableField
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        isEditing={isEditing}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <EditableField
                        label="University"
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        isEditing={isEditing}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <EditableField
                        label="Course"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        isEditing={isEditing}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <EditableField
                        label="Stream"
                        name="stream"
                        value={formData.stream}
                        onChange={handleChange}
                        isEditing={isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <EditableField
                        label="Passout Year"
                        name="passoutYear"
                        value={formData.passoutYear}
                        onChange={handleChange}
                        isEditing={isEditing}
                        type="text"
                      />
                    </Grid>
                     <Grid item xs={12} md={6}>
                        <EditableField
                          label="Passed Course"
                          name="passedCourse"
                          value={formData.passedCourse}
                          onChange={handleChange}
                          isEditing={isEditing}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <EditableField
                          label="Percentage"
                          name="percentage"
                          value={formData.percentage}
                          onChange={handleChange}
                          isEditing={isEditing}
                          type="number"
                        />
                      </Grid>
                       <Grid item xs={12} md={6}>
                        <EditableField
                          label="Gap in Education"
                          name="gapInEducation"
                          value={formData.gapInEducation}
                          onChange={handleChange}
                          isEditing={isEditing}
                        />
                      </Grid>
                    <Grid item xs={12} md={4}>
                      <EditableField
                        label="Intake"
                        name="intake"
                        value={formData.intake}
                        onChange={handleChange}
                        isEditing={isEditing}
                        select
                        options={[
                          { value: 'fall', label: 'Fall' },
                          { value: 'spring', label: 'Spring' },
                          { value: 'summer', label: 'Summer' },
                          { value: 'winter', label: 'Winter' }
                        ]}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
                          {/* Address Information Section */}
              <Card sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Address Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <EditableField
                      label="House Number"
                      name="houseNumber"
                      value={formData.houseNumber}
                      onChange={handleChange}
                      isEditing={isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <EditableField
                      label="Street Name"
                      name="streetName"
                      value={formData.streetName}
                      onChange={handleChange}
                      isEditing={isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <EditableField
                      label="Landmark"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      isEditing={isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <EditableField
                      label="Pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      isEditing={isEditing}
                    />
                  </Grid>
                </Grid>
              </Card>
              {/* Family Information Section */}
              <Card sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Family Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <EditableField
                      label="Father's Occupation"
                      name="fatherOccupation"
                      value={formData.fatherOccupation}
                      onChange={handleChange}
                      isEditing={isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <EditableField
                      label="Father's Income"
                      name="fatherIncome"
                      value={formData.fatherIncome}
                      onChange={handleChange}
                      isEditing={isEditing}
                      type="number"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <EditableField
                      label="Father's Phone"
                      name="fatherPhone"
                      value={formData.fatherPhone}
                      onChange={handleChange}
                      isEditing={isEditing}
                      type="tel"
                    />
                  </Grid>
                </Grid>
              </Card>

            </Grid>
          </Grid>
        )}

        {/* Documents Tab */}
        {activeTab === 1 && (
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: 3,
                backgroundColor: "#fff",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  color: "#4a148c",
                }}
              >
                Uploaded Documents
              </Typography>

              <Grid container spacing={3}>
                {[
                  // Application Documents
                  { key: "sop", label: "Statement of Purpose (SOP) - 1" },
                  { key: "sop2", label: "Statement of Purpose (SOP) - 2" },
                  { key: "lors", label: "Letters of Recommendation (LORs)" },
                  { key: "resume", label: "Resume/CV" },
                  { key: "testScores", label: "Test Scores (IELTS/TOEFL/GRE/GMAT)" },
                  
                  // Passport & Visa
                  { key: "passportCopy", label: "Passport Copy (All Pages)" },
                  { key: "passportInHandPhoto", label: "Passport in Hand Photo" },
                  { key: "studentVisa", label: "Student Visa" },
                  { key: "passportPhotos", label: "Passport Size Photos (2' x 2')" },
                  
                  // Academic Documents
                  { key: "tenthDigitalMarksheet", label: "10th Digital Marksheet" },
                  { key: "twelfthDigitalMarksheet", label: "12th Digital Marksheet" },
                  { key: "degreeMarkList", label: "Degree Mark List" },
                  { key: "transcripts", label: "Transcripts" },
                  { key: "bonafideCertificate", label: "Bonafide Certificate" },
                  
                  // MOI Documents
                  { key: "moiCertificate", label: "MOI Certificate" },
                  { key: "moiWithSealAndSign", label: "MOI with Seal and Sign" },
                  { key: "workOrInternshipExperienceCertificate", label: "Work/Internship Experience Certificate" },
                  
                  // Financial Documents
                  { key: "fatherPanCard", label: "Father's PAN Card" },
                  { key: "fatherITR1", label: "Father's ITR 1" },
                  { key: "fatherITR2", label: "Father's ITR 2" },
                  { key: "fatherITR3", label: "Father's ITR 3" },
                  { key: "fatherBankStatement", label: "Father's Bank Statement (6 months)" },
                  { key: "bankBalanceCertificate", label: "Bank Balance Certificate" },
                  { key: "parentsIDProof", label: "Parent's ID Proof" },
                  { key: "bankStatement", label: "Bank Statement (6 months)" }
                ].map((doc) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={doc.key}>
                    <Card
                      variant="outlined"
                      sx={{
                        textAlign: "center",
                        borderRadius: 3,
                        boxShadow: 1,
                        transition: "0.3s",
                        "&:hover": { boxShadow: 4 },
                        p: 2,
                      }}
                    >
                      {/* Preview Image or Placeholder */}
                      <Box
                        sx={{
                          height: 150,
                          borderRadius: 2,
                          mb: 2,
                          backgroundColor: "#f5f5f5",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        {formData[doc.key] ? (
                          <>
                            <img
                              src={
                                typeof formData[doc.key] === "string"
                                  ? formData[doc.key]
                                  : URL.createObjectURL(formData[doc.key])
                              }
                              alt={doc.label}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            {isEditing && (
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveDocument(doc.key)}
                                sx={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  bgcolor: "rgba(255, 255, 255, 0.9)",
                                  "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" color="error" />
                              </IconButton>
                            )}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not uploaded
                          </Typography>
                        )}
                      </Box>

                      {/* Document Label */}
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {doc.label}
                      </Typography>

                      {/* View/Download/Upload Buttons */}
                      <Box
                        sx={{
                          mt: 1.5,
                          display: "flex",
                          justifyContent: "center",
                          gap: 1.5,
                          flexWrap: "wrap",
                        }}
                      >
                        {isEditing ? (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              component="label"
                              startIcon={<CloudUploadIcon />}
                              sx={{ fontSize: "0.75rem" }}
                            >
                              Upload
                              <input
                                type="file"
                                hidden
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileChange(e, doc.key)}
                              />
                            </Button>
                            {formData[doc.key] && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  if (typeof formData[doc.key] === "string") {
                                    window.open(formData[doc.key], "_blank");
                                  } else if (formData[doc.key] instanceof File) {
                                    const url = URL.createObjectURL(formData[doc.key]);
                                    window.open(url, "_blank");
                                  }
                                }}
                                sx={{ minWidth: 36 }}
                              >
                                👁️
                              </Button>
                            )}
                          </>
                        ) : (
                          formData[doc.key] && (
                            <>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  if (typeof formData[doc.key] === "string") {
                                    window.open(formData[doc.key], "_blank");
                                  } else if (formData[doc.key] instanceof File) {
                                    const url = URL.createObjectURL(formData[doc.key]);
                                    window.open(url, "_blank");
                                  }
                                }}
                                sx={{ minWidth: 36 }}
                              >
                                👁️
                              </Button>

                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  if (formData[doc.key]) {
                                    if (typeof formData[doc.key] === "string") {
                                      const a = document.createElement("a");
                                      a.href = formData[doc.key];
                                      a.download = doc.label || "download";
                                      a.click();
                                    } else if (formData[doc.key] instanceof File) {
                                      const url = URL.createObjectURL(formData[doc.key]);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = formData[doc.key].name || "download";
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    }
                                  }
                                }}
                                sx={{ minWidth: 36 }}
                              >
                                ⬇️
                              </Button>
                            </>
                          )
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Card>
          )}

      </Box>
    </Dialog>
  );
};

export default ApplicationEditDialog;
