import React, { useState, useEffect } from "react";
import { partnerService } from './partnerService';
import AlertService from '../Common/AlertService';
import LoadingOverlay from '../Common/LoadingOverlay';
import {
  Box,
  Button,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from "@mui/material";





const PatnerEdit = ({ open = true, partnerId, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [files, setFiles] = useState({});
  const [existingFiles, setExistingFiles] = useState({});
  
  // Dynamic dropdown options
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [instituteTypes, setInstituteTypes] = useState([]);
  const [contractTypes, setContractTypes] = useState([]);
  const [conductedByOptions, setConductedByOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [formData, setFormData] = useState({
    businessName: "",
    partnerName: "",
    partnerContact: "",
    partnerEmail: "",
    partnerAddress: "",
    partnerCountry: "",
    partnerCity: "",
    partnerDistrict: "",
    partnerPincode: "",
    state: "",
    status: "pending",
    conductedBy: "Web",
    contractType: "",
    instituteType: "",
    university: "",
    commissionPercent: "",
    remark: "",
    designation: "",
    mobileNo: "",
    contractPdf: "",
    commissionPdf: "",
    panPdf: "",
    gstPdf: "",
    createdByEmail: sessionStorage.getItem('email') || '',
    role: "partner"
  });

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      // Fetch countries
      const countriesResponse = await partnerService.getAllCountries();
      setCountries(countriesResponse || []);

      // Fetch states
      const statesResponse = await partnerService.getAllStates();
      setStates(statesResponse || []);

      // Fetch cities
      const citiesResponse = await partnerService.getAllCities();
      setCities(citiesResponse || []);

      // Fetch universities
      const universitiesResponse = await partnerService.getAllUniversities();
      setUniversities(universitiesResponse || []);

        // Use static institute types (same as AddPartner.jsx)
  setInstituteTypes([
    { id: 1, name: "Private" },
    { id: 2, name: "Government" },
    { id: 3, name: "Deemed University" },
    { id: 4, name: "College" },
    { id: 5, name: "Agency" },
    { id: 6, name: "German classes" },
    { id: 7, name: "French classes" },
    { id: 8, name: "Neet classes" },
    { id: 9, name: "JEE classes" },
    { id: 10, name: "ILETS / TOEFL classes" },
    { id: 11, name: "Other" }
  ]);

        // Use static contract types (same as AddPartner.jsx)
  setContractTypes([
    { id: 1, name: "Partner Uni (In)" },
    { id: 2, name: "Partner Uni (MH)" },
    { id: 3, name: "Partner Uni (Ab)" },
    { id: 4, name: "Partner Collage (In)" },
    { id: 5, name: "Partner Collage (MH)" },
    { id: 6, name: "Partner Collage (Ab)" },
    { id: 7, name: "Partner Agency (In)" },
    { id: 8, name: "Partner Agency (Ab)" },
    { id: 9, name: "Partner Agency (Both)" },
    { id: 10, name: "Our Franchise (In)" },
    { id: 11, name: "Our Franchise (Ab)" },
    { id: 12, name: "Individual Partner" },
    { id: 13, name: "Partner/Franchise" },
    { id: 14, name: "Partner Classes" }
  ]);

      // Fetch conducted by options - using same logic as AddPartner
      const data = await partnerService.getConductedByOptions();
      console.log('Conducted By API response:', data);
      // Transform the data to match the expected format (same as InstituteDetails.jsx)
      const options = data.map(item => ({
        value: item.conductBy || item.name || item.conductedBy || '',
        label: item.conductBy || item.name || item.conductedBy || ''
      }));
      console.log('Transformed conducted by options:', options);
      setConductedByOptions(options);

        // Use static status options (same as AddPartner.jsx)
  setStatusOptions([
    { id: 1, name: "Interested" },
    { id: 2, name: "Not Interested" },
    { id: 3, name: "Meeting Scheduled" },
    { id: 4, name: "Onboard" },
    { id: 5, name: "Ringing" }
  ]);

    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  // Fetch partner data on component mount
  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!partnerId) return;
      
      try {
        setInitialLoading(true);
        
        // Fetch both partner data and dropdown data
        const role = sessionStorage.getItem('role') || '';
        const email = sessionStorage.getItem('email') || '';
        
        // Fetch partner data and dropdown data in parallel
        const [partnerData] = await Promise.all([
          partnerService.getPartnerById(partnerId, role, email),
          fetchDropdownData()
        ]);
        
        // Update form data with fetched partner data
        setFormData({
          businessName: partnerData.businessName || "",
          partnerName: partnerData.partnerName || "",
          partnerContact: partnerData.partnerContact || "",
          partnerEmail: partnerData.partnerEmail || "",
          partnerAddress: partnerData.partnerAddress || "",
          partnerCountry: partnerData.partnerCountry || "",
          partnerCity: partnerData.partnerCity || "",
          partnerDistrict: partnerData.partnerDistrict || "",
          partnerPincode: partnerData.partnerPincode || "",
          state: partnerData.state || "",
          status: partnerData.status || "pending",
          conductedBy: partnerData.conductedBy || "Web",
          contractType: partnerData.contractType || "",
          instituteType: partnerData.instituteType || "",
          university: partnerData.university || "",
          commissionPercent: partnerData.commissionPercent || "",
          remark: partnerData.remark || "",
          designation: partnerData.designation || "",
          mobileNo: partnerData.mobileNo || "",
          contractPdf: partnerData.contractPdf || "",
          commissionPdf: partnerData.commissionPdf || "",
          panPdf: partnerData.panPdf || "",
          gstPdf: partnerData.gstPdf || "",
          createdByEmail: partnerData.createdByEmail || sessionStorage.getItem('email') || '',
          role: partnerData.role || "partner"
        });

        // Set existing files for display
        setExistingFiles({
          contractPdf: partnerData.contractPdf || "",
          commissionPdf: partnerData.commissionPdf || "",
          panPdf: partnerData.panPdf || "",
          gstPdf: partnerData.gstPdf || ""
        });

      } catch (error) {
        console.error("Error fetching partner data:", error);
        AlertService.error("Error loading partner data. Please try again.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPartnerData();
  }, [partnerId]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const partnerData = {
        ...formData,
        conductedBy: !formData.conductedBy ? 'Web' : (formData.conductedBy === 'web' ? 'Web' : formData.conductedBy),
        role: formData.role || "partner"
      };
      
      // Update the partner first
      const role = sessionStorage.getItem('role') || '';
      const email = sessionStorage.getItem('email') || '';
      const updatedPartner = await partnerService.updatePartner(partnerId, partnerData, role, email);
      
      // If there are new files to upload, do it after updating the partner
      if (Object.keys(files).length > 0) {
        const documentData = {
          contractPdf: files.contractPdf,
          commissionAgreementPdf: files.commissionPdf,
          panCard: files.panPdf,
          gstCertificate: files.gstPdf
        };
        
        await partnerService.uploadPartnerDocuments(
          partnerId,
          documentData,
          role,
          email
        );
      }

      // Show success message
      AlertService.success("Partner updated successfully!");

      // Call the onUpdate callback if provided
      if (onUpdate) {
        onUpdate(updatedPartner);
      }

      // Close the edit form after successful update
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error("Error updating partner:", error);
      AlertService.error(error.response?.data?.message || "Error updating partner. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerId) return;
    
    try {
      const confirmed = await AlertService.confirm('Are you sure you want to delete this partner? This action cannot be undone.');
      if (!confirmed) return;
      
      setLoading(true);
      const role = sessionStorage.getItem('role') || '';
      const email = sessionStorage.getItem('email') || '';
      
      const result = await partnerService.deletePartner(partnerId, role, email);
      
      if (result && result.success) {
        await AlertService.success('Partner deleted successfully');
        if (onUpdate) onUpdate();
        if (onClose) await onClose();
      } else {
        const errorMessage = result?.error || 'Failed to delete partner';
        await AlertService.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      await AlertService.error(error.message || 'Failed to delete partner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (name, file) => {
    setFiles({ ...files, [name]: file });
  };







  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: '95vh',
          maxHeight: '1000px',
          width: '95%',
          maxWidth: '1400px',
          m: 1,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>Edit Partner</DialogTitle>
      <DialogContent dividers sx={{ p: 0, overflow: 'hidden', flex: 1 }}>
        <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={2} sx={{ m: 0, height: '100%', '& > .MuiGrid-item': { paddingTop: '0 !important' } }}>
            {/* Partner Details Card */}
            <Grid item xs={12} md={5} sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Partner Details</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Business Name"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Partner Name"
                        name="partnerName"
                        value={formData.partnerName}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Partner Contact"
                        name="partnerContact"
                        value={formData.partnerContact}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Partner Email"
                        name="partnerEmail"
                        value={formData.partnerEmail}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Partner Address"
                        name="partnerAddress"
                        value={formData.partnerAddress}
                        onChange={handleChange}
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Country</InputLabel>
                        <Select
                          name="partnerCountry"
                          value={formData.partnerCountry}
                          onChange={handleChange}
                          label="Country"
                        >
                          <MenuItem value="">Select Country</MenuItem>
                          {countries.map((country) => (
                            <MenuItem key={country.id} value={country.name}>
                              {country.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>City</InputLabel>
                        <Select
                          name="partnerCity"
                          value={formData.partnerCity}
                          onChange={handleChange}
                          label="City"
                        >
                          <MenuItem value="">Select City</MenuItem>
                          {cities.map((city) => (
                            <MenuItem key={city.id} value={city.name}>
                              {city.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="District"
                        name="partnerDistrict"
                        value={formData.partnerDistrict}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Pincode"
                        name="partnerPincode"
                        value={formData.partnerPincode}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>State</InputLabel>
                        <Select
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          label="State"
                        >
                          <MenuItem value="">Select State</MenuItem>
                          {states.map((state) => (
                            <MenuItem key={state.id} value={state.name}>
                              {state.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          label="Status"
                        >
                          <MenuItem value="">Select Status</MenuItem>
                          {statusOptions.map((option) => (
                            <MenuItem key={option.id} value={option.name}>
                              {option.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Institute Details Card */}
            <Grid item xs={12} md={4} sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Institute Details</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Designation"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Mobile No"
                        name="mobileNo"
                        value={formData.mobileNo}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Institute Type</InputLabel>
                        <Select
                          name="instituteType"
                          value={formData.instituteType}
                          onChange={handleChange}
                          label="Institute Type"
                        >
                          <MenuItem value="">Select Institute Type</MenuItem>
                          {instituteTypes.map((type) => (
                            <MenuItem key={type.id} value={type.name}>
                              {type.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Contract Type</InputLabel>
                        <Select
                          name="contractType"
                          value={formData.contractType}
                          onChange={handleChange}
                          label="Contract Type"
                        >
                          <MenuItem value="">Select Contract Type</MenuItem>
                          {contractTypes.map((type) => (
                            <MenuItem key={type.id} value={type.name}>
                              {type.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>University</InputLabel>
                        <Select
                          name="university"
                          value={formData.university}
                          onChange={handleChange}
                          label="University"
                        >
                          <MenuItem value="">Select University</MenuItem>
                          {universities.map((university) => (
                            <MenuItem key={university.id} value={university.name}>
                              {university.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Commission Percent"
                        name="commissionPercent"
                        value={formData.commissionPercent}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Conducted By</InputLabel>
                        <Select
                          name="conductedBy"
                          value={formData.conductedBy}
                          onChange={handleChange}
                          label="Conducted By"
                        >
                          <MenuItem value="">Select Conducted By</MenuItem>
                          {conductedByOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Remark"
                        name="remark"
                        value={formData.remark}
                        onChange={handleChange}
                        multiline
                        rows={3}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Documents Card */}
            <Grid item xs={12} md={3} sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Documents</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="file"
                        label="Contract PDF"
                        name="contractPdf"
                        onChange={(e) => handleFileChange('contractPdf', e.target.files[0])}
                        InputLabelProps={{ shrink: true }}
                      />
                      {existingFiles.contractPdf && (
                        <Typography variant="caption" color="textSecondary">
                          Current: {existingFiles.contractPdf}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="file"
                        label="Commission Agreement"
                        name="commissionPdf"
                        onChange={(e) => handleFileChange('commissionPdf', e.target.files[0])}
                        InputLabelProps={{ shrink: true }}
                      />
                      {existingFiles.commissionPdf && (
                        <Typography variant="caption" color="textSecondary">
                          Current: {existingFiles.commissionPdf}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="file"
                        label="PAN Card"
                        name="panPdf"
                        onChange={(e) => handleFileChange('panPdf', e.target.files[0])}
                        InputLabelProps={{ shrink: true }}
                      />
                      {existingFiles.panPdf && (
                        <Typography variant="caption" color="textSecondary">
                          Current: {existingFiles.panPdf}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="file"
                        label="GST Certificate"
                        name="gstPdf"
                        onChange={(e) => handleFileChange('gstPdf', e.target.files[0])}
                        InputLabelProps={{ shrink: true }}
                      />
                      {existingFiles.gstPdf && (
                        <Typography variant="caption" color="textSecondary">
                          Current: {existingFiles.gstPdf}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between' }}>
        <Button 
          onClick={handleDeletePartner}
          color="error"
          variant="outlined"
          disabled={loading}
        >
          Delete Partner
        </Button>
        <Box>
          <Button 
            onClick={onClose} 
            color="primary" 
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default PatnerEdit;
