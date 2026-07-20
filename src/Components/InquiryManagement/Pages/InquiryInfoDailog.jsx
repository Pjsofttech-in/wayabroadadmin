import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import LeadFollowUps from './LeadFollowUps';
import { getVisitsByLeadId } from './leadService';

export const InquiryInfoDailog = ({
  open,
  onClose,
  inquiry,
  isEditing,
  onEdit,
}) => {
  const [currentInquiry, setCurrentInquiry] = useState(inquiry);
  const [activeTab, setActiveTab] = useState(0);
  const [latestVisitStatus, setLatestVisitStatus] = useState(null);

  useEffect(() => {
    setCurrentInquiry(inquiry);
    setActiveTab(0);
    // Fetch latest follow-up status for the profile card using getVisitsByLeadId
    if (inquiry?.id) {
      const role = sessionStorage.getItem('role');
      const email = sessionStorage.getItem('email');
      getVisitsByLeadId(inquiry.id, role, email)
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setLatestVisitStatus(data[0].status || null);
          } else {
            setLatestVisitStatus(null);
          }
        })
        .catch(() => setLatestVisitStatus(null));
    } else {
      setLatestVisitStatus(null);
    }
  }, [inquiry]);

  const email = sessionStorage.getItem('email');
  const role = sessionStorage.getItem('role');

  if (!currentInquiry) return null;

  // Tab field groupings
  const profileFields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone_no', label: 'Phone No' },
    { key: 'gender', label: 'Gender' },
    { key: 'hasPassport', label: 'Passport' },
    { key: 'passportNo', label: 'Passport No' },
  ];
  // Education summary fields for the card
  const educationSummaryFields = [
    { key: 'stream', label: 'Stream' },
    { key: 'course', label: 'Course' },
    { key: 'university', label: 'University' },
    { key: 'college', label: 'College' },
    { key: 'applyFor', label: 'Apply For' },
    { key: 'continent', label: 'Continent' },
  ];
  const educationFields = [
    { key: 'percentage', label: 'Percentage' },
    { key: 'gap', label: 'Gap' },
    { key: 'gapYear', label: 'Gap Year' },
    { key: 'stream', label: 'Stream' },
    { key: 'course', label: 'Course' },
    { key: 'university', label: 'University' },
    { key: 'college', label: 'College' },
    { key: 'applyFor', label: 'Apply For' },
    { key: 'continent', label: 'Continent' },
    { key: 'country', label: 'Country' },
  ];
  const otherFields = [
    { key: 'fathersOccupation', label: "Father's Occupation" },
    { key: 'fathersIncome', label: "Father's Income" },
    { key: 'fatherNumber', label: "Father's Phone" },
    { key: 'fatherITR', label: "Father's ITR" },
    { key: 'amountITR', label: 'ITR Amount' },
    { key: 'yearITR', label: 'ITR Year' },
    { key: 'source', label: 'Source' },
    { key: 'remark', label: 'Remark' },
    { key: 'loanRequirement', label: 'Loan Requirement' },
    { key: 'year', label: 'Loan Year' },
    { key: 'amount', label: 'Loan Amount' },
    { key: 'enquiry_date', label: 'Enquiry Date' },
  ];

  const getValue = (key) => currentInquiry && currentInquiry[key];
  const avatarUrl = currentInquiry.photo || '';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      
        <DialogContent sx={{ p: 0, background: '#f9f9f9' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Profile" />
              <Tab label="Apply For" />
              <Tab label="Other Info" />
              <Tab label="Follow Ups" />
            </Tabs>
          </Box>
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <Grid container spacing={0}>
                <Grid item xs={12} md={4} lg={3}>
                  <Card elevation={2} sx={{ p: 3, m: 2, textAlign: 'center', borderRadius: 2 }}>
                    <Avatar
                      src={avatarUrl}
                      alt={currentInquiry.name}
                      sx={{ width: 100, height: 100, margin: 'auto', mb: 2, border: '2px solid #ccc' }}
                    >
                      {currentInquiry.name?.[0] || '?'}
                    </Avatar>
                    <Typography variant="h6" sx={{ mb: 1 }}>{currentInquiry.name}</Typography>
                    <Stack spacing={0.5} alignItems="center">
                      {profileFields.map(({ key, label }) => (
                        getValue(key) !== undefined && getValue(key) !== null && getValue(key) !== '' && key !== 'name' && (
                          <Typography key={key} variant="body2" color={key === 'email' ? 'primary' : 'textSecondary'}>
                            <span style={{ fontWeight: 500 }}>{label}:</span> {getValue(key)}
                          </Typography>
                        )
                      ))}
                      {latestVisitStatus && (
                        <Typography variant="body2" color="textSecondary">
                          <span style={{ fontWeight: 500 }}>Status:</span> {latestVisitStatus}
                        </Typography>
                      )}
                      {/* Education summary below personal info */}
                      <Divider sx={{ my: 1, width: '80%' }} />
                      <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1, mb: 0.5 }}>Education Info</Typography>
                      {educationSummaryFields.map(({ key, label }) => (
                        getValue(key) !== undefined && getValue(key) !== null && getValue(key) !== '' && (
                          <Typography key={key} variant="body2" color="textSecondary">
                            <span style={{ fontWeight: 500 }}>{label}:</span> {getValue(key)}
                          </Typography>
                        )
                      ))}
                    </Stack>
                  </Card>
                </Grid>
                <Grid item xs={12} md={8} lg={9}>
                  <Card elevation={0} sx={{ p: 3, m: 2, borderRadius: 2 }}>
                    
                   
                    <Grid container spacing={2}>
                      {[...profileFields.slice(1), // skip name (already shown)
                        { key: 'address', label: 'Address' },
                        { key: 'landmark', label: 'Landmark' },
                        { key: 'city', label: 'City' },
                        { key: 'state', label: 'State' },
                        { key: 'district', label: 'District' },
                        { key: 'pincode', label: 'Pincode' },
                        ...educationSummaryFields
                      ].map(({ key, label }) => (
                        getValue(key) !== undefined && getValue(key) !== null && getValue(key) !== '' && (
                          <Grid item xs={12} sm={6} key={key}>
                            <Typography variant="subtitle2" color="textSecondary">{label}</Typography>
                            <Typography variant="body1" gutterBottom>{getValue(key)}</Typography>
                          </Grid>
                        )
                      ))}
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            )}
            {activeTab === 1 && (
              <Card elevation={0} sx={{ p: 3, m: 2, borderRadius: 2 }}>
                
               
                <Grid container spacing={2}>
                  {[...educationSummaryFields, ...educationFields.filter(f => !educationSummaryFields.some(ef => ef.key === f.key))].map(({ key, label }) => (
                    getValue(key) !== undefined && getValue(key) !== null && getValue(key) !== '' && (
                      <Grid item xs={12} sm={6} key={key}>
                        <Typography variant="subtitle2" color="textSecondary">{label}</Typography>
                        <Typography variant="body1" gutterBottom>{getValue(key)}</Typography>
                      </Grid>
                    )
                  ))}
                </Grid>
              </Card>
            )}
            {activeTab === 2 && (
              <Card elevation={0} sx={{ p: 3, m: 2, borderRadius: 2 }}>
                
                <Grid container spacing={2}>
                  {otherFields.map(({ key, label }) => (
                    getValue(key) !== undefined && getValue(key) !== null && getValue(key) !== '' && (
                      <Grid item xs={12} sm={6} key={key}>
                        <Typography variant="subtitle2" color="textSecondary">{label}</Typography>
                        <Typography variant="body1" gutterBottom>{getValue(key)}</Typography>
                      </Grid>
                    )
                  ))}
                </Grid>
              </Card>
            )}
            {activeTab === 3 && (
              <Card elevation={0} sx={{ p: 2, m: 1, mt: -4, borderRadius: 2 }}>
                <LeadFollowUps
                  leadId={currentInquiry.id}
                  open={true}
                  onClose={() => {}}
                  role={role}
                  email={email}
                  onStatusChange={status => setLatestVisitStatus(status)}
                />
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Box flexGrow={1} />
          {!isEditing && (
            <Button onClick={onEdit} color="primary" variant="contained">
              Edit
            </Button>
          )}
          <Button onClick={onClose} color="primary" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};