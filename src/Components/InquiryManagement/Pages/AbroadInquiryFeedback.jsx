import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Space, Tag, Layout } from 'antd';
import { Table, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Content } = Layout;

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const AbroadInquiryFeedback = () => {
  const [loading, setLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});

  const fetchFeedback = async (params = {}) => {
    setLoading(true);
    try {
      const { current, pageSize, ...filters } = params;
      const response = await getFeedbackList({
        page: current || pagination.current,
        limit: pageSize || pagination.pageSize,
        ...filters,
      });
      
      setFeedbackData(response.data);
      setPagination({
        ...pagination,
        total: response.total || 0,
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleTableChange = (pagination, filters, sorter) => {
    fetchFeedback({
      ...pagination,
      ...filters,
      sortField: sorter.field,
      sortOrder: sorter.order,
    });
  };

  const handleSearch = (value) => {
    fetchFeedback({
      ...pagination,
      current: 1,
      search: value,
    });
  };

  const handleStatusFilter = (value) => {
    fetchFeedback({
      ...pagination,
      current: 1,
      status: value,
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
    },
    {
      title: 'Student Name',
      dataIndex: 'studentName',
      key: 'studentName',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => `${rating}/5`,
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'resolved' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Resolved', value: 'resolved' },
        { text: 'Pending', value: 'pending' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Submitted On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleViewDetails(record)}>View</Button>
          <Button type="link" onClick={() => handleResolve(record.id)}>Resolve</Button>
        </Space>
      ),
    },
  ];

  const handleViewDetails = (record) => {
    // Implement view details logic
    console.log('View details:', record);
  };

  const handleResolve = (id) => {
    // Implement resolve logic
    console.log('Resolve feedback:', id);
  };

  return (
    <Content style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>Student Feedback</Title>
      
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Search
            placeholder="Search feedback..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 200 }}
            onChange={handleStatusFilter}
          >
            <Option value="resolved">Resolved</Option>
            <Option value="pending">Pending</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
        </div>
        
        <Table
          columns={columns}
          dataSource={feedbackData}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </Content>
  );
};

export default AbroadInquiryFeedback;
