import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box } from '@mui/material';
import { Table, Button, Space } from 'antd';
import AlertService from '../Common/AlertService';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllExamPreparations, deleteExamPreparation, updateExamPreparation } from './Marketing';
import EditExamPreparationDialog from './EditExamPreparationDialog';

const ExamPreparationList = () => {
  const { role, email } = useOutletContext() || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchExamPreparations = async () => {
    if (!role || !email) {
      console.error('Role and email are required');
      return;
    }

    try {
      setLoading(true);
      const response = await getAllExamPreparations(role, email);
      setData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching exam preparation data:', error);
      AlertService.error('Failed to load exam preparation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamPreparations();
  }, [role, email]);

  const handleDelete = async (id) => {
    if (!role || !email) {
      AlertService.error('Authentication error: Missing role or email');
      return;
    }

    const confirmed = await AlertService.confirm('Are you sure you want to delete this record?');
    if (confirmed) {
      try {
        await deleteExamPreparation(id, role, email);
        AlertService.success('Record deleted successfully');
        fetchExamPreparations(); // Refresh the list after deletion
      } catch (error) {
        console.error('Error deleting record:', error);
        AlertService.error('Failed to delete record');
      }
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
      sorter: (a, b) => a.name?.localeCompare(b.name),
    },
    {
      title: 'Contact Number',
      dataIndex: 'contactNumber',
      key: 'contactNumber',
    },
    {
      title: 'Exam Name',
      dataIndex: 'examName',
      key: 'examName',
      filters: [
        ...new Set(data.map(item => item.examName))
      ].map(exam => ({
        text: exam,
        value: exam,
      })),
      onFilter: (value, record) => record.examName === value,
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

  const handleUpdateExamPrep = async (id, updatedData) => {
    try {
      await updateExamPreparation(id, updatedData, role, email);
      AlertService.success('Exam preparation updated successfully');
      fetchExamPreparations();
    } catch (error) {
      console.error('Error updating exam preparation:', error);
      AlertService.error('Failed to update exam preparation');
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
      <EditExamPreparationDialog
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        record={editingRecord}
        onSave={handleUpdateExamPrep}
      />
    </Box>
  );
};

export default ExamPreparationList;