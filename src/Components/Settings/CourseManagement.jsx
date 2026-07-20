import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { createCourse, getAllCourses, updateCourse, deleteCourse } from "./CourseService";
import Loading from '../Common/LoadingOverlay';
import AlertService from '../Common/AlertService';

const CourseManagement = () => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await getAllCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      message.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!courseName?.trim()) {
      errors.courseName = 'Course name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDialogOpen = () => {
    setCourseName("");
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleClickOpen = (record) => {
    setSelectedCourse(record);
    setCourseName(record.courseName || "");
    setFormErrors({});
    setOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormErrors({});
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCourse(null);
    setFormErrors({});
  };

  const handleAddCourse = async () => {
    const trimmedName = courseName?.trim();
    if (!trimmedName) {
      setFormErrors({ courseName: 'Course name is required' });
      return;
    }
    
    try {
      await createCourse({ courseName: trimmedName });
      AlertService.success('Course added successfully');
      await fetchCourses();
      handleDialogClose();
    } catch (error) {
      console.error("Failed to add course:", error);
      AlertService.error(error.message || 'Failed to add course');
    }
  };

  const handleSave = async () => {
    const trimmedName = courseName?.trim();
    if (!selectedCourse || !trimmedName) {
      setFormErrors({ courseName: 'Course name is required' });
      return;
    }
    
    setLoading(true);
    try {
      await updateCourse(selectedCourse.id, { courseName: trimmedName });
      AlertService.success('Course updated successfully');
      await fetchCourses();
      handleClose();
    } catch (error) {
      console.error("Failed to update course:", error);
      AlertService.error(error.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    const isConfirmed = await AlertService.confirm(`Are you sure you want to delete "${record.courseName || 'this course'}"?`);
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      await deleteCourse(record.id);
      AlertService.success('Course deleted successfully');
      await fetchCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
      AlertService.error(error.message || 'Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on search
  const filteredCourses = courses.filter(course => {
    const name = course.courseName || 'Unnamed Course';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      className: "custom-header",
      width: 80,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: "Course Name",
      dataIndex: "courseName",
      key: "courseName",
      className: "custom-header",
      render: (text) => text || <span style={{ color: '#999', fontStyle: 'italic' }}>Unnamed Course</span>,
      sorter: (a, b) => {
        const nameA = a.courseName || '';
        const nameB = b.courseName || '';
        return nameA.localeCompare(nameB);
      }
    },
    {
      title: "Actions",
      key: "actions",
      className: "custom-header",
      width: 150,
      render: (_, record) => (
        <Box display="flex" gap={1}>
          <Button
            onClick={() => handleClickOpen(record)}
            startIcon={<EditIcon style={{ color: "#1890ff" }} />}
            size="small"
          />
          <Button
            onClick={() => handleDelete(record)}
            startIcon={<DeleteIcon style={{ color: "#ff4d4f" }} />}
            size="small"
          />
        </Box>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      {loading && <Loading />}
      <Typography variant="h5" gutterBottom mb={3}>
        Course Management
      </Typography>

      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Search Courses"
            variant="outlined"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <Typography variant="body1" color="textSecondary">
            Total: {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlusOutlined />}
          onClick={handleDialogOpen}
        >
          Add Course
        </Button>
      </Box>

      {/* Add Course Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Course</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Course Name"
            type="text"
            fullWidth
            variant="outlined"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCourse()}
            error={!!formErrors.courseName}
            helperText={formErrors.courseName}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleAddCourse} color="primary" variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Course</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Course Name"
            type="text"
            fullWidth
            variant="outlined"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            error={!!formErrors.courseName}
            helperText={formErrors.courseName}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Table 
        columns={columns} 
        dataSource={filteredCourses.map(c => ({ ...c, key: c.id }))} 
        rowKey="key" 
        className="course-table"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} courses`
        }}
        loading={loading}
      />
      <style>
        {`
          .course-table .ant-table-thead > tr > th.custom-header {
            background: #f5f5f5 !important;
            color: #333 !important;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
          }
          .course-table .ant-table-tbody > tr > td {
            padding: 12px 16px;
          }
          .course-table .ant-table-pagination {
            margin: 16px 0;
            padding: 0 24px;
          }
        `}
      </style>
    </div>
  );
};

export default CourseManagement;
