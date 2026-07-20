import React, { useEffect, useState, useMemo } from "react";
import { Table, message } from "antd";
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Link,
  Paper,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from "@mui/material";
import { getPersonalAcademicInfo, updateAdmissionForm, getAllAdmissionForms, getApplicationStatusCounts } from './AbroadApplicationService';
import ApplicationEditDialog from './ApplicationEditDialog';
import ApplicationFilter from './ApplicationFilter';

const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  
  const [branchLoading, setBranchLoading] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [statusCounts, setStatusCounts] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    country: '',
    university: '',
    status: '',
    search: ''
  });
  
  // Extract unique countries and universities for filter options
  const countries = useMemo(() => {
    const uniqueCountries = new Set();
    applications.forEach(app => app.country && uniqueCountries.add(app.country));
    return Array.from(uniqueCountries).sort();
  }, [applications]);
  
  const universities = useMemo(() => {
    const uniqueUnis = new Set();
    applications.forEach(app => app.university && uniqueUnis.add(app.university));
    return Array.from(uniqueUnis).sort();
  }, [applications]);

  const fetchApplications = async (branchCode = selectedBranch) => {
    try {
      setLoading(true);
      
      // Fetch all admission forms from the API
      const data = await getAllAdmissionForms();
      
      // Filter by branch if specified
      let filteredData = data;
      if (branchCode) {
        filteredData = data.filter(app => app.branchCode === branchCode);
      }

      setApplications(filteredData);
    } catch (error) {
      message.error("Failed to load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setBranchLoading(true);

      // Fetch all applications to extract unique branches
      const allApplications = await getAllAdmissionForms();
      
      // Extract unique branches from applications
      const branchSet = new Set();
      allApplications.forEach(app => {
        if (app.branchCode) {
          branchSet.add(JSON.stringify({
            id: app.branchCode,
            name: app.branchCode // You might want to map this to actual branch names
          }));
        }
      });
      
      const branchesData = Array.from(branchSet).map(b => JSON.parse(b));
      setBranches(branchesData);

      // Auto-select user's branch if available
      const userBranch = sessionStorage.getItem("branchCode");
      if (userBranch) {
        setSelectedBranch(userBranch);
        await fetchApplications(userBranch);
      } else {
        // If no user branch, load all applications
        await fetchApplications();
      }
    } catch (error) {
      message.error("Failed to load branches");
      await fetchApplications(); // Still try to load applications
    } finally {
      setBranchLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchStatusCounts();
  }, []);

  // Handle branch change
  const fetchStatusCounts = async () => {
    try {
      setStatusLoading(true);
      // Get user's info from session storage
      const userBranch = sessionStorage.getItem('branchCode') || '';
      const userEmail = sessionStorage.getItem('email') || '';
      const userRole = sessionStorage.getItem('role') || '';
      
      let counts;
      
      // For admin users
      if (userRole === 'ADMIN' || userRole === 'admin') {
        // If admin has selected a specific branch, show only that branch's counts
        if (selectedBranch) {
          counts = await getApplicationStatusCounts(selectedBranch);
        } 
        // If no branch selected, show all counts (admin can see all)
        else {
          counts = await getApplicationStatusCounts();
        }
      }
      // For branch users, always filter by their branch
      else if (userBranch) {
        counts = await getApplicationStatusCounts(userBranch);
      }
      // For staff users, filter by their email
      else if (userEmail) {
        counts = await getApplicationStatusCounts('', userEmail);
      }
      // Fallback (shouldn't normally reach here)
      else {
        counts = { statusCounts: {}, total: 0 };
      }
      
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching status counts:', error);
      message.error('Failed to load status counts');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleBranchChange = async (event) => {
    const branchCode = event.target.value;
    setSelectedBranch(branchCode);
    await Promise.all([
      fetchApplications(branchCode),
      fetchStatusCounts()
    ]);
  };

  const handleEditClick = (e, application) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingApplication(application);
    setIsEditDialogOpen(true);
  };

  const handleSaveApplication = async (updatedData) => {
    try {
      // Get user role and email from session storage or context
      const userRole = sessionStorage.getItem('role') || 'admin'; // Default to 'admin' if not found
      const userEmail = sessionStorage.getItem('email') || ''; // Get user's email
      
      // Call your API to update the application
      await updateAdmissionForm(editingApplication.id, updatedData, userRole, userEmail);
      
      // Update the local state
      setApplications(prev => prev.map(app => 
        app.id === editingApplication.id ? { ...app, ...updatedData } : app
      ));
      
      message.success('Application updated successfully');
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update application');
      return false;
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    try {
      // Remove the deleted application from the local state
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      message.success('Application deleted successfully');
      return true;
    } catch (error) {
      console.error('Error handling delete:', error);
      message.error('Failed to update application list');
      return false;
    }
  };

  // Define table columns for admission forms with proper formatting and responsiveness
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      fixed: 'left',
      width: 180,
      render: (_, record) => (
        <Link 
          component="button" 
          variant="body1"
          onClick={(e) => handleEditClick(e, record)}
          sx={{ textAlign: 'left', textTransform: 'none' }}
        >
          {record.fullName}
        </Link>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Alt Phone',
      dataIndex: 'alternatePhone',
      key: 'alternatePhone',
      width: 120,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
    },
    {
      title: 'DOB',
      dataIndex: 'dob',
      key: 'dob',
      width: 120,
      render: (dob) => dob ? new Date(dob).toLocaleDateString() : '-',
    },
    // Passport Information
    {
      title: 'Passport No',
      dataIndex: 'passportNo',
      key: 'passportNo',
      width: 150,
    },
    // Education Information
    {
      title: 'Course',
      dataIndex: 'course',
      key: 'course',
      width: 150,
    },
    {
      title: 'Stream',
      dataIndex: 'stream',
      key: 'stream',
      width: 120,
    },
    {
      title: 'Passout Year',
      dataIndex: 'passoutYear',
      key: 'passoutYear',
      width: 120,
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
    },
    // Application Details
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 120,
    },
    {
      title: 'University',
      dataIndex: 'university',
      key: 'university',
      width: 180,
    },
    {
      title: 'Intake',
      dataIndex: 'intake',
      key: 'intake',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <span style={{
          color: status === 'approved' ? 'green' : 
                status === 'rejected' ? 'red' : 
                status === 'pending' ? 'orange' : 'inherit',
          fontWeight: '500'
        }}>
          {status?.charAt(0).toUpperCase() + status?.slice(1) || '-'}
        </span>
      ),
    },
    {
    },
    {
      title: 'Created By',
      dataIndex: 'createdByEmail',
      key: 'createdByEmail',
    },
    {
      title: 'Branch',
      dataIndex: 'branchCode',
      key: 'branchCode',
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDateTime',
      key: 'createdDateTime',
      render: (date) => date ? new Date(date).toLocaleDateString() : '',
    },
  ];

  // Handle row click
  const handleRowClick = (record) => {
    setEditingApplication(record);
    setIsEditDialogOpen(true);
  };

  // Apply filters and sorting to applications
  const filteredApplications = useMemo(() => {
    // First filter the applications
    const filtered = applications.filter(app => {
      // Filter by branch
      if (selectedBranch && app.branchCode !== selectedBranch) return false;
      
      // Filter by country
      if (filters.country && app.country !== filters.country) return false;
      
      // Filter by university
      if (filters.university && app.university !== filters.university) return false;
      
      // Filter by status
      if (filters.status && app.status !== filters.status) return false;
      
      // Search by name or email
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!app.fullName?.toLowerCase().includes(searchLower) && 
            !app.email?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });

    // Then sort by createdDateTime (newest first)
    return [...filtered].sort((a, b) => {
      const dateA = a.createdDateTime ? new Date(a.createdDateTime) : new Date(0);
      const dateB = b.createdDateTime ? new Date(b.createdDateTime) : new Date(0);
      return dateB - dateA; // Sort in descending order (newest first)
    });
  }, [applications, filters, selectedBranch]);
  
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      country: '',
      university: '',
      status: '',
      search: ''
    });
  };

  const statusConfig = {
    // Main application statuses
    'applied': { color: '#1890ff', text: 'Applied' },
    'visa_accepted': { color: '#52c41a', text: 'Visa Accepted' },
    'visa_rejected': { color: '#f5222d', text: 'Visa Rejected' },
    'passport_issued': { color: '#13c2c2', text: 'Passport Issued' },
    'passport_rejected': { color: '#f5222d', text: 'Passport Rejected' },
    'doc_incomplete': { color: '#faad14', text: 'Doc Incomplete' },
    'app_proceed': { color: '#722ed1', text: 'App Proceed' },
    'adm_completed': { color: '#237804', text: 'Adm Completed' },
    // Additional statuses
    'visa_accepted': { color: '#52c41a', text: 'Visa Accepted' },
    'visa_rejected': { color: '#f5222d', text: 'Visa Rejected' },
    'passport_issued': { color: '#13c2c2', text: 'Passport Issued' },
    'passport_rejected': { color: '#f5222d', text: 'Passport Rejected' },
    'doc_incomplete': { color: '#faad14', text: 'Doc Incomplete' },
    'app_proceed': { color: '#722ed1', text: 'App Proceed' }
  };
  
  // Helper function to get status config with fallback for unknown statuses
  const getStatusConfig = (status) => {
    // If status is in our config, return it
    if (statusConfig[status]) {
      return statusConfig[status];
    }
    
    // For any other status, return a default config
    return {
      color: '#d9d9d',
      text: status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    };
  };

  const renderStatusCounts = () => {
    if (statusLoading) {
      return <CircularProgress size={24} />;
    }

    if (!statusCounts) return null;

    // Get all statuses from statusConfig
    const allStatuses = Object.keys(statusConfig);
    
    // Initialize all statuses with count 0 or their actual count
    const statusCountsWithZeros = allStatuses.reduce((acc, status) => ({
      ...acc,
      [status]: (statusCounts.statusCounts && statusCounts.statusCounts[status]) || 0
    }), {});

    // Get the actual total count of all applications from statusCounts
    const totalApplications = statusCounts.total || 0;

    // Create an array of status items including the total count
    const statusItems = [
      {
        status: 'Total',
        count: totalApplications,
        config: { color: '#1890ff', text: 'Total Applications' }
      },
      ...Object.entries(statusCountsWithZeros).map(([status, count]) => ({
        status,
        count: parseInt(count) || 0,
        config: statusConfig[status] || getStatusConfig(status)
      }))
    ];

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Application Overview</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {statusItems.map(({ status, count, config }) => (
            <Box
              key={status}
              onClick={() => status !== 'Total' && handleFilterChange('status', status === 'all' ? '' : status)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: 'background.paper',
                boxShadow: 1,
                cursor: status === 'Total' ? 'default' : 'pointer',
                border: `1px solid ${filters.status === status ? config.color : '#f0f0f0'}`,
                '&:hover': {
                  boxShadow: status === 'Total' ? 1 : 3,
                },
                minWidth: '140px',
                flex: '1 1 160px',
                maxWidth: '220px',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: config.color,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography 
                  variant="body2" 
                  noWrap 
                  sx={{ 
                    fontWeight: 500, 
                    color: 'text.secondary',
                    fontSize: '0.85rem'
                  }}
                >
                  {config.text}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: config.color,
                    fontSize: '1.25rem',
                    lineHeight: 1.2
                  }}
                >
                  {count.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {renderStatusCounts()}
      <ApplicationFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        countries={countries}
        universities={universities}
      />
      <Box sx={{ mt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredApplications}
            rowKey="id"
            loading={loading}
            pagination={{ 
              pageSize: 25,
              position: ['bottomRight'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} applications`
            }}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record)
            })}
            rowClassName="cursor-pointer"
            style={{
              whiteSpace: 'nowrap',
              '--ant-table-white-space': 'nowrap',
              '--ant-table-thead-tr-th-white-space': 'nowrap',
              '--ant-table-tbody-tr-td-white-space': 'nowrap',
            }}
            components={{
              header: {
                cell: (props) => (
                  <th {...props} style={{ whiteSpace: 'nowrap', backgroundColor: '#f5f5f5' }} />
                )
              }
            }}
          />
        )}
      </Box>

      {/* Edit Application Dialog */}
      <ApplicationEditDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingApplication(null);
        }}
        application={editingApplication}
        onEdit={handleSaveApplication}
        onDelete={handleDeleteApplication}
      />
    </Box>
  );
};

export default ApplicationList;
