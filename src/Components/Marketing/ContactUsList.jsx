import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box } from '@mui/material';
import { Table, Button, Space } from 'antd';
import AlertService from '../Common/AlertService';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllContactUs, deleteContactUs, updateContactUs } from './Marketing';
import EditContactUsDialog from './EditContactUsDialog';

const ContactUsList = () => {
  const { role, email } = useOutletContext() || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchContactUs = async () => {
    if (!role || !email) {
      console.error('Role and email are required');
      return;
    }

    try {
      setLoading(true);
      const response = await getAllContactUs(role, email);
      setData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching contact us data:', error);
      AlertService.error('Failed to load contact us data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactUs();
  }, [role, email]);

  const handleDelete = async (id) => {
    if (!role || !email) {
      AlertService.error('Authentication error: Missing role or email');
      return;
    }

    try {
      const confirmed = await AlertService.confirm('Are you sure you want to delete this contact?');
      if (confirmed) {
        await deleteContactUs(id, role, email);
        AlertService.success('Contact deleted successfully');
        fetchContactUs(); // Refresh the list after deletion
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      AlertService.error('Failed to delete contact');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phnNo',
      key: 'phnNo',
    },
    {
      title: 'Continent',
      dataIndex: 'continent',
      key: 'continent',
      filters: [
        ...new Set(data.map(item => item.continent))
      ].map(continent => ({
        text: continent,
        value: continent,
      })),
      onFilter: (value, record) => record.continent === value,
    },
    {
      title: 'Courses',
      dataIndex: 'courses',
      key: 'courses',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async (id, updatedData) => {
    try {
      await updateContactUs(id, updatedData, role, email);
      AlertService.success('Contact updated successfully');
      fetchContactUs();
    } catch (error) {
      console.error('Error updating contact:', error);
      AlertService.error('Failed to update contact');
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingRecord(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        bordered
      />
      <EditContactUsDialog
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        record={editingRecord}
        onSave={handleUpdateContact}
      />
    </Box>
  );
};

export default ContactUsList;
