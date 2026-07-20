import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import { partnerService } from './partnerService';

const initialState = {
  businessName: "",
  partnerName: "",
  partnerContact: "",
  partnerEmail: "",
  partnerPassword: "",
  partnerAddress: "",
  partnerCountry: "",
  partnerCity: "",
  partnerDistrict: "",
  partnerPincode: "",
  state: "",
  status: "",
  conductedBy: "",
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
};

export default function InstituteDetails({ data: propData, onChange: propOnChange }) {
  const [form, setForm] = useState(initialState);
  const [msg, setMsg] = useState("");
  const [conductedByOptions, setConductedByOptions] = useState([]);
  
  // Use prop data if available, otherwise use local state
  const data = propData || form;
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...data, [name]: value };
    
    // Reset dependent fields when parent changes
    if (name === 'country') {
      newData.state = '';
      newData.district = '';
    } else if (name === 'state') {
      newData.district = '';
    }
    
    setForm(newData);
    if (propOnChange) {
      propOnChange({ target: { name, value } });
    }
  };
  const contractTypes = ["Partner Uni (In)", "Partner Uni (MH)", "Partner Uni (Ab)", "Partner Collage (In)","Partner Collage (MH)","Partner Collage (Ab)","Partner Agency (In)","Partner Agency (Ab)","Partner Agency (Both)","Our Franchise (In)","Our Franchise (In)","Our Franchise (Ab)","Individual Partner","Partner/Franchise","Partner Classes"];
  const instituteTypes = ["Private", "Government", "Deemed University", "College", "Agency", "German classes"," French classes","Neet classes","JEE classes","ILETS / TOEFL classes", "Other"];
  const statusOptions = [
    { value: "interested", label: "Interested" },
    { value: "not_interested", label: "Not Interested" },
    { value: "meeting_scheduled", label: "Meeting Scheduled" },
    { value: "onboard", label: "Onboard" },
    { value: "ringing", label: "Ringing" }
  ];
  // Fetch conducted by options on component mount
  useEffect(() => {
    const fetchConductedByOptions = async () => {
      try {
        const data = await partnerService.getAllConductBy();
        // Transform the data to match the expected format
        const options = data.map(item => ({
          value: item.conductBy || item.name || '',
          label: item.conductBy || item.name || ''
        }));
        setConductedByOptions(options);
      } catch (error) {
        console.error('Error fetching conducted by options:', error);
        // Fallback to default options if API fails
        setConductedByOptions([
          { value: "poonam", label: "Poonam" },
          { value: "rohini", label: "Rohini" },
          { value: "siddhi", label: "Siddhi" },
          { value: "radhika", label: "Radhika" },
          { value: "padam_sir", label: "Padam Sir" }
        ]);
      }
    };

    fetchConductedByOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare the partner data based on form values
      const partnerData = {
        businessName: data.businessName || '',
        partnerName: data.partnerName || '',
        partnerContact: data.partnerContact || '',
        partnerEmail: data.partnerEmail || '',
        partnerPassword: data.partnerPassword || '',
        partnerAddress: data.partnerAddress || '',
        partnerCountry: data.partnerCountry || '',
        partnerCity: data.partnerCity || '',
        partnerDistrict: data.partnerDistrict || '',
        partnerPincode: data.partnerPincode || '',
        state: data.state || '',
        status: data.status || '',
        conductedBy: !data.conductedBy ? 'Web' : (data.conductedBy === 'web' ? 'Web' : data.conductedBy),
        contractType: data.contractType || '',
        instituteType: data.instituteType || '',
        university: data.university || '',
        commissionPercent: data.commissionPercent || '',
        remark: data.remark || '',
        designation: data.designation || '',
        mobileNo: data.mobileNo || '',
        createdByEmail: sessionStorage.getItem("email") || '',
        role: sessionStorage.getItem("role") || ''
      };

      const result = await partnerService.createPartner(partnerData);
      if (result.error) {
        setMsg(result.error);
      } else {
        setMsg("Partner created successfully!");
        setForm(initialState); // Reset form after successful submission
      }
    } catch (error) {
      setMsg("Failed to create partner: " + (error.message || "Unknown error"));
      console.error("Error saving institute details:", error);
      setMsg(error.response?.data?.message || "Failed to save institute details");
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={1} justifyContent="center" className="textField-root">
        {/* Contract & Institute Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Contract & Institute Information
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField 
            label="Contract Type" 
            name="contractType" 
            value={data.contractType} 
            onChange={handleChange} 
            fullWidth 
            margin="dense" 
            select
            required
          >
            <MenuItem value="">Select</MenuItem>
            {contractTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField 
            label="Institute Type" 
            name="instituteType" 
            value={data.instituteType} 
            onChange={handleChange} 
            fullWidth 
            margin="dense" 
            select
            required
          >
            <MenuItem value="">Select</MenuItem>
            {instituteTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField 
            label="University" 
            name="university" 
            value={data.university} 
            onChange={handleChange} 
            fullWidth 
            margin="dense" 
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField 
            label="Commission Percentage" 
            name="commissionPercent" 
            type="number"
            value={data.commissionPercent} 
            onChange={handleChange} 
            fullWidth 
            margin="dense"
            inputProps={{ 
              step: "0.01", 
              min: "0", 
              max: "100",
              placeholder: "0.00 %"
            }}
            required
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField 
            label="Status" 
            name="status" 
            value={data.status} 
            onChange={handleChange} 
            fullWidth 
            margin="dense" 
            select
            required
          >
            <MenuItem value="">Select Status</MenuItem>
            {statusOptions.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Conducted By"
            name="conductedBy"
            value={data.conductedBy || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
            required
          >
            <MenuItem value="">
              <em>Select an option</em>
            </MenuItem>
            {conductedByOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
        {/* Additional Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
            Additional Information
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <TextField 
            label="Remarks" 
            name="remark" 
            value={data.remark} 
            onChange={handleChange} 
            fullWidth 
            margin="dense" 
            multiline
            rows={3}
          />
        </Grid>
        
        {/* Submit Button */}
        <Grid item xs={12} sx={{ mt: 2, textAlign: 'right' }}>
          {msg && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1, 
                color: msg.includes('success') ? 'success.main' : 'error.main' 
              }}
            >
              {msg}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
