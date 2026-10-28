
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box } from '@mui/material';
import { Table, Button, Space, Tag } from 'antd';
import AlertService from '../Common/AlertService';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getWebInquirySubmissions,
  deleteWebInquirySubmission,
  updateWebInquirySubmission,
} from './Marketing';
import EditContactUsDialog from './EditContactUsDialog';

const ContactUsList = () => {
  const { role, email } = useOutletContext() || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchContactUs = useCallback(async () => {
    if (!role || !email) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      const response = await getWebInquirySubmissions(role, email);
      setData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching web inquiry submissions:', error);
      AlertService.error(
        error?.response?.data?.message || 'Failed to load web inquiries'
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [role, email]);

  useEffect(() => {
    fetchContactUs();
  }, [fetchContactUs]);

  const handleDelete = async (id) => {
    if (!role || !email) {
      AlertService.error('Authentication error: Missing role or email');
      return;
    }

    try {
      const confirmed = await AlertService.confirm(
        'Are you sure you want to delete this web inquiry?'
      );

      if (!confirmed) return;

      await deleteWebInquirySubmission(id, role, email);
      AlertService.success('Web inquiry deleted successfully');
      await fetchContactUs();
    } catch (error) {
      console.error('Error deleting web inquiry:', error);
      AlertService.error(
        error?.response?.data?.message || 'Failed to delete web inquiry'
      );
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async (id, updatedData) => {
    try {
      await updateWebInquirySubmission(
        id,
        {
          formType: 'CONTACT_US',
          name: updatedData.name,
          email: updatedData.email,
          phoneNumber: updatedData.phoneNumber,
          continentId: updatedData.continentId
            ? Number(updatedData.continentId)
            : null,
          courseId: updatedData.courseId
            ? Number(updatedData.courseId)
            : null,
          status: updatedData.status || editingRecord?.status || '',
        },
        role,
        email
      );

      AlertService.success('Web inquiry updated successfully');
      setIsEditDialogOpen(false);
      setEditingRecord(null);
      await fetchContactUs();
    } catch (error) {
      console.error('Error updating web inquiry:', error);
      AlertService.error(
        error?.response?.data?.message || 'Failed to update web inquiry'
      );
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => Number(a.id) - Number(b.id),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (value) => value || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (value) => value || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (value) => value || '-',
    },
    {
      title: 'Continent',
      dataIndex: 'continentName',
      key: 'continentName',
      render: (value) => value || '-',
      filters: [
        ...new Set(data.map((item) => item.continentName).filter(Boolean)),
      ].map((value) => ({ text: value, value })),
      onFilter: (value, record) => record.continentName === value,
    },
    {
      title: 'Courses',
      dataIndex: 'courseName',
      key: 'courseName',
      render: (value) => value || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value) => (value ? <Tag>{value}</Tag> : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            aria-label="Edit inquiry"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            aria-label="Delete inquiry"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minWidth: 0 }}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => `Total ${total} inquiries`,
        }}
        scroll={{ x: 'max-content' }}
        bordered
        size="middle"
      />

      <EditContactUsDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
        onSave={handleUpdateContact}
      />
    </Box>
  );
};

export default ContactUsList;
