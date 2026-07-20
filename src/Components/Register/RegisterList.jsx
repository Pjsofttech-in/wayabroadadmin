import React, { useState, useEffect } from 'react';
import { Table, Typography, Button } from 'antd';
import { getRegistrations, deleteRegistration, getAllStreams } from './ReistrationServices';
import RegistrationFilters from './RegistrationFilters';
import RegistrationFormDialog from './RegistrationFormDialog';
import AlertService from '../Common/AlertService';
import LoadingOverlay from '../Common/LoadingOverlay';
import '../Common/Design.css';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

const RegisterList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streams, setStreams] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    stream: '',
    course: '',
    location: ''
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // State for managing table data and pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
  });

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const response = await getRegistrations();
      setData(Array.isArray(response) ? response : []);
      setPagination({
        ...params.pagination,
        total: Array.isArray(response) ? response.length : 0,
      });
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch streams on component mount
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const streamsData = await getAllStreams();
        setStreams(streamsData);
      } catch (error) {
        console.error('Error fetching streams:', error);
      }
    };
    
    fetchStreams();
    fetchData({ pagination });
  }, []); // Empty dependency array means this effect runs once on mount

  const handleDelete = async (id) => {
    const isConfirmed = await AlertService.confirm('Are you sure you want to delete this registration?');
    if (!isConfirmed) return;
    
    try {
      await deleteRegistration(id);
      AlertService.success('Registration deleted successfully');
      // Refresh the data after successful deletion
      fetchData({ pagination });
    } catch (error) {
      console.error('Error deleting registration:', error);
      AlertService.error(error.message || 'Failed to delete registration');
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedRecord(null);
    fetchData({ pagination });
  };

  const handleFilter = (appliedFilters) => {
    // Convert empty strings to undefined to remove them from the query
    const cleanedFilters = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});
    
    setFilters(cleanedFilters);
    fetchData({ 
      pagination: { ...pagination, current: 1 }, // Reset to first page on filter change
      ...cleanedFilters
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span 
          style={{ cursor: 'pointer', textDecoration: 'underline', color: '#1890ff' }}
          onClick={() => handleEdit(record)}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
      render: (text) => text ? `+91 ${text}` : '-'
    },
    {
      title: 'Stream',
      dataIndex: 'stream',
      key: 'stream',
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => amount ? `₹${amount}` : '-',
      align: 'right'
    },

  ];

  return (
    <div className="p-4" style={{ position: 'relative' }}>
      <LoadingOverlay loading={loading} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <RegistrationFilters 
          onFilter={handleFilter}
          streams={streams}
          totalCount={data.length}
        />
      </div>
      
      <Table
        columns={columns}
        rowKey="id"
        dataSource={data}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100', '500', '1000'],
          showTotal: (total) => `Total ${total} items`
        }}
        scroll={{ x: 'max-content' }}
        className="table-root"
      />
      
      <RegistrationFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRecord(null);
        }}
        onSuccess={handleFormSuccess}
        onDelete={handleDelete}
        initialData={selectedRecord}
      />
    </div>
  );
};

export default RegisterList;
