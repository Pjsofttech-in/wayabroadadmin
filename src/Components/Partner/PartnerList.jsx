import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Card, Typography, message } from "antd";
import { Box, CircularProgress } from "@mui/material";
import { partnerService } from "./partnerService";
import PartnerFilter from './PartnerFilter';
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
        (!newFilters.status || normalizeStatus(partner.status) === normalizeStatus(newFilters.status))
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

      <Box
        sx={{
          width: '100%',
          minWidth: 0,
          p: { xs: 0.75, sm: 1 },
          boxSizing: 'border-box',
        }}
      >
        {/* Partner Overview - follows Application Overview card styling */}
        <Box
          sx={{
            width: '100%',
            mb: 1,
            p: 1,
            bgcolor: '#fbfcfe',
            border: '1px solid #e4e9ef',
            borderRadius: '6px',
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(6, minmax(0, 1fr))',
              },
              width: '100%',
              '& > *': { minWidth: 0 },
              gap: 0.75,
            }}
          >
            {[
              {
                value: 'total',
                label: 'Total Partners',
                count: totalPartners,
                color: '#1890ff',
              },
              ...ALL_STATUSES.map((status) => ({
                value: status.value,
                label: status.label,
                count: statusCounts[status.value] || 0,
                color: status.color,
              })),
            ].map((item) => {
              const isSelected = item.value !== 'total' &&
                normalizeStatus(filters.status) === item.value;

              return (
                <Box
                  key={item.value}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.65,
                    minWidth: 0,
                    minHeight: 43,
                    px: 1,
                    py: 0.75,
                    bgcolor: '#fff',
                    border: `1px solid ${isSelected ? item.color : '#e4e9ef'}`,
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 0.6,
                      minWidth: 0,
                      flex: 1,
                      flexWrap: 'nowrap',
                    }}
                  >
                    <Typography
                      noWrap
                      title={item.label}
                      sx={{
                        color: '#344054',
                        fontSize: '0.70rem',
                        fontWeight: 500,
                        lineHeight: 1.3,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        color: item.color,
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {loading && item.value === 'total'
                        ? <CircularProgress size={12} />
                        : Number(item.count || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 1, minWidth: 0 }}>
          <PartnerFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            conductedByOptions={conductedByOptions}
            statusOptions={ALL_STATUSES}
          />
        </Box>

        {/* Partner table - compact Application List table styling */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 6,
            overflow: 'hidden',
            borderColor: '#e4e9ef',
            boxShadow: 'none',
          }}
        >
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              overflow: 'hidden',
              '& .ant-table-wrapper': { maxWidth: '100%' },
              '& .ant-table': {
                fontSize: 13,
                color: '#344054',
              },
              '& .ant-table-container': {
                borderInlineStart: 0,
                borderTop: 0,
              },
              '& .ant-table-thead > tr > th': {
                background: '#f8fafc',
                color: '#183b56',
                fontWeight: 600,
                fontSize: '0.72rem',
                lineHeight: 1.35,
                borderBottom: '1px solid #e4e9ef',
                padding: '9px 10px',
                whiteSpace: 'nowrap',
              },
              '& .ant-table-tbody > tr > td': {
                padding: '9px 10px',
                fontSize: '0.78rem',
                borderBottom: '1px solid #edf1f5',
                color: '#344054',
              },
              '& .ant-table-tbody > tr:hover > td': {
                background: '#f7faff',
              },
              '& .ant-table-tbody > tr:last-child > td': {
                borderBottom: 0,
              },
              '& .ant-pagination': {
                margin: '10px 12px',
                fontSize: '0.75rem',
              },
              '& .ant-pagination .ant-pagination-total-text': {
                color: '#344054',
                fontSize: '0.75rem',
              },
            }}
          >
            <Table
              columns={columns}
              dataSource={normalizedData}
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} partners`,
                pageSizeOptions: ['25', '50', '100', '500', '1000'],
              }}
              onChange={handleTableChange}
              rowKey="id"
              scroll={{ x: 'max-content' }}
              size="small"
            />
          </Box>
        </Card>
      </Box>

      {viewPartner && (
        <Dialog
          open={infoDialogOpen}
          onClose={handleCloseInfoDialog}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Partner Information
            <IconButton
              aria-label="edit"
              onClick={() => handleEditFromDialog(viewPartner)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
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
