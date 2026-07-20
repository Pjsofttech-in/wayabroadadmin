import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Card, Row, Col, Typography, message } from "antd";
import { Box, Grid, CircularProgress, useTheme } from "@mui/material";
import { partnerService } from "./partnerService";
import PartnerFilter from './PartnerFilter';
import PartnerDetailsModal from './PartnerDetailsModal';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import PatnerInfo from './PatnerInfo';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import LoadingOverlay from '../Common/LoadingOverlay';
import AlertService from '../Common/AlertService';

// Helper function to normalize status values for comparison
const normalizeStatus = (status) => {
  if (!status) return '';
  return status.toString().toLowerCase().replace(/\s+/g, '_').trim();
};

const PartnerList = () => {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [viewPartner, setViewPartner] = useState(null);
  const [conductedByOptions, setConductedByOptions] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [totalPartnersCount, setTotalPartnersCount] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });

  const ALL_STATUSES = useMemo(() => ([
    { value: 'interested', label: 'Interested', color: '#4caf50' },
    { value: 'not_interested', label: 'Not Interested', color: '#f44336' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: '#2196f3' },
    { value: 'onboard', label: 'Onboard', color: '#9c27b0' },
    { value: 'ringing', label: 'Ringing', color: '#ff9800' },
  ]), []);
  
  // Create a map for quick status lookup
  const statusMap = useMemo(() => {
    return ALL_STATUSES.reduce((acc, status) => {
      acc[status.value] = status;
      // Also map by label for case-insensitive matching
      acc[status.label.toLowerCase()] = status;
      return acc;
    }, {});
  }, [ALL_STATUSES]);

  // Create a map for status colors
  const statusColorMap = useMemo(() => {
    return ALL_STATUSES.reduce((acc, status) => {
      acc[status.value] = status.color;
      return acc;
    }, {});
  }, [ALL_STATUSES]);

  const [filters, setFilters] = useState({
    name: '',
    email: '',
    businessEmail: '',
    instituteType: '',
    contractType: '',
    conductedBy: '',
    status: ''
  });

  const fetchPartners = useCallback(async (page = 1, pageSize = 25) => {
    try {
      setLoading(true);
      // Show loading overlay
      const result = await partnerService.getAllPartners(page - 1, pageSize);

      if (result && Array.isArray(result.content)) {
        setPartners(result.content);
        setFilteredPartners(result.content);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: result.totalElements || 0,
        }));
        setTotalPartnersCount(result.totalElements || 0);
      } else {
        setPartners([]);
        setFilteredPartners([]);
        setTotalPartnersCount(0);
        if (result && result.error) {
          message.error(result.error);
        }
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      AlertService.error('Failed to fetch partners. Please try again later.');
      setPartners([]);
      setFilteredPartners([]);
      setTotalPartnersCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts = await partnerService.getStatusWiseCount();
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching status counts:', error);
      // Set default empty counts
      const defaultCounts = {};
      ALL_STATUSES.forEach(status => {
        defaultCounts[status.value] = 0;
      });
      setStatusCounts(defaultCounts);
    }
  }, [ALL_STATUSES]);

  const fetchConductedByOptions = useCallback(async () => {
    try {
      const options = await partnerService.getConductedByOptions();
      setConductedByOptions(options);
    } catch {
      console.error('Error fetching conducted by options:');
      setConductedByOptions([
        { conductBy: "Poonam" },
        { conductBy: "Rohini" },
        { conductBy: "Siddhi" },
        { conductBy: "Radhika" },
        { conductBy: "Padam Sir" }
      ]);
    }
  }, []);

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    const email = sessionStorage.getItem('email');
    if (!role || !email) {
      const storedRole = localStorage.getItem('role') || 'admin';
      const storedEmail = localStorage.getItem('email') || 'admin@example.com';
      sessionStorage.setItem('role', storedRole);
      sessionStorage.setItem('email', storedEmail);
    }
    
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPartners(),
        fetchConductedByOptions(),
        fetchStatusCounts()
      ]);
      setLoading(false);
    };
    
    fetchData();
  }, [fetchPartners, fetchConductedByOptions, fetchStatusCounts]);

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedPartner(null);
  };

  const handleUpdatePartner = (updatedPartner) => {
    if (!updatedPartner?.id) {
      message.error('Failed to update partner: Invalid data');
      return;
    }
    const updateList = (list) => list.map(p => (p.id === updatedPartner.id ? { ...p, ...updatedPartner } : p));
    setPartners(updateList);
    setFilteredPartners(updateList);
    if (viewPartner && viewPartner.id === updatedPartner.id) {
      setViewPartner(updatedPartner);
    }
    message.success('Partner updated successfully');
    // Refresh status counts after update
    fetchStatusCounts();
  };

  const handleDeletePartner = (deletedPartnerId) => {
    if (!deletedPartnerId) {
      message.error('Failed to delete partner: Invalid ID');
      return;
    }
    const filterList = (list) => list.filter(p => p.id !== deletedPartnerId);
    setPartners(filterList);
    setFilteredPartners(filterList);
    message.success('Partner deleted successfully');
    // Refresh status counts after delete
    fetchStatusCounts();
  };

  const handleViewPartner = (partner) => {
    setViewPartner(partner);
    setInfoDialogOpen(true);
  };
  
  const handleCloseInfoDialog = () => {
    setInfoDialogOpen(false);
    setViewPartner(null);
  };

  const handleTableChange = (newPagination) => {
    fetchPartners(newPagination.current, newPagination.pageSize);
  };

  const handleEditFromDialog = (partner) => {
    setInfoDialogOpen(false);
    setViewPartner(null);
    const partnerWithDefaults = {
      ...partner,
      id: partner.id || partner.key,
      partnerName: partner.partnerName || partner.name,
      partnerEmail: partner.partnerEmail || partner.email,
      remark: partner.remark || partner.remarks
    };
    setSelectedPartner(partnerWithDefaults);
    setIsModalVisible(true);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, render: (text) => text || 'N/A' },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (text, record) => (
        <span style={{ color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleViewPartner(record)}>
          {text || 'N/A'}
        </span>
      ),
    },
    { title: 'Business Email', dataIndex: 'businessEmail', key: 'businessEmail', sorter: (a, b) => (a.businessEmail || '').localeCompare(b.businessEmail || ''), render: (text) => text || 'N/A' },
    { title: 'Business Contact', dataIndex: 'businessContact', key: 'businessContact', render: (text) => text || 'N/A' },
    {
      title: 'Institute Type',
      dataIndex: 'instituteType',
      key: 'instituteType',
      filters: [
        { text: 'Private', value: 'private' },
        { text: 'Government', value: 'government' },
        { text: 'Deemed University', value: 'deemed_university' },
        { text: 'College', value: 'college' },
        { text: 'Agency', value: 'agency' },
      ],
      onFilter: (value, record) => record.instituteType === value,
      render: (text) => text ? text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
    },
    {
      title: 'Contract Type',
      dataIndex: 'contractType',
      key: 'contractType',
      filters: [
        { text: 'Standard', value: 'standard' },
        { text: 'Premium', value: 'premium' },
        { text: 'Enterprise', value: 'enterprise' },
        { text: 'Custom', value: 'custom' },
      ],
      onFilter: (value, record) => record.contractType === value,
      render: (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : 'N/A',
    },
    {
      title: 'Conducted By',
      dataIndex: 'conductedBy',
      key: 'conductedBy',
      filters: conductedByOptions.map(option => ({ text: option.conductBy, value: option.conductBy.toLowerCase().replace(/\s+/g, '_') })),
      onFilter: (value, record) => (record.conductedBy || '').toLowerCase().replace(/\s+/g, '_') === value,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: ALL_STATUSES.map(s => ({
        text: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: s.color,
                flexShrink: 0
              }}
            />
            <span>{s.label}</span>
          </div>
        ),
        value: s.value
      })),
      onFilter: (value, record) => {
        const recordStatus = normalizeStatus(record.status);
        const filterStatus = normalizeStatus(value);
        return recordStatus === filterStatus;
      },
      render: (status) => {
        // Normalize the status for comparison
        const normalizedStatus = normalizeStatus(status);
        // Find the status object, handling case and space variations
        const statusObj = ALL_STATUSES.find(s => 
          s.value === normalizedStatus || 
          normalizeStatus(s.label) === normalizedStatus ||
          s.label.toLowerCase() === status?.toLowerCase()
        ) || {};
        
        // Use the status label if found, otherwise format the status text
        const displayText = statusObj.label || (status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A');
        
        // Get the color from the status object or use default gray
        const bgColor = statusObj.color || '#d9d9d9';
        
        // Get the count for this status using the normalized status value
        const count = statusObj.value ? (statusCounts[statusObj.value] || 0) : 0;
        
        return (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '16px',
                backgroundColor: `${bgColor}20`,
                color: bgColor,
                border: `1px solid ${bgColor}`,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                minWidth: '120px',
                fontSize: '0.85em',
                textTransform: 'capitalize'
              }}
            >
              {displayText}
              {count > 0 && (
                <span 
                  style={{
                    backgroundColor: bgColor,
                    color: 'white',
                    borderRadius: '10px',
                    padding: '0 6px',
                    fontSize: '0.75em',
                    fontWeight: 'bold',
                    minWidth: '20px',
                    textAlign: 'center',
                    lineHeight: '18px'
                  }}
                >
                  {count}
                </span>
              )}
            </span>
          </div>
        );
      },
    },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', ellipsis: true, render: (text) => text || 'N/A' },
  ];

  const normalizeValue = (value) => (value || '').toString().trim().toLowerCase();

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    let filtered = partners.filter(partner => {
      return (
        (!newFilters.name || normalizeValue(partner.partnerName || partner.name).includes(normalizeValue(newFilters.name))) &&
        (!newFilters.email || normalizeValue(partner.partnerEmail || partner.email).includes(normalizeValue(newFilters.email))) &&
        (!newFilters.businessEmail || normalizeValue(partner.businessEmail).includes(normalizeValue(newFilters.businessEmail))) &&
        (!newFilters.instituteType || normalizeValue(partner.instituteType) === normalizeValue(newFilters.instituteType)) &&
        (!newFilters.contractType || normalizeValue(partner.contractType) === normalizeValue(newFilters.contractType)) &&
        (!newFilters.conductedBy || normalizeValue(partner.conductedBy) === normalizeValue(newFilters.conductedBy)) &&
        (!newFilters.status || normalizeValue(partner.status) === normalizeValue(newFilters.status))
      );
    });
    setFilteredPartners(filtered);
  };

  // Calculate status counts for the entire dataset
  const calculateStatusCounts = useCallback((partners) => {
    const counts = {};
    
    // Initialize all status counts to 0
    ALL_STATUSES.forEach(status => {
      counts[status.value] = 0;
    });
    
    // Count each status, handling case and space variations
    partners.forEach(partner => {
      if (partner.status) {
        const normalizedStatus = normalizeStatus(partner.status);
        
        // First try to find by normalized value
        let matchedStatus = ALL_STATUSES.find(s => 
          s.value === normalizedStatus
        );
        
        // If not found, try to find by label match
        if (!matchedStatus) {
          matchedStatus = ALL_STATUSES.find(s => 
            normalizeStatus(s.label) === normalizedStatus ||
            s.label.toLowerCase() === partner.status?.toLowerCase()
          );
        }
        
        if (matchedStatus) {
          counts[matchedStatus.value] = (counts[matchedStatus.value] || 0) + 1;
        }
      }
    });
    
    return counts;
  }, [ALL_STATUSES]);
  
  // Use the total count from API instead of current page
  const totalPartners = totalPartnersCount;

  const normalizedData = filteredPartners.map(partner => {
    let conductedBy = partner.conductedBy || '';
    if (typeof conductedBy === 'object' && conductedBy.conductBy) {
      conductedBy = conductedBy.conductBy;
    }
    return {
      ...partner,
      key: partner.id,
      name: partner.partnerName || partner.businessName || partner.name || '',
      email: partner.partnerEmail || partner.businessEmail || partner.email || '',
      contact: partner.partnerContact || partner.businessContact || partner.contact || '',
      businessEmail: partner.businessEmail || '',
      businessContact: partner.businessContact || '',
      mobileNo: partner.mobileNo || '',
      instituteType: partner.instituteType ? partner.instituteType.toLowerCase() : '',
      contractType: partner.contractType ? partner.contractType.toLowerCase() : '',
      conductedBy: conductedBy,
      status: partner.status ? partner.status.toLowerCase() : 'pending',
      remarks: partner.remark || partner.remarks || ''
    };
  });

  return (
    <>
      <LoadingOverlay loading={loading} />
      <Box p={2}>
        <Box sx={{ marginBottom: '24px' }}>
          <PartnerFilter 
            filters={filters}
            onFilterChange={handleFilterChange} 
            conductedByOptions={conductedByOptions} 
            statusOptions={ALL_STATUSES}
          />
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 2, 
              p: 1.5, 
              bgcolor: 'background.paper', 
              borderRadius: 1, 
              boxShadow: 1,
              border: '1px solid #e0e0e0',
              flexWrap: 'wrap'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 1,
                fontWeight: 'medium',
                fontSize: '0.9rem',
                minWidth: '100px',
                justifyContent: 'center'
              }}>
                Total: {loading ? 
                  <CircularProgress size={16} color="inherit" sx={{ ml: 1 }} /> : 
                  totalPartners.toLocaleString()
                }
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap', 
                alignItems: 'center',
                flex: 1,
                justifyContent: 'space-between'
              }}>
                {ALL_STATUSES.map((status) => (
                  <Box
                    key={status.value}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: `1px solid ${status.color}`,
                      color: status.color,
                      minWidth: '140px',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: 'transparent',
                      pointerEvents: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    {status.label}
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: '#fff',
                        color: status.color,
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        border: `1px solid ${status.color}`,
                        boxSizing: 'border-box'
                      }}
                    >
                      {statusCounts[status.value] || 0}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Card>
          <Table
              columns={columns}
              dataSource={normalizedData}
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} partners`,
                pageSizeOptions: ['25', '50', '100', '500', '1000']
              }}
              onChange={handleTableChange}
              rowKey="id"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Box>

      {viewPartner && (
        <Dialog open={infoDialogOpen} onClose={handleCloseInfoDialog} fullWidth maxWidth="md">
          <DialogTitle>
            Partner Information
            <IconButton aria-label="edit" onClick={() => handleEditFromDialog(viewPartner)} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <EditIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <PatnerInfo partner={viewPartner} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PartnerList;
