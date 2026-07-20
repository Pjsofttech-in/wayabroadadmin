import React, { useState } from "react";
import { partnerService } from './partnerService';
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  StepContent,
  Snackbar,
  Alert,
  StepConnector,
  stepConnectorClasses,
  styled,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description';
import Check from '@mui/icons-material/Check';
import PartnerDetails from "./PartnerDetails";
import InstituteDetails from "./InstituteDetails";
import DocumentUpload from "./DocumentUpload";

const steps = [
  { label: "Partner Details", icon: <PersonIcon /> },
  { label: "Institute Details", icon: <SchoolIcon /> },
  { label: "Documents", icon: <DescriptionIcon /> }
];

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
  display: 'flex',
  height: 22,
  alignItems: 'center',
  ...(ownerState.active && {
    color: theme.palette.primary.main,
  }),
  '& .StepIcon-completedIcon': {
    color: theme.palette.primary.main,
    zIndex: 1,
    fontSize: 18,
  },
  '& .StepIcon-circle': {
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

function StepIcon(props) {
  const { active, completed, className, icon } = props;

  return (
    <StepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <Check className="StepIcon-completedIcon" />
      ) : (
        <div className="StepIcon-circle">
          {icon}
        </div>
      )}
    </StepIconRoot>
  );
}



export default function AddPartner() {
  const [activeStep, setActiveStep] = useState(0);
  const [msg, setMsg] = useState({ open: false, text: "", severity: "success" });
  const [files, setFiles] = useState({});
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

  const handleSubmit = async () => {
    try {
      const partnerData = {
        ...formData,
        conductedBy: !formData.conductedBy ? 'Web' : (formData.conductedBy === 'web' ? 'Web' : formData.conductedBy),
        role: formData.role || "partner"
      };
      
      // Create the partner first
      const createdPartner = await partnerService.createPartner(partnerData);
      
      // If there are files to upload, do it after creating the partner
      if (Object.keys(files).length > 0) {
        const documentData = {
          contractPdf: files.contractPdf,
          commissionAgreementPdf: files.commissionPdf,
          panCard: files.panPdf,
          gstCertificate: files.gstPdf
        };
        
        await partnerService.uploadPartnerDocuments(
          createdPartner.id,
          documentData,
          partnerData.role,
          partnerData.partnerEmail
        );
      }

      setMsg({
        open: true,
        text: "Partner created successfully!",
        severity: "success"
      });

      // Reset form data
      setFormData({
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
      
      return createdPartner; // Return the created partner for chaining
    } catch (error) {
      console.error("Error creating partner:", error);
      setMsg({
        open: true,
        text: error.response?.data?.message || "Error creating partner. Please try again.",
        severity: "error"
      });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (name, file) => {
    setFiles({ ...files, [name]: file });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };



  const handleCloseSnackbar = () => {
    setMsg({ ...msg, open: false });
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <PartnerDetails data={formData} onChange={handleChange} />
            {/* <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="conductedBy-label">Conducted By</InputLabel>
              <Select
                labelId="conductedBy-label"
                id="conductedBy"
                name="conductedBy"
                value={formData.conductedBy}
                label="Conducted By"
                onChange={handleChange}
              >
                {conductedByOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl> */}
          </>
        );
      case 1:
        return <InstituteDetails data={formData} onChange={handleChange} />;
      case 2:
        return (
          <DocumentUpload 
            files={files} 
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
            onUploadComplete={() => {
              // Reset form and files after successful submission
              setFiles({});
              setActiveStep(0);
            }}
          />
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Create New Partner
      </Typography>

      <Stepper 
        activeStep={activeStep} 
        alternativeLabel 
        connector={<QontoConnector />}
        sx={{ 
          mb: 6, 
          px: 2,
          '& .MuiStepLabel-root': {
            padding: '0 8px',
          },
          '& .MuiStepLabel-label': {
            fontSize: '0.8rem',
            fontWeight: 500,
            marginTop: '8px',
            '&.Mui-active, &.Mui-completed': {
              color: (theme) => theme.palette.text.primary,
              fontWeight: 600,
            },
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel 
              StepIconComponent={StepIcon}
              StepIconProps={{
                icon: index + 1,
                completed: activeStep > index,
                active: activeStep === index,
              }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ my: 4 }}>
        {getStepContent(activeStep)}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              size="large"
              sx={{ minWidth: 120 }}
            >
              Submit
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              size="large"
              sx={{ minWidth: 120 }}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>

      <Snackbar
        open={msg.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={msg.severity} sx={{ width: '100%' }}>
          {msg.text}
        </Alert>
      </Snackbar>
    </>
  );
}
