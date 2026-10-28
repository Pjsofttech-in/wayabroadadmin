
import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { Box, Typography } from '@mui/material';
import {
  getRegistrations,
  deleteRegistration,
  getAllStreams,
} from './ReistrationServices';
import RegistrationFilters from './RegistrationFilters';
import RegistrationFormDialog from './RegistrationFormDialog';
import AlertService from '../Common/AlertService';
import LoadingOverlay from '../Common/LoadingOverlay';
import '../Common/Design.css';

const RegisterList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streams, setStreams] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    stream: '',
    course: '',
    location: '',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
  });

  const fetchData = async (params = {}) => {
    setLoading(true);

    try {
      const response = await getRegistrations();
      const registrations = Array.isArray(response) ? response : [];

      setData(registrations);

      setPagination((previous) => ({
        ...previous,
        ...(params.pagination || {}),
        total: registrations.length,
      }));
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const streamsData = await getAllStreams();
        setStreams(Array.isArray(streamsData) ? streamsData : []);
      } catch (error) {
        console.error('Error fetching streams:', error);
      }
    };

    fetchStreams();
    fetchData({
      pagination: { current: 1, pageSize: 25 },
    });

    // Initial data load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    const isConfirmed = await AlertService.confirm(
      'Are you sure you want to delete this registration?'
    );

    if (!isConfirmed) return;

    try {
      await deleteRegistration(id);
      AlertService.success('Registration deleted successfully');
      fetchData({ pagination });
    } catch (error) {
      console.error('Error deleting registration:', error);
      AlertService.error(
        error.message || 'Failed to delete registration'
      );
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
    const cleanedFilters = Object.entries(appliedFilters).reduce(
      (acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      },
      {}
    );

    setFilters(cleanedFilters);

    fetchData({
      pagination: { ...pagination, current: 1 },
      ...cleanedFilters,
    });
  };

  // Center-align all table headings and cell content.
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (text, record) => (
        <button
          type="button"
          onClick={() => handleEdit(record)}
          style={{
            padding: 0,
            border: 0,
            background: 'transparent',
            color: '#1976d2',
            font: 'inherit',
            fontWeight: 500,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          {text || '-'}
        </button>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
      align: 'center',
      render: (text) => (text ? `+91 ${text}` : '-'),
    },
    {
      title: 'Stream',
      dataIndex: 'stream',
      key: 'stream',
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      align: 'center',
      render: (text) => text || '-',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'center',
      render: (amount) =>
        amount !== null &&
        amount !== undefined &&
        amount !== ''
          ? `₹${Number(amount).toLocaleString('en-IN')}`
          : '-',
    },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minWidth: 0,
        p: { xs: 1, sm: 1.5, md: 1.5 },
        boxSizing: 'border-box',
        color: '#172b4d',
      }}
    >
      <LoadingOverlay loading={loading} />

      <RegistrationFilters
        onFilter={handleFilter}
        streams={streams}
        totalCount={data.length}
      />

      <Box
        sx={{
          mt: 1.5,
          minWidth: 0,
          width: '100%',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          borderRadius: 1.5,
          bgcolor: '#fff',

          '& .ant-table-wrapper': {
            maxWidth: '100%',
          },

          '& .ant-table': {
            fontSize: 13,
            color: '#263548',
          },

          '& .ant-table-container table': {
            width: '100%',
          },

          '& .ant-table-thead > tr > th': {
            background: '#f5f7fa',
            color: '#183b56',
            fontWeight: 600,
            fontSize: 12,
            borderBottom: '1px solid #e2e8f0',
            padding: '11px 14px',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          },

          '& .ant-table-tbody > tr > td': {
            padding: '11px 14px',
            borderBottom: '1px solid #edf1f5',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          },

          '& .ant-table-tbody > tr:hover > td': {
            background: '#f7faff',
          },

          '& .ant-pagination': {
            margin: '12px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            rowGap: '8px',
          },

          '& .ant-pagination-total-text': {
            marginRight: 'auto',
            color: '#64748b',
            fontSize: 12,
          },
        }}
      >
        <Table
          columns={columns}
          rowKey="id"
          dataSource={data}
          loading={loading}
          pagination={{
            ...pagination,
            position: ['bottomRight'],
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100', '500', '1000'],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} registrations`,
            onChange: (current, pageSize) => {
              setPagination((previous) => ({
                ...previous,
                current,
                pageSize,
              }));
            },
          }}
          scroll={{ x: 'max-content' }}
          className="table-root"
          locale={{
            emptyText: (
              <Box sx={{ py: 2.5, color: '#94a3b8' }}>
                <Typography sx={{ fontSize: 13 }}>
                  No registrations found
                </Typography>
              </Box>
            ),
          }}
        />
      </Box>

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
    </Box>
  );
};

export default RegisterList;
