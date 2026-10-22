import React, { useEffect, useMemo, useState } from "react";
import { Table, message, Modal, Form, Button, List, Typography } from "antd";
import { DownloadOutlined, FilePdfOutlined, FileWordOutlined, FileImageOutlined, FileOutlined } from '@ant-design/icons';
import { getAllEnquiries, deleteEnquiry, updateEnquiry } from "./AbroadInquiryService";
import { getBranchCodeNameMap } from "../../AllLogin/LoginService";
import InquiryDetailsModal from "./InquiryDetailsModal";
import InquiryFilter from "./InquiryFilter";
import Box from "@mui/material/Box";
import { InquiryInfoDailog } from "./InquiryInfoDailog";
import "../../Common/Design.css";
import "./InquiryManagementFont.css";

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
    country: null,
    city: null,
    university: null,
    college: null,
    stream: null,
    branchCode: null,
    course: null,
    hasPassport: null,
    year: null,
    applyFor: null,
    staffName: null,
    status: null
  });
  
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [countRefresh, setCountRefresh] = useState(0);

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

  // A single source of truth: the role-scoped enquiry collection returned by the
  // existing endpoint. Never overwrite the table from a second filtering request.
  const normalize = (value) => String(value ?? '').trim().toLowerCase();
  const normalizeStatus = (value) => normalize(value).replace(/[\s_-]/g, '');
  const matches = (record, keys, value) => !value || keys.some((key) =>
    normalize(record?.[key]) === normalize(value)
  );

  const matchingData = useMemo(() => {
    const term = normalize(search);
    return allFilteredData.filter((item) => {
      if (term && ![item.name, item.email, item.phone_no].some((value) => normalize(value).includes(term))) return false;
      if (!matches(item, ['country'], filters.country)) return false;
      if (!matches(item, ['city'], filters.city)) return false;
      if (!matches(item, ['university'], filters.university)) return false;
      if (!matches(item, ['collage', 'college'], filters.college)) return false;
      if (!matches(item, ['stream'], filters.stream)) return false;
      if (!matches(item, ['course', 'courseName'], filters.course)) return false;
      if (!matches(item, ['passoutYear', 'year'], filters.year)) return false;
      if (!matches(item, ['applyFor'], filters.applyFor)) return false;
      if (!matches(item, ['staffName', 'staff_email', 'staffEmail', 'createdByEmail'], filters.staffName)) return false;
      if (filters.hasPassport) {
        const passportValue = item?.hasPassport;
        const passportNormalized = normalize(passportValue);
        const hasPassport = passportValue === true || ['yes', 'true', '1'].includes(passportNormalized);
        const passportMatches = filters.hasPassport === 'Yes' ? hasPassport : !hasPassport;
        if (passportValue === undefined || passportValue === null || passportNormalized === '') return false;
        if (!passportMatches) return false;
      }
      if (filters.status && normalizeStatus(item.status) !== normalizeStatus(filters.status)) return false;
      return true;
    });
  }, [allFilteredData, filters, search]);

  const handleTableChange = (nextPagination) => {
    setPagination((previous) => ({ ...previous, current: nextPagination.current, pageSize: nextPagination.pageSize }));
  };

  const handleClearFilters = () => {
    setFilters((previous) => ({
      country: null,
      city: null,
      university: null,
      college: null,
      stream: null,
      branchCode: previous.branchCode,
      course: null,
      hasPassport: null,
      year: null,
      applyFor: null,
      staffName: null,
      status: null
    }));
    setSearch('');
    setPagination((previous) => ({ ...previous, current: 1 }));
  };

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const role = sessionStorage.getItem('role');
      const email = sessionStorage.getItem('email');
      if (!role || !email) {
        message.error('Authentication data missing. Please login again.');
        setAllFilteredData([]);
        return;
      }
      const branchCode = role === 'superAdmin' ? (filters.branchCode || 'All') :
        (role === 'staff' ? undefined : (sessionStorage.getItem('branchCode') || 'All'));
      const result = await getAllEnquiries(role, email, branchCode);
      let records = Array.isArray(result) ? result : (Array.isArray(result?.content) ? result.content : []);
      if (role === 'staff') {
        records = records.filter((item) => normalize(item.createdByEmail) === normalize(email) ||
          normalize(item.email) === normalize(email));
      }
      setAllFilteredData(records);
      setData(records);
      if (!Array.isArray(result) && Array.isArray(result?.content) &&
          Number(result.totalElements) > records.length) {
        console.warn('Inquiry API returned a partial page. Client-side filters and totals cover only returned records.');
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      message.error('Failed to fetch inquiries');
      setAllFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1, total: matchingData.length }));
  }, [matchingData]);

  useEffect(() => {
    fetchInquiries();
    // Re-fetch only when the backend query scope changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.branchCode]);

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
      
      setAllFilteredData(prev =>
        prev.map(item =>
          item.id === selectedInquiry.id ? { ...item, ...values } : item
        )
      );
      
      setCountRefresh((v) => v + 1);
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
      setCountRefresh((v) => v + 1);
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
      
      setAllFilteredData(prev =>
        prev.map(item =>
          item.id === selectedInquiry.id ? updatedInquiry : item
        )
      );
      
      // Update the selectedInquiry to reflect the change
      setSelectedInquiry(updatedInquiry);
      
      setCountRefresh((v) => v + 1);
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
    // 1. Name
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <a onClick={() => handleNameClick(record)}>{record.name || "-"}</a>
      )
    },

    // 2. Phone
    {
      title: "Phone",
      dataIndex: "phone_no",
      key: "phone_no",
      render: (value) => value ?? "-"
    },

    // 3. Email
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value) => value || "-"
    },

    // 4. Inquiry Date
    {
      title: "Inquiry Date",
      dataIndex: "enquiry_date",
      key: "enquiry_date",
      render: (value) => value || "-"
    },

    // 5. Apply For
    {
      title: "Apply For",
      dataIndex: "applyFor",
      key: "applyFor",
      render: (value) => value || "-"
    },

    // 6. Stream
    {
      title: "Stream",
      dataIndex: "stream",
      key: "stream",
      render: (value) => value || "-"
    },

    // 7. Course
    {
      title: "Course",
      dataIndex: "courseName",
      key: "courseName",
      render: (value, record) => value || record.course || "-"
    },

    // 8. Country
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      render: (value) => value || "-"
    },

    // 9. University
    {
      title: "University",
      dataIndex: "university",
      key: "university",
      render: (value) => value || "-"
    },

    // 10. Status — moved into the former Staff Name column position
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

    // 11. Remark — moved into the former Branch column position
    {
      title: "Remark",
      dataIndex: "remark",
      key: "remark",
      render: (value) => value || "-"
    },

    // 12. Staff Name
    {
      title: "Staff Name",
      key: "staffName",
      render: (_, record) => getStaffNameFromEmail(record) || "-"
    },

    // 13. Branch
    {
      title: "Branch",
      key: "branch",
      render: (_, record) => getBranchName(record.branchCode) || "-"
    },

    // 14. Year: intended study/travel year (API field: year), not passoutYear
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      render: (value) => value || "-"
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
  const filteredCount = matchingData.length;

  return (
    <div className="inquiry-management-page">
      <InquiryFilter
        filters={filters}
        onChange={setFilters}
        search={search}
        setSearch={setSearch}
        onClearFilters={handleClearFilters}
        onFilterChange={() => {}}
        data={Array.isArray(allFilteredData) ? allFilteredData : []}
        countries={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "country")}
        cities={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "city")}
        universities={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "university")}
        colleges={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "collage").concat(getUnique(allFilteredData, "college")).filter((v, i, a) => a.indexOf(v) === i)}
        streams={getUnique(Array.isArray(allFilteredData) ? allFilteredData : [], "stream")}
        branches={Array.isArray(branches) ? branches : []}
        courses={getUnique(allFilteredData, "course").concat(getUnique(allFilteredData, "courseName")).filter((v, i, a) => a.indexOf(v) === i)}
        role={sessionStorage.getItem("role")}
        email={sessionStorage.getItem("email")}
        years={getUnique(allFilteredData, "passoutYear").concat(getUnique(allFilteredData, "year")).filter((v, i, a) => a.indexOf(v) === i)}
        staffOptions={staffOptions}
        refreshTrigger={countRefresh}
        loadingStaff={loadingStaff}
      />
{/* Record count and filter match info */}
<div
  style={{
    margin: '16px 0',
    padding: '12px 16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  }}
>
  {/* Left side: Record count */}
  <div style={{ fontWeight: 500 }}>
    Showing{' '}
    {pagination.total === 0
      ? 0
      : (pagination.current - 1) * pagination.pageSize + 1}
    -
    {Math.min(
      pagination.current * pagination.pageSize,
      pagination.total
    )}{' '}
    of {pagination.total} records
  </div>

  {/* Right side: Rows per page */}
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}
  >
    <span style={{ color: '#555', fontSize: 13 }}>
      Rows per page
    </span>

    <select
      aria-label="Rows per page"
      value={pagination.pageSize}
      onChange={(event) =>
        handleTableChange({
          current: 1,
          pageSize: Number(event.target.value),
        })
      }
      style={{
        padding: '5px 8px',
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        background: '#fff',
      }}
    >
      {pagination.pageSizeOptions.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
  </div>
</div>
      
      <div className="way-inquiry-table"><Table
        columns={columns}
        dataSource={matchingData}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: false,
          pageSizeOptions: ['25', '50', '100', '500', '1000'],
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`
        }}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
        bordered
        size="middle"
        locale={{
          emptyText: 'No data found'
        }}
    />
    </div>
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
      <style>{`
        .way-inquiry-table .ant-table-thead > tr > th { background: #f7f9fc; color: #334155; font-weight: 650; border-bottom: 1px solid #dce3eb; }
        .way-inquiry-table .ant-table-tbody > tr > td { border-bottom-color: #edf0f4; }
        .way-inquiry-table .ant-table-tbody > tr:hover > td { background: #f8fbff !important; }
        .way-inquiry-table .ant-table { border-radius: 8px; overflow: hidden; }
      `}</style>
    </div>
  );
}