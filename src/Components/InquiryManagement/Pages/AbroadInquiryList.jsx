import React, { useEffect, useState } from "react";
import { Table, message, Modal, Form, Button, List, Typography } from "antd";
import { DownloadOutlined, FilePdfOutlined, FileWordOutlined, FileImageOutlined, FileOutlined } from '@ant-design/icons';
import { getAllEnquiries, deleteEnquiry, updateEnquiry, filterEnquiries } from "./AbroadInquiryService";
import { getBranchCodeNameMap } from "../../AllLogin/LoginService";
import InquiryDetailsModal from "./InquiryDetailsModal";
import InquiryFilter from "./InquiryFilter";
import Box from "@mui/material/Box";
import { InquiryInfoDailog } from "./InquiryInfoDailog";
import "../../Common/Design.css";

const { Text } = Typography;

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch(extension) {
    case 'pdf':
      return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />;
    case 'doc':
    case 'docx':
      return <FileWordOutlined style={{ color: '#1890ff', fontSize: '20px' }} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <FileImageOutlined style={{ color: '#52c41a', fontSize: '20px' }} />;
    default:
      return <FileOutlined style={{ fontSize: '20px' }} />;
  }
};

export default function AbroadInquiryList() {
  const [allFilteredData, setAllFilteredData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['25', '50', '100', '500', '1000']
  });
  const [filters, setFilters] = useState({
    continent: null,
    country: null,
    state: null,
    city: null,
    university: null,
    college: null,
    stream: null,
    branchCode: null,
    course: null,
    status: null,
    year: null,
    applyFor: null,
    conductedBy: null,
    staffName: null
  });
  
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Fetch staff options for filtering
  const fetchStaffOptions = async () => {
    setLoadingStaff(true);
    try {
      const role = sessionStorage.getItem("role");
      const email = sessionStorage.getItem("email");

      if (role === 'staff') {
        // For staff users, only show themselves
        setStaffOptions([{
          id: email,
          name: 'Me',
          email: email
        }]);
      } else {
        // For other roles, fetch staff for the branch
        let branchCodeToUse = 'All';
        if (role !== 'superAdmin') {
          branchCodeToUse = sessionStorage.getItem('branchCode') || 'All';
        } else if (filters.branchCode) {
          branchCodeToUse = filters.branchCode;
        }

        if (branchCodeToUse && branchCodeToUse !== 'All') {
          const { getAllStaff } = await import("../../Branch/StaffService");
          const staffList = await getAllStaff(branchCodeToUse);
          const options = Array.isArray(staffList)
            ? staffList.map((s) => ({
                id: s.id,
                name: s.staffName || s.name || s.fullName || "Unnamed",
                email: s.staffEmail || s.email,
                branchCode: s.branchCode
              }))
            : [];
          setStaffOptions(options);
        } else {
          setStaffOptions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching staff options:', error);
      setStaffOptions([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleFilterChange = (filteredData) => {
    setFilteredData(filteredData);
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    fetchInquiries(newPagination.current, newPagination.pageSize);
  };

  const fetchInquiries = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const role = sessionStorage.getItem("role");
      const email = sessionStorage.getItem("email");
      
      console.log('Fetching inquiries with role:', role, 'email:', email);
      
      // Check if we have valid session data
      if (!role || !email) {
        console.error('Missing role or email in session storage');
        message.error('Authentication data missing. Please login again.');
        setData([]);
        setFilteredData([]);
        return;
      }

      // Use single API with role-based parameters
      let result;
      let responseData = []; // Declare responseData at function level
      console.log('Current role:', role, 'email:', email);

      // For staff users, don't pass branchCode to get only personal inquiries
      if (role === 'staff') {
        console.log('Fetching personal inquiries for staff user:', email);
        result = await getAllEnquiries(role, email);

        // Apply client-side filtering for staff users to ensure only their inquiries
        if (Array.isArray(result)) {
          responseData = result;
        } else if (result && Array.isArray(result.content)) {
          responseData = result.content;
        }

        // Filter to only show inquiries created by this staff user
        responseData = responseData.filter(inquiry =>
          inquiry.createdByEmail === email ||
          inquiry.email === email // fallback to email field if createdByEmail doesn't exist
        );

        console.log(`Filtered ${responseData.length} personal inquiries for staff user: ${email}`);

      } else {
        // For non-staff users, use branch-based filtering
        let branchCodeToUse = 'All';
        if (role !== 'superAdmin') {
          branchCodeToUse = sessionStorage.getItem('branchCode') || 'All';
        } else if (filters.branchCode) {
          branchCodeToUse = filters.branchCode;
        }

        console.log('Using getAllEnquiries API with branchCode:', branchCodeToUse);
        result = await getAllEnquiries(role, email, branchCodeToUse);

        if (Array.isArray(result)) {
          responseData = result;
        } else if (result && Array.isArray(result.content)) {
          responseData = result.content;
        }
      }

      // Apply local filtering based on current filters and search
      let filteredResponseData = responseData;

      // Apply search filter
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        filteredResponseData = filteredResponseData.filter(item =>
          (item.name && item.name.toLowerCase().includes(searchLower)) ||
          (item.email && item.email.toLowerCase().includes(searchLower)) ||
          (item.phone_no && item.phone_no.toString().includes(search))
        );
      }

      // Apply other filters
      if (filters.continent) {
        filteredResponseData = filteredResponseData.filter(item => item.continent === filters.continent);
      }
      if (filters.country) {
        filteredResponseData = filteredResponseData.filter(item => item.country === filters.country);
      }
      if (filters.state) {
        filteredResponseData = filteredResponseData.filter(item => item.state === filters.state);
      }
      if (filters.city) {
        filteredResponseData = filteredResponseData.filter(item => item.city === filters.city);
      }
      if (filters.university) {
        filteredResponseData = filteredResponseData.filter(item => item.university === filters.university);
      }
      if (filters.college) {
        filteredResponseData = filteredResponseData.filter(item => item.collage === filters.college);
      }
      if (filters.stream) {
        filteredResponseData = filteredResponseData.filter(item => item.stream === filters.stream);
      }
      if (filters.course) {
        filteredResponseData = filteredResponseData.filter(item => item.course === filters.course || item.courseName === filters.course);
      }
      if (filters.status) {
        filteredResponseData = filteredResponseData.filter(item => item.status === filters.status);
      }
      if (filters.applyFor) {
        filteredResponseData = filteredResponseData.filter(item => item.applyFor === filters.applyFor);
      }
      if (filters.staffName) {
        filteredResponseData = filteredResponseData.filter(item =>
          item.staffName === filters.staffName ||
          item.staff_email === filters.staffName ||
          item.staffEmail === filters.staffName ||
          item.createdByEmail === filters.staffName
        );
      }

      // Handle pagination locally
      const totalItems = filteredResponseData.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredResponseData.slice(startIndex, endIndex);

      // Update the data and filtered data states
      setData(paginatedData);
      setFilteredData(paginatedData);

      // Update pagination state
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: totalItems,
        showTotal: (total, range) => {
          return `${range[0]}-${range[1]} of ${total} items`;
        }
      }));
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      message.error("Failed to fetch inquiries");
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Debug effect to log data structure
  useEffect(() => {
    if (data.length > 0) {
      console.log('First 3 data items structure:', 
        data.slice(0, 3).map(item => ({
          id: item.id,
          conductedBy: item.conductedBy,
          conductBy: item.conductBy,
          // Add other fields you want to check
        }))
      );
    }
  }, [data]);

  // Fetch all filtered data for dropdowns when filters/search change
  useEffect(() => {
    const fetchAllFilterOptions = async () => {
      const role = sessionStorage.getItem("role");
      const email = sessionStorage.getItem("email");
      try {
        // Use single API with role-based parameters for filter options
        if (role === 'staff') {
          // For staff users, don't pass branchCode to get only personal inquiries
          const result = await getAllEnquiries(role, email);

          let responseData = [];
          if (Array.isArray(result)) {
            responseData = result;
          } else if (result && Array.isArray(result.content)) {
            responseData = result.content;
          }

          // Filter to only show inquiries created by this staff user
          responseData = responseData.filter(inquiry =>
            inquiry.createdByEmail === email ||
            inquiry.email === email // fallback to email field if createdByEmail doesn't exist
          );

          setAllFilteredData(responseData);
        } else {
          // For non-staff users, use branch-based filtering
          let branchCodeToUse = 'All';
          if (role !== 'superAdmin') {
            branchCodeToUse = sessionStorage.getItem('branchCode') || 'All';
          } else if (filters.branchCode) {
            branchCodeToUse = filters.branchCode;
          }

          const result = await getAllEnquiries(role, email, branchCodeToUse);
          const responseData = Array.isArray(result) ? result : (result?.content || []);
          setAllFilteredData(responseData);
        }
      } catch (err) {
        setAllFilteredData([]);
      }
    };
    fetchAllFilterOptions();
    // eslint-disable-next-line
  }, [filters, search]);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        
        const branchMap = await getBranchCodeNameMap();
        if (branchMap && typeof branchMap === 'object') {
          const branchList = Object.entries(branchMap).map(([code, name]) => ({
            id: code,
            code,
            name
          }));
          setBranches(branchList);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        // Don't show error message if it's just a missing token
        if (!error.message.includes('token')) {
          message.error('Failed to load branch data');
        }
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchInquiries();
    fetchBranches();
    fetchStaffOptions();
    // eslint-disable-next-line
  }, []);

  const handleNameClick = (record) => {
    setSelectedInquiry(record);
    setDetailsModalVisible(true);
    setIsEditing(false);
    form.setFieldsValue(record);
  };

  const handleEditClick = (record) => {
    setSelectedInquiry(record);
    setShowEditModal(true);
    setIsEditing(true);
    form.setFieldsValue(record);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setIsEditing(false);
  };

  const showDocumentsModal = (documents) => {
    // Convert document URLs to proper format for display
    const formattedDocuments = documents.map((doc, index) => ({
      url: doc,
      name: doc ? doc.split('/').pop() : `Document ${index + 1}`,
      type: doc ? doc.split('.').pop().toLowerCase() : 'unknown'
    }));
    setCurrentDocuments(formattedDocuments);
    setDocumentsModalVisible(true);
  };

  const handleDownload = (url) => {
    if (url) {
    window.open(url, '_blank');
    }
  };

  const handleDetailsUpdate = async (values) => {
    try {
      const role = sessionStorage.getItem("role");
      const email = sessionStorage.getItem("email");
      
      // Update in the backend
      const updatedInquiry = await updateEnquiry(selectedInquiry.id, values, null, role, email);
      
      // Update the UI state
      setData(prev =>
        prev.map(item =>
          item.id === selectedInquiry.id ? { ...item, ...values } : item
        )
      );
      
      setFilteredData(prev =>
        prev.map(item =>
          item.id === selectedInquiry.id ? { ...item, ...values } : item
        )
      );
      
      message.success("Enquiry updated");
      setDetailsModalVisible(false);
      setSelectedInquiry(prev => ({
        ...prev,
        ...values
      }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating enquiry:', error);
      message.error("Update failed");
    }
  };

  const handleDetailsDelete = async () => {
    const role = sessionStorage.getItem("role");
    const email = sessionStorage.getItem("email");
    try {
      await deleteEnquiry(selectedInquiry.id, role, email);
      message.success("Enquiry deleted");
      setDetailsModalVisible(false);
      setSelectedInquiry(null);
      setIsEditing(false);
      fetchInquiries();
    } catch {
      message.error("Delete failed");
    }
  };

  // Update status in the table when changed from follow-up modal
  const handleStatusChange = async (newStatus) => {
    if (!selectedInquiry) return;
    
    try {
      const role = sessionStorage.getItem("role");
      const email = sessionStorage.getItem("email");
      
      // Ensure the status is in the correct format (lowercase, no spaces)
      const formattedStatus = newStatus.toLowerCase().replace(/\s+/g, '_');
      
      // Update the status in the backend
      await updateEnquiry(selectedInquiry.id, { status: formattedStatus }, null, role, email);
      
      // Create an updated inquiry object with the new status
      const updatedInquiry = {
        ...selectedInquiry,
        status: formattedStatus
      };
      
      // Update the UI state
      setData(prev =>
        prev.map(item =>
          item.id === selectedInquiry.id ? updatedInquiry : item
        )
      );
      
      setFilteredData(prev =>
        prev.map(item =>
          item.id === selectedInquiry.id ? updatedInquiry : item
        )
      );
      
      // Update the selectedInquiry to reflect the change
      setSelectedInquiry(updatedInquiry);
      
      message.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update status');
    }
  };

  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [currentDocuments, setCurrentDocuments] = useState([]);

  // Helper function to get unique values from an array of objects by key
  const getUnique = (data, key) => {
    if (!Array.isArray(data)) return [];

    const values = data
      .map(item => {
        // Handle nested properties if needed
        const keys = key.split('.');
        let value = item;
        for (const k of keys) {
          value = value ? value[k] : null;
          if (value === undefined || value === null) break;
        }
        return value;
      })
      .filter(value => value !== undefined && value !== null && value !== '');

    // Remove duplicates and return
    return [...new Set(values)];
  };


  // Helper function to get staff name from email
  const getStaffNameFromEmail = (record) => {
    // First check if staffName is already available
    if (record.staffName) {
      return record.staffName;
    }
    

    // Look for staff name using email fields from staffOptions
    const emailToCheck = record.staff_email || record.staffEmail || record.createdByEmail;

    if (emailToCheck && staffOptions.length > 0) {
      const staff = staffOptions.find(s => s.email === emailToCheck);
      if (staff && staff.name) {
        return staff.name;
      }
    }

    // Fallback to email if no name found
    return emailToCheck || '-';
  };

  // Helper function to get branch name by code
  const getBranchName = (branchCode) => {
    if (!branchCode) return '';
    const branch = branches.find(b => b.code === branchCode);
    return branch ? branch.name : branchCode;
  };

  const columns = [
    // ID
    { title: "ID", dataIndex: "id", key: "id" },
    
    // Name
    { 
      title: "Name", 
      dataIndex: "name", 
      key: "name",
      render: (_, record) => (
        <a onClick={() => handleNameClick(record)}>{record.name}</a>
      )
    },
    
    // Phone
    { 
      title: "Phone", 
      dataIndex: "phone_no", 
      key: "phone_no" 
    },
    
    // Email
    { 
      title: "Email", 
      dataIndex: "email", 
      key: "email" 
    },
    
    // Enquiry Date
    { 
      title: "Enquiry Date", 
      dataIndex: "enquiry_date", 
      key: "enquiry_date" 
    },
    
    // Apply For
    { 
      title: "Apply For", 
      dataIndex: "applyFor", 
      key: "applyFor" 
    },
    
    // Course
    { 
      title: "Course", 
      dataIndex: "courseName", 
      key: "courseName",
    },
    
    // Status
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status",
      render: (_, record) => {
        const statusConfig = {
          'pending': { color: 'green', text: 'INTERESTED' },
          'approved': { color: 'red', text: 'NOT INTERESTED' },
          'connecting': { color: 'orange', text: 'CONNECTING' },
          'ringing': { color: 'gold', text: 'RINGING / SWITCH OFF' },
          'callback': { color: 'lightgreen', text: 'CALL BACK' },
          'call_back': { color: 'lightgreen', text: 'CALL BACK' },
          'call-back': { color: 'lightgreen', text: 'CALL BACK' },
          'success': { color: '#52c41a', text: 'SUCCESS' },
          'not_interested': { color: 'red', text: 'NOT INTERESTED' },
          'notInterested': { color: 'red', text: 'NOT INTERESTED' },
          'Interested': { color: 'green', text: 'INTERESTED' },
          'contacted': { color: '#722ed1', text: 'CONTACTED' },
          'follow_up': { color: '#fa8c16', text: 'FOLLOW UP' },
          'converted': { color: '#13c2c2', text: 'CONVERTED' },
          'office_visit': { color: '#purple', text: 'OFFICE VISIT' },
          // 'office_Visit': { color: '#purple', text: 'OFFICE VISIT' },
          'processing': { color: 'blue', text: 'PROCESSING' },
          'application': { color: 'maroon', text: 'APPLICATION' },
          'CNI': { color: 'pink', text: 'CNI' }   
          
        };

        const normalizedStatus = record.status 
          ? String(record.status).trim().toLowerCase().replace(/[\s-]+/g, '_')
          : 'pending';
          
        const config = statusConfig[normalizedStatus] || { 
          color: '#d9d9d9', 
          text: (record.status || 'PENDING').toUpperCase()
        };

        return (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '4px',
            backgroundColor: `${config.color}1a`,
            border: `1px solid ${config.color}`,
            color: config.color,
            fontWeight: 600,
            fontSize: '12px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: '0.5px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: config.color,
              marginRight: '8px',
              flexShrink: 0
            }} />
            {config.text}
          </div>
        );
      }
    },
    
    // Country
    { 
      title: "Country", 
      dataIndex: "country", 
      key: "country" 
    },
    
    // State
    { 
      title: "State", 
      dataIndex: "state", 
      key: "state" 
    },
    
    // City
    { 
      title: "City", 
      dataIndex: "city", 
      key: "city" 
    },
    
    // University
    { 
      title: "University", 
      dataIndex: "university", 
      key: "university" 
    },
    
    // College
    { 
      title: "College", 
      dataIndex: "collage", 
      key: "collage" 
    },
    
    // Stream
    { 
      title: "Stream", 
      dataIndex: "stream", 
      key: "stream" 
    },
    
    // Course column has been moved up in the sequence
    
    // Conducted By
    // { 
    //   title: "Conducted By", 
    //   dataIndex: "conductBy", 
    //   key: "conductBy" 
    // },
    // Staff Name (after Conducted By)
    {
      title: "Staff Name",
      key: "staffName",
      render: (_, record) => getStaffNameFromEmail(record)
    },
    
    // Branch
    { 
      title: "Branch", 
      key: "branch",
      render: (_, record) => getBranchName(record.branchCode)
    },
    
    // Passout Year
    { 
      title: "Passout Year", 
      dataIndex: "passoutYear", 
      key: "passoutYear" 
    },
    
    // Documents (moved to the end as per requested sequence)
    {
      title: "Documents",
      key: "documents",
      width: 150,
      render: (_, record) => {
        const hasDocuments = record.document1 || record.document2;
        const documentCount = (record.document1 ? 1 : 0) + (record.document2 ? 1 : 0);
        
        return (
          <Button 
            type="link" 
            onClick={() => showDocumentsModal([record.document1, record.document2].filter(Boolean))}
            disabled={!hasDocuments}
          >
            {hasDocuments ? `View (${documentCount})` : 'No Documents'}
          </Button>
        );
      }
    }
  ];

  // Log pagination state
  useEffect(() => {
    console.log('Pagination state:', {
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total
    });
  }, [pagination]);

  // Check if any filters are active
  const isFilterActive = Object.values(filters).some(filter => 
    filter !== null && filter !== undefined && filter !== ''
  );

  // Get the count of filtered records
  const filteredCount = filteredData.length;

  return (
    <>
      <InquiryFilter
        filters={filters}
        onChange={setFilters}
        onFilterChange={handleFilterChange}
        data={Array.isArray(allFilteredData) ? allFilteredData : []}
        continents={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "continent")}
        countries={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "country")}
        states={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "state")}
        cities={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "city")}
        universities={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "university")}
        colleges={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "collage")}
        streams={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "stream")}
        branches={Array.isArray(branches) ? branches : []}
        courses={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "course")}
        role={sessionStorage.getItem("role")}
        email={sessionStorage.getItem("email")}
        statuses={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "status")}
        years={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "passoutYear")}
        staffOptions={staffOptions}
        loadingStaff={loadingStaff}
      />
      
      {/* Record count and filter match info */}
      <div style={{ 
        margin: '16px 0',
        padding: '12px 16px',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ fontWeight: 500 }}>
          Showing {pagination.current * pagination.pageSize - pagination.pageSize + 1}-
          {Math.min(pagination.current * pagination.pageSize, pagination.total)} of {pagination.total} records
        </div>
        {isFilterActive && (
          <div style={{ 
            color: '#1890ff', 
            fontWeight: 500,
            backgroundColor: '#e6f7ff',
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid #91d5ff',
            fontSize: '14px'
          }}>
            {filteredCount} Course{filteredCount !== 1 ? 's' : ''} Found
          </div>
        )}
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100', '500', '1000'],
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`
        }}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
        bordered
        locale={{
          emptyText: 'No data found'
        }}
    />
    <InquiryInfoDailog
      open={detailsModalVisible}
      onClose={() => { setDetailsModalVisible(false); setSelectedInquiry(null); setIsEditing(false); }}
      inquiry={selectedInquiry}
      isEditing={false}
      setIsEditing={setIsEditing}
      onEdit={() => handleEditClick(selectedInquiry)}
      onUpdate={handleDetailsUpdate}
      onDelete={handleDetailsDelete}
      onStatusChange={handleStatusChange} // Pass the handler to the modal
    />
    <InquiryDetailsModal
      visible={showEditModal}
      onClose={handleEditModalClose}
      inquiry={selectedInquiry}
      form={form}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      onUpdate={handleDetailsUpdate}
      onDelete={handleDetailsDelete}
    />

    <Modal
      title="Uploaded Documents"
      visible={documentsModalVisible}
      onCancel={() => setDocumentsModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setDocumentsModalVisible(false)}>
          Close
        </Button>
      ]}
      width={600}
    >
      <List
        itemLayout="horizontal"
        dataSource={currentDocuments}
        renderItem={(doc) => (
          <List.Item
            actions={[
              <Button 
                type="link" 
                icon={<DownloadOutlined />} 
                onClick={() => handleDownload(doc.url)}
              >
                Download
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={getFileIcon(doc.name)}
              title={
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  {doc.name}
                </a>
              }
              description={
                <Text type="secondary" ellipsis>
                  {doc.url}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
    </>
  );
}