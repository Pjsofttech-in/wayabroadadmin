import React, { useEffect, useState } from "react";
import { message } from "antd";
import { getPersonalAcademicInfo, createAdmissionForm, searchEnquiries } from './AbroadApplicationService';
import dayjs from "dayjs";
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ClearIcon from '@mui/icons-material/Clear';
import {
  TextField,
  Button,
  Card,
  Grid,
  CircularProgress,
  Autocomplete,
  MenuItem,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  Box,
  IconButton,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Input
} from "@mui/material";
import Documents from "./Documents";

const steps = ['Basic Information', 'Documents', 'Review & Submit'];

// File input component for consistent styling and better UX
const FileInput = ({ label, name, onChange, value, accept = "*" }) => {
  const inputRef = React.useRef(null);
  
  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    const event = {
      target: {
        name,
        files: file ? [file] : []
      }
    };
    onChange(event);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    const event = {
      target: {
        name,
        files: []
      }
    };
    onChange(event);
    // Reset the file input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <InputLabel sx={{ mb: 1, fontWeight: 'medium' }}>{label}</InputLabel>
      <Box 
        sx={{
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
        onClick={handleClick}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {value ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DescriptionIcon color="primary" sx={{ mr: 1 }} />
              <Typography noWrap sx={{ flex: 1, mr: 1 }}>
                {value.name || 'File selected'}
              </Typography>
              <IconButton 
                size="small" 
                onClick={handleClear}
                sx={{ ml: 'auto' }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CloudUploadIcon color="action" sx={{ mr: 1 }} />
              <Typography color="textSecondary">
                Click to upload or drag and drop
              </Typography>
            </Box>
          )}
        </Box>
        <input
          type="file"
          ref={inputRef}
          name={name}
          onChange={handleFileChange}
          accept={accept}
          style={{ display: 'none' }}
        />
      </Box>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
        {accept === ".pdf,.doc,.docx" 
          ? "PDF, DOC, DOCX (Max 5MB)" 
          : accept === ".jpg,.jpeg,.png" 
            ? "JPG, JPEG, PNG (Max 5MB)" 
            : "All files (Max 5MB)"}
      </Typography>
    </Box>
  );
};

const AppicationCreate = () => {
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    gender: "",
    dob: "",
    
    // Passport Information
    hasPassport: "",
    
    // Education Information
    passedCourse: "",
    percentage: "",
    passoutYear: "",
    gapInEducation: "",
    
    // Application Details
    applyFor: "",
    continent: "",
    country: "",
    state: "",
    city: "",
    university: "",
    college: "",
    stream: "",
    course: "",
    status: "applied",
    intake: "",
    
    // Address Information
    houseNumber: "",
    streetName: "",
    landmark: "",
    pincode: "",
    
    // Family Information
    fatherOccupation: "",
    fatherIncome: "",
    fatherPhone: "",
    
    // Additional Information
    notes: "",
    enquiryDate: new Date().toISOString().split('T')[0],
    assignedStaffEmail: "",
    assignedStaffName: "",
    
    // File uploads
    sop: null,
    lors: null,
    resume: null,
    testScores: null,
    passportCopy: null,
    studentVisa: null,
    passportPhotos: null,
    moicertificate: null,
    workOrInternshipExperienceCertificate: null,
    sscmarksheet: null,
    hscmarksheet: null,
    bachelorsMarksheet: null,
    transcripts: null,
    bonafideCertificate: null,
    parentsIDProof: null,
    bankStatement: null,
    
    // System fields
    createdByEmail: "",
    role: "",
    branchCode: "",
    createdDateTime: null
  });
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [studentOptions, setStudentOptions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // Handle file inputs
    if (e.target.type === 'file') {
      if (files && files[0]) {
        setFormData(prev => ({
          ...prev,
          [name]: files[0] // Store the file object
        }));
      } else if (files === undefined) {
        // Handle file removal
        setFormData(prev => ({
          ...prev,
          [name]: null
        }));
      }
      return;
    }

    // Completely unrestricted input for passoutYear
    if (name === 'passoutYear') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    // Handle regular input changes
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      createdByEmail: sessionStorage.getItem("email") || "",
      role: sessionStorage.getItem("role") || "",
      branchCode: sessionStorage.getItem("branchCode") || "",
      createdDateTime: new Date().toISOString()
    }));
  }, []);

  // Fetch staff list for the branch
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        setLoadingStaff(true);
        const branchCode = sessionStorage.getItem('branchCode');
        const role = sessionStorage.getItem('role');
        
        if (role === 'staff') {
          // If staff, only show their own name
          const email = sessionStorage.getItem('email') || '';
          setStaffOptions([{
            id: email,
            name: 'Me',
            email: email
          }]);
        } else if (branchCode && branchCode !== 'All') {
          const { getAllStaff } = await import("../Branch/StaffService");
          const staffList = await getAllStaff(branchCode);
          const options = Array.isArray(staffList)
            ? staffList.map((s) => ({
                id: s.id,
                name: s.staffName || s.name || s.fullName || "Unnamed",
                email: s.staffEmail || s.email,
                branchCode: s.branchCode
              }))
            : [];
          setStaffOptions(options);
        }
      } catch (error) {
        console.error('Error fetching staff options:', error);
        setStaffOptions([]);
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaffList();
  }, []);

  // Fetch all student data for search functionality
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setSearching(true);
        // Get all enquiries initially using empty search parameters
        const data = await searchEnquiries({});
        const students = data || [];
        setAllStudents(students);
        setStudentOptions([]); // Clear previous options
      } catch (error) {
        console.error("Failed to load student data:", error);
        message.error("Failed to load student data");
        setAllStudents([]);
        setStudentOptions([]);
      } finally {
        setSearching(false);
      }
    };
    fetchStudents();
  }, []);

  // Handle search for students using the new search API
  const handleSearch = async (value) => {
    if (!value) {
      setStudentOptions([]);
      return;
    }

    setSearching(true);
    try {
      // Clean the input value
      const cleanValue = value.trim();
      let searchResults = [];

      // Try searching by ID (exact match)
      if (/^\d+$/.test(cleanValue)) {
        const idResult = await searchEnquiries({ id: parseInt(cleanValue) });
        searchResults = [...searchResults, ...idResult];
      }

      // Try searching by email (partial match)
      if (cleanValue.includes('@')) {
        const emailResult = await searchEnquiries({ email: cleanValue });
        searchResults = [...searchResults, ...emailResult];
      }

      // Try searching by phone number (exact match after cleaning)
      const phoneNumber = cleanValue.replace(/\D/g, '');
      if (phoneNumber.length >= 10) {
        const phoneResult = await searchEnquiries({ phoneNo: phoneNumber });
        searchResults = [...searchResults, ...phoneResult];
      }

      // If no results found with specific fields, try name search
      if (searchResults.length === 0) {
        const nameResults = await searchEnquiries({ name: cleanValue });
        searchResults = [...searchResults, ...nameResults];
      }

      // Remove duplicates by ID
      const uniqueResults = Array.from(new Map(
        searchResults.map(item => [item.id, item])
      ).values());

      const options = uniqueResults.map(student => ({
        value: student.id,
        label: `${student.name || ''} (ID: ${student.id || ''}) | Phone: ${student.phone_no || ''} | Email: ${student.email || ''}`,
        studentData: student
      }));

      setStudentOptions(options);
    } catch (error) {
      console.error("Error searching students:", error);
      setStudentOptions([]);
    } finally {
      setSearching(false);
    }
  };

  // Helper function to get staff name from email
  const getStaffNameFromEmail = (emailToCheck) => {
    if (!emailToCheck || staffOptions.length === 0) {
      return '';
    }
    const staff = staffOptions.find(s => s.email === emailToCheck);
    return staff ? staff.name : '';
  };

  // When a student is selected from search
  const onStudentSelect = async (event, value) => {
    if (value) {
      const student = value.studentData;

      try {
        // Fetch additional personal and academic information
        const personalInfo = await getPersonalAcademicInfo(student.id);

        // Get staff email and convert to staff name
        const staffEmail = personalInfo.staffEmail || personalInfo.staff_email || student.staffEmail || student.staff_email || student.createdByEmail || "";
        const staffName = personalInfo.staffName || student.staffName || getStaffNameFromEmail(staffEmail);

        // Update form with both search data and API data - ALL FIELDS
        setFormData(prev => ({
          ...prev,
          // Basic Information
          fullName: student.name || personalInfo.name || "",
          email: student.email || personalInfo.email || "",
          phone: student.phone_no || personalInfo.phone_no || "",
          alternatePhone: personalInfo.alternatePhone || student.alternatePhone || "",
          gender: personalInfo.gender || student.gender || "",
          dob: personalInfo.dob || student.dob || "",
          
          // Passport Information
          hasPassport: personalInfo.hasPassport || student.hasPassport || "",
          passportNo: personalInfo.passportNo || student.passportNo || "",
          
          // Education Information
          passedCourse: personalInfo.passedCourse || student.passedCourse || "",
          percentage: personalInfo.percentage || student.percentage || "",
          passoutYear: personalInfo.passoutYear || student.passoutYear || "",
          gap: personalInfo.gap || student.gap || "",
          gapYear: personalInfo.gapYear || student.gapYear || "",
          
          // Application Details
          applyFor: personalInfo.applyFor || student.applyFor || "",
          continent: personalInfo.continent || student.continent || "",
          country: personalInfo.country || student.country || "",
          state: personalInfo.state || student.state || "",
          city: personalInfo.city || student.city || "",
          university: personalInfo.university || student.university || "",
          collage: personalInfo.collage || student.collage || "",
          stream: personalInfo.stream || student.stream || "",
          course: personalInfo.course || personalInfo.courseName || student.course || student.courseName || "",
          intake: personalInfo.intake || student.intake || "",
          status: personalInfo.status || student.status || "applied",
          
          // Address Information
          houseNo: personalInfo.houseNo || student.houseNo || "",
          street: personalInfo.street || student.street || "",
          landmark: personalInfo.landmark || student.landmark || "",
          pincode: personalInfo.pincode || student.pincode || "",
          
          // Family Information
          fathersOccupation: personalInfo.fathersOccupation || student.fathersOccupation || "",
          fathersIncome: personalInfo.fathersIncome || student.fathersIncome || "",
          fatherNumber: personalInfo.fatherNumber || student.fatherNumber || "",
          
          // Additional Information
          notes: personalInfo.notes || student.notes || "",
          enquiry_date: personalInfo.enquiry_date || student.enquiry_date || "",
          staffEmail: staffEmail,
          staffName: staffName,
        }));

        message.success("Student information loaded successfully!");
      } catch (error) {
        console.error("Error fetching student details:", error);

        // Fallback to search data if API fails
        const staffEmail = student.staffEmail || student.staff_email || student.createdByEmail || "";
        const staffName = student.staffName || getStaffNameFromEmail(staffEmail);
        
        setFormData(prev => ({
          ...prev,
          // Basic Information
          fullName: student.name || "",
          email: student.email || "",
          phone: student.phone_no || "",
          alternatePhone: student.alternatePhone || "",
          gender: student.gender || "",
          dob: student.dob || "",
          
          // Passport Information
          hasPassport: student.hasPassport || "",
          passportNo: student.passportNo || "",
          
          // Education Information
          passedCourse: student.passedCourse || "",
          percentage: student.percentage || "",
          passoutYear: student.passoutYear || "",
          gap: student.gap || "",
          gapYear: student.gapYear || "",
          
          // Application Details
          applyFor: student.applyFor || "",
          continent: student.continent || "",
          country: student.country || "",
          state: student.state || "",
          city: student.city || "",
          university: student.university || "",
          collage: student.collage || "",
          stream: student.stream || "",
          course: student.course || student.courseName || "",
          intake: student.intake || "",
          status: student.status || "applied",
          
          // Address Information
          houseNo: student.houseNo || "",
          street: student.street || "",
          landmark: student.landmark || "",
          pincode: student.pincode || "",
          
          // Family Information
          fathersOccupation: student.fathersOccupation || "",
          fathersIncome: student.fathersIncome || "",
          fatherNumber: student.fatherNumber || "",
          
          // Additional Information
          notes: student.notes || "",
          enquiry_date: student.enquiry_date || "",
          staffEmail: staffEmail,
          staffName: staffName,
          // Clear file objects in fallback case too
          sop: null,
          lors: null,
          resume: null,
          testScores: null,
          passportCopy: null,
          studentVisa: null,
          passportPhotos: null
        }));

        message.warning("Could not load additional student details, using basic information");
      }
    } else {
      // Clear form when no student is selected
      setFormData(prev => ({
        ...prev,
        // Basic Information
        fullName: "",
        email: "",
        phone: "",
        alternatePhone: "",
        gender: "",
        dob: "",
        
        // Passport Information
        hasPassport: "",
        passportNo: "",
        
        // Education Information
        passedCourse: "",
        percentage: "",
        passoutYear: "",
        gap: "",
        gapYear: "",
        
        // Application Details
        applyFor: "",
        continent: "",
        country: "",
        state: "",
        city: "",
        university: "",
        collage: "",
        stream: "",
        course: "",
        intake: "",
        status: "applied",
        
        // Address Information
        houseNo: "",
        street: "",
        landmark: "",
        pincode: "",
        
        // Family Information
        fathersOccupation: "",
        fathersIncome: "",
        fatherNumber: "",
        
        // Additional Information
        notes: "",
        enquiry_date: "",
        staffEmail: "",
        staffName: "",
        // Clear file objects when no student is selected
        sop: null,
        lors: null,
        resume: null,
        testScores: null,
        passportCopy: null,
        studentVisa: null,
        passportPhotos: null
      }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const requiredFields = [
      'fullName', 'email', 'phone', 'country', 
      'university', 'course', 'status', 'intake'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        message.error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // No document validation required
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // List of all form fields that should be included in the submission
      const formFields = [
        // Basic Information
        'fullName', 'email', 'phone', 'alternatePhone', 'gender', 'dob',
        
        // Passport Information - only include passportAvailable as passportNo is not in the backend
        'passportAvailable',
        
        // Education Information - gapYear removed as it's not in the backend
        'passedCourse', 'percentage', 'passoutYear', 'gapInEducation',
        
        // Application Details
        'applyFor', 'continent', 'country', 'state', 'city', 'university', 
        'college', 'stream', 'course', 'status', 'intake',
        
        // Address Information
        'houseNumber', 'streetName', 'landmark', 'pincode',
        
        // Family Information
        'fatherOccupation', 'fatherIncome', 'fatherPhone',
        
        // Additional Information
        'notes', 'enquiryDate', 'assignedStaffEmail', 'assignedStaffName',
        
        // System fields
        'branchCode', 'role', 'createdByEmail', 'createdDateTime'
      ];

      // List of file fields that should be handled separately
      const fileFields = [
        'sop', 'sop2', 'lors', 'resume', 'testScores',
        'passportCopy', 'passportInHandPhoto', 'studentVisa', 'passportPhotos',
        'tenthDigitalMarksheet', 'twelfthDigitalMarksheet', 'degreeMarkList',
        'diplomaMarkList', 'transcripts', 'lorsTranscript2', 'bonafideCertificate',
        'moiCertificate', 'moiWithSealAndSign', 'workOrInternshipExperienceCertificate',
        'fatherPanCard', 'fatherITR1', 'fatherITR2', 'fatherITR3',
        'fatherBankStatement', 'fatherIDProof', 'motherIDProof',
        'bankBalanceCertificate', 'bankStatement'
      ];

      // Initialize form data with default values
      const formDataToSend = new FormData();
      const formDataObj = {};

      // Add all form fields with their values or null
      formFields.forEach(field => {
        // Skip if field is in fileFields (handled separately)
        if (fileFields.includes(field)) return;
        
        // Get value from formData or use null
        let value = formData[field] !== undefined ? formData[field] : null;
        
        // Convert empty strings to null
        if (value === '') value = null;
        
        // Add to form data object
        formDataObj[field] = value;
      });

      // Add system fields if not already set
      formDataObj.role = formDataObj.role || sessionStorage.getItem("role") || "";
      formDataObj.createdByEmail = formDataObj.createdByEmail || sessionStorage.getItem("email") || "";
      formDataObj.branchCode = formDataObj.branchCode || sessionStorage.getItem("branchCode") || "";
      formDataObj.createdDateTime = formDataObj.createdDateTime || new Date().toISOString();

      // Add form data as JSON string in 'form' part
      formDataToSend.append('form', JSON.stringify(formDataObj));
      
      // Add files to FormData
      fileFields.forEach(field => {
        if (formData[field] instanceof File) {
          formDataToSend.append(field, formData[field]);
        }
      });
      
      // Add role and email as separate parameters (as expected by backend)
      formDataToSend.append('role', formDataObj.role);
      formDataToSend.append('email', formDataObj.createdByEmail);

      // Log FormData contents for debugging
      console.log("Form submission data:", {
        formData: formDataObj,
        files: fileFields.filter(field => formData[field] instanceof File).map(field => ({
          name: field,
          file: formData[field].name,
          type: formData[field].type,
          size: formData[field].size
        }))
      });

      // Call the API to save the admission form
      const result = await createAdmissionForm(formDataToSend);
      console.log("API call successful:", result);
      message.success("Admission form submitted successfully!");

      // Reset form after successful submission
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        alternatePhone: "",
        country: "",
        university: "",
        course: "",
        stream: "",
        passoutYear: "",
        intake: "",
        status: "applied",
        notes: "",
        sop: null,
        lors: null,
        resume: null,
        testScores: null,
        passportCopy: null,
        studentVisa: null,
        passportPhotos: null,
        createdByEmail: sessionStorage.getItem("email") || "",
        role: sessionStorage.getItem("role") || "",
        branchCode: sessionStorage.getItem("branchCode") || "",
        createdDateTime: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving admission:", error);
      
      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 500) {
          // Check for duplicate entry error
          if (error.response.data.message?.includes('already exists')) {
            message.warning("This student information already exists in our system.");
          } else {
            message.error("A server error occurred. Please try again later.");
          }
        } else {
          message.error(error.response.data.message || "An error occurred while saving the application.");
        }
      } else if (error.request) {
        // The request was made but no response was received
        message.error("No response from server. Please check your connection and try again.");
      } else {
        // Something happened in setting up the request
        message.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    
    if (files && files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else if (files === undefined) {
      // Handle file removal
      setFormData(prev => ({
        ...prev,
        [name]: null
      }));
    } else {
      // Handle regular input changes
      const { name: inputName, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [inputName]: value
      }));
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Student Information
            </Typography>
            <Grid container spacing={2}>
              {/* Student Search - directly available */}
              <Grid item xs={12}>
                <Autocomplete
                  options={studentOptions || []}
                  value={null} // Start with no selected value
                  loading={searching}
                  onInputChange={(e, value) => handleSearch(value)}
                  onChange={onStudentSelect}
                  getOptionLabel={(option) => option.label || ''}
                  isOptionEqualToValue={(option, value) => option?.value === value?.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Student (by ID, Name, Email, or Phone)"
                      variant="outlined"
                      fullWidth
                      margin="normal"
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  required
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}> 
                <TextField
                  required
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  required
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Alternate Phone"
                  name="alternatePhone"
                  value={formData.alternatePhone || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Gender</InputLabel>
                  <MuiSelect
                    value={formData.gender || ''}
                    name="gender"
                    onChange={handleChange}
                    label="Gender"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </MuiSelect>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={formData.dob ? formData.dob.split('T')[0] : ''}
                  onChange={(e) => {
                    // Format the date as YYYY-MM-DD for the backend
                    const dateValue = e.target.value ? new Date(e.target.value).toISOString() : '';
                    handleChange({
                      target: {
                        name: 'dob',
                        value: dateValue
                      }
                    });
                  }}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: new Date().toISOString().split('T')[0] // Prevent future dates
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Enquiry Date"
                  name="enquiry_date"
                  value={formData.enquiry_date || ''}
                  onChange={handleChange}
                  margin="normal"
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } }}
                />
              </Grid>

              {/* Passport Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                  Passport Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Do you have Passport?</InputLabel>
                  <MuiSelect
                    value={formData.hasPassport || ''}
                    name="hasPassport"
                    onChange={handleChange}
                    label="Do you have Passport?"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </MuiSelect>
                </FormControl>
              </Grid>
              {/* Passport number field removed as it's not recognized by the backend
              {formData.hasPassport === 'Yes' && (
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Passport Number"
                    name="passportNo"
                    value={formData.passportNo || ''}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
              )}
              */}

              {/* Education Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                  Education Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Passout Course</InputLabel>
                  <MuiSelect
                    value={formData.passedCourse || ''}
                    name="passoutCourse"
                    onChange={handleChange}
                    label="Passout Course"
                  >
                    <MenuItem value="">Select</MenuItem>
                    {["10th", "12th", "ITI", "Diploma", "BA", "B.Com", "B.Sc", "BBA", "BCA", "MA", "M.Com", "MSc", "PHD", "BE", "B.Tech", "M.Tech", "ME", "Other"].map((course) => (
                      <MenuItem key={course} value={course}>{course}</MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Percentage"
                  name="percentage"
                  value={formData.percentage || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Have GAP in Education?</InputLabel>
                  <MuiSelect
                    value={formData.gap || ''}
                    name="gap"
                    onChange={handleChange}
                    label="Have GAP in Education?"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </MuiSelect>
                </FormControl>
              </Grid>
              {formData.gap === 'Yes' && (
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="GAP Year"
                    name="gapYear"
                    value={formData.gapYear || ''}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
              )}

              {/* Application Details */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                  Application Details
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Apply For</InputLabel>
                  <MuiSelect
                    value={formData.applyFor || ''}
                    name="applyFor"
                    onChange={handleChange}
                    label="Apply For"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Certificate">Certificate</MenuItem>
                    <MenuItem value="Diploma">Diploma</MenuItem>
                    <MenuItem value="UG">UG</MenuItem>
                    <MenuItem value="PG">PG</MenuItem>
                  </MuiSelect>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Continent"
                  name="continent"
                  value={formData.continent || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="State"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="University"
                  name="university"
                  value={formData.university || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="College"
                  name="collage"
                  value={formData.collage || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Stream"
                  name="stream"
                  value={formData.stream || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Course Name"
                  name="course"
                  value={formData.course || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Passout Year"
                  name="passoutYear"
                  value={formData.passoutYear || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <MuiSelect
                    value={formData.status || 'applied'}
                    name="status"
                    onChange={handleChange}
                    label="Status"
                  >
                    <MenuItem value="applied">Applied</MenuItem>
                    <MenuItem value="visa_accepted">Visa Accepted</MenuItem>
                    <MenuItem value="visa_rejected">Visa Rejected</MenuItem>
                    <MenuItem value="passport_issued">Passport Issued</MenuItem>
                    <MenuItem value="passport_rejected">Passport Rejected</MenuItem>
                    <MenuItem value="doc_incomplete">Doc Incomplete</MenuItem>
                    <MenuItem value="app_proceed">App Proceed</MenuItem>
                    <MenuItem value="adm_completed">Adm Completed</MenuItem>
                  </MuiSelect>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Intake</InputLabel>
                  <MuiSelect
                    value={formData.intake || ''}
                    name="intake"
                    onChange={handleChange}
                    label="Intake"
                  >
                    <MenuItem value="">Select Intake</MenuItem>
                    <MenuItem value="Spring">Spring</MenuItem>
                    <MenuItem value="Fall">Fall</MenuItem>
                    <MenuItem value="Summer">Summer</MenuItem>
                    <MenuItem value="Winter">Winter</MenuItem>
                  </MuiSelect>
                </FormControl>
              </Grid>
              {/* Address Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                  Address Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="House/Flat No."
                  name="houseNo"
                  value={formData.houseNo || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Street Name"
                  name="street"
                  value={formData.street || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Landmark"
                  name="landmark"
                  value={formData.landmark || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              {/* Family Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                  Family Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Father's Occupation"
                  name="fathersOccupation"
                  value={formData.fathersOccupation || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Father's Income"
                  name="fathersIncome"
                  type="number"
                  value={formData.fathersIncome || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Father's Phone Number"
                  name="fatherNumber"
                  value={formData.fatherNumber || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              {/* Additional Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                  Additional Information
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Assigned Staff Name"
                  name="staffName"
                  value={formData.staffName || ''}
                  onChange={handleChange}
                  margin="normal"
                  helperText="Name of the staff member handling this application"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: '#f5f5f5',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Staff Email"
                  name="staffEmail"
                  type="email"
                  value={formData.staffEmail || ''}
                  onChange={handleChange}
                  margin="normal"
                  helperText="Email of the staff member"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: '#f5f5f5',
                    }
                  }}
                />
              </Grid>
            </Grid>
          </>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Required Documents
            </Typography>
            <Grid container spacing={2}>
              {[
                { name: 'SOP - 1', key: 'sop', accept: '.pdf,.doc,.docx' },
                { name: 'SOP - 2', key: 'sop2', accept: '.pdf,.doc,.docx' },
                { name: 'LORs', key: 'lors', accept: '.pdf,.doc,.docx' },
                { name: 'Resume / CV', key: 'resume', accept: '.pdf,.doc,.docx' },
                { name: 'Test Scores', key: 'testScores', accept: '.pdf,.jpg,.jpeg,.png' },
                { name: 'Passport Copy', key: 'passportCopy', accept: '.pdf' },
                { name: 'Passport Photo', key: 'passportInHandPhoto', accept: '.jpg,.jpeg,.png' },
                { name: 'Student Visa', key: 'studentVisa', accept: '.pdf,.jpg,.jpeg,.png' },
                { name: 'Passport Photos', key: 'passportPhotos', accept: '.jpg,.jpeg,.png' },
                { name: 'MOI Certificate', key: 'moiCertificate', accept: '.pdf' },
                { name: 'MOI with Seal & Sign', key: 'moiWithSealAndSign', accept: '.pdf,.jpg,.jpeg,.png' },
                { name: 'Work/Internship Experience', key: 'workOrInternshipExperienceCertificate', accept: '.pdf,.jpg,.jpeg,.png' },
                { name: '10th Marksheet', key: 'tenthDigitalMarksheet', accept: '.pdf' },
                { name: '12th Marksheet', key: 'twelfthDigitalMarksheet', accept: '.pdf' },
                { name: 'Degree Mark List', key: 'degreeMarkList', accept: '.pdf' },
                { name: 'Transcripts', key: 'transcripts', accept: '.pdf' },
                { name: 'Bonafide Certificate', key: 'bonafideCertificate', accept: '.pdf' },
                { name: "Father's PAN Card", key: 'fatherPanCard', accept: '.pdf,.jpg,.jpeg,.png' },
                { name: "Father's ITR 1", key: 'fatherITR1', accept: '.pdf' },
                { name: "Father's ITR 2", key: 'fatherITR2', accept: '.pdf' },
                { name: "Father's ITR 3", key: 'fatherITR3', accept: '.pdf' },
                { name: "Father's Bank Statement", key: 'fatherBankStatement', accept: '.pdf' },
                { name: 'Bank Balance Certificate', key: 'bankBalanceCertificate', accept: '.pdf' },
                { name: "Parent's ID Proof", key: 'parentsIDProof', accept: '.pdf,.jpg,.jpeg,.png' },
                { name: 'Bank Statement (6 months)', key: 'bankStatement', accept: '.pdf' }
              ].map((doc) => (
                <Grid item xs={12} sm={6} md={4} key={doc.key}>
                  <label htmlFor={`doc-${doc.key}`} style={{ display: 'block' }}>
                    <input
                      id={`doc-${doc.key}`}
                      name={doc.key}
                      type="file"
                      accept={doc.accept}
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <Box
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        p: 1.5,
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          boxShadow: '0 0 0 2px rgba(25,118,210,0.08)'
                        }
                      }}
                    >
                      <Typography variant="body2">{doc.name}</Typography>
                    </Box>
                  </label>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Application
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1">Personal Information</Typography>
              <Typography><strong>Full Name:</strong> {formData.fullName}</Typography>
              <Typography>Email: {formData.email}</Typography>
              <Typography>Phone: {formData.phone}</Typography>
              {formData.alternatePhone && (
                <Typography>Alternate Phone: {formData.alternatePhone}</Typography>
              )}
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1">Academic Information</Typography>
              <Typography>Country: {formData.country}</Typography>
              <Typography>University: {formData.university}</Typography>
              <Typography>Course: {formData.course}</Typography>
              {formData.stream && <Typography>Stream: {formData.stream}</Typography>}
              {formData.passoutYear && (
                <Typography>Passout Year: {formData.passoutYear}</Typography>
              )}
              {formData.intake && <Typography>Intake: {formData.intake}</Typography>}
            </Box>
            {formData.notes && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">Additional Notes</Typography>
                <Typography>{formData.notes}</Typography>
              </Box>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Card sx={{ p: 3, maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Abroad Admission Form
      </Typography>
      
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
                {renderStepContent(activeStep)}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                  <Box>
                    {activeStep < steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        sx={{ mt: 1 }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Submit Application'}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Card>
  );
};

export default AppicationCreate;