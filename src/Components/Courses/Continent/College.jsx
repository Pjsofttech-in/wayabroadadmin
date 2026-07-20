import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, Typography, CircularProgress } from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import UploadIcon from '@mui/icons-material/Upload';
import { getAllColleges, createCollege, updateCollege, deleteCollege } from "./CollegeService";
import Course from "./Course";
import LoadingOverlay from "../../Common/LoadingOverlay";

const initialCollege = {
  collegeName: "",
  image: null,
  fileError: null
};

export default function College({ university, onBack }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [collegeData, setCollegeData] = useState(initialCollege);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Get authentication data from session storage with fallbacks
  const getAuthData = () => {
    const role = sessionStorage.getItem("role");
    const email = sessionStorage.getItem("email");
    const branchCode = sessionStorage.getItem("branchCode") || "";
    
    console.log('Auth data from sessionStorage:', { role, email, branchCode });
    
    if (!role || !email) {
      console.error('Missing authentication data in sessionStorage');
      // Try to get from localStorage as fallback
      const fallbackRole = localStorage.getItem("role");
      const fallbackEmail = localStorage.getItem("email");
      const fallbackBranchCode = localStorage.getItem("branchCode") || "";
      
      if (fallbackRole && fallbackEmail) {
        console.log('Using auth data from localStorage');
        return {
          role: fallbackRole,
          email: fallbackEmail,
          branchCode: fallbackBranchCode
        };
      }
      
      // If still not found, redirect to login
      console.error('No authentication data found, redirecting to login');
      window.location.href = '/login';
      return { role: null, email: null, branchCode: '' };
    }
    
    return { role, email, branchCode };
  };
  
  const { role, email, branchCode } = getAuthData();

  const fetchColleges = async () => {
    setTableLoading(true);
    setApiLoading(true);
    try {
      const data = await getAllColleges({ 
        search, 
        email, 
        role, 
        branchCode, 
        universityId: university?.id 
      });
      
      const formattedData = data?.map(college => ({
        ...college,
        collegeName: college.collegeName || college.college || String(college.id) || 'N/A'
      })) || [];
      
      setColleges(formattedData);
    } catch (error) {
      console.error("Error fetching colleges:", error);
      message.error("Failed to fetch colleges");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    if (university?.id) {
      fetchColleges();
    }
  }, [search, university?.id]);

  const handleOpenDialog = (college = null) => {
    if (college) {
      setEditing(college.id);
      setCollegeData({
        collegeName: college.collegeName || college.college || "",
        image: null
      });
    } else {
      setEditing(null);
      setCollegeData(initialCollege);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCollegeData(initialCollege);
    setEditing(null);
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'image' && files && files.length > 0) {
      const file = files[0];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        message.error('File size should not exceed 5MB');
        // Clear the file input
        e.target.value = '';
        setCollegeData(prev => ({ ...prev, fileError: 'File size should not exceed 5MB' }));
        return;
      }
      
      setCollegeData(prev => ({ 
        ...prev, 
        [name]: file,
        fileError: null 
      }));
    } else {
      setCollegeData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!collegeData.collegeName?.trim()) {
      message.error("Please enter college name");
      return;
    }

    // Verify user has required permissions
    if (!email || !role) {
      const errorMsg = `Authentication error: Please log in again. Missing: ${!email ? 'email ' : ''}${!role ? 'role' : ''}`.trim();
      console.error(errorMsg);
      message.error(errorMsg);
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    setApiLoading(true);
    
    const formData = new FormData();
    
    // Create the college object according to the AbroadCollege entity
    const collegeObj = {
      collegeName: collegeData.collegeName.trim(),
      createdByEmail: email,
      role: role,
      abroadUniversity: { id: university?.id }
    };
    
    // Append the college object as JSON string
    formData.append('college', JSON.stringify(collegeObj));
    
    // Append the image file if it exists and is a File object
    if (collegeData.image instanceof File) {
      formData.append('image', collegeData.image);
    } else if (editing && !collegeData.image) {
      // If editing and no new photo is selected, ensure we don't send an empty file
      formData.delete('image');
    }
    
    // Add universityId as a separate form field
    if (university?.id) {
      formData.append('universityId', university.id.toString());
    }

    try {
      if (editing) {
        await updateCollege(
          editing,
          formData,
          email,
          role,
          branchCode,
          null
        );
        message.success("College updated successfully");
      } else {
        await createCollege(
          formData,
          null,
          university?.id,
          email,
          role
        );
        message.success("College created successfully");
      }
      
      fetchColleges();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving college:", error);
      
      // Log the full error response for debugging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error('Error:', error.message);
      }
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         "Failed to save college. Please try again.";
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setApiLoading(true);
    try {
      await deleteCollege(id, email, role, branchCode);
      message.success("College deleted successfully");
      fetchColleges();
    } catch (error) {
      console.error("Error deleting college:", error);
      message.error("Failed to delete college");
    } finally {
      setApiLoading(false);
    }
  };

  const handleManageCourses = (college) => {
    setSelectedCollege(college);
    setSelectedStream({ id: college.id, name: college.collegeName });
    setShowCourses(true);
  };

  const handleBackFromCourses = () => {
    setShowCourses(false);
    setSelectedCollege(null);
    setSelectedStream(null);
    fetchColleges();
  };

  const columns = [
    {
      title: 'College Name',
      dataIndex: 'collegeName',
      key: 'collegeName',
      sorter: (a, b) => (a.collegeName || '').localeCompare(b.collegeName || ''),
    },
    {
      title: 'Image',
      key: 'image',
      width: 100,
      render: (_, record) => {
        // Check for image URL in common possible properties
        const imageUrl = record.imageUrl || record.image || 
                        (record.images && record.images[0]) ||
                        (record.imagePath ? `${process.env.REACT_APP_API_BASE_URL}${record.imagePath}` : null);
        
        return imageUrl ? (
          <img 
            src={imageUrl} 
            alt={record.collegeName}
            style={{
              width: '50px',
              height: '50px',
              objectFit: 'cover',
              borderRadius: '4px'
            }}
            onError={(e) => {
              console.error('Error loading image:', imageUrl);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div style={{
            width: '50px',
            height: '50px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: '#999',
            fontSize: '10px',
            textAlign: 'center',
            padding: '4px'
          }}>
            No Image
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Stack direction="row" spacing={1}>
          {/* <IconButton size="small" onClick={() => handleOpenDialog(record)}>
            <EditOutlined />
          </IconButton> */}
          <Popconfirm title="Delete this college?" onConfirm={() => handleDelete(record.id)}>
            <IconButton size="small">
              <DeleteOutlined />
            </IconButton>
          </Popconfirm>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleManageCourses(record)}
            sx={{ ml: 1 }}
          >
            Manage Courses
          </Button>
        </Stack>
      ),
    },
  ];

  if (showCourses && selectedCollege) {
    return (
      <Course 
        stream={selectedStream}
        onBack={handleBackFromCourses} 
        branchCode={branchCode}
        role={role}
        email={email}
      />
    );
  }

  return (
    <div>
      <LoadingOverlay loading={apiLoading} />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          Back to University
        </Button>

        <Input.Search
          placeholder="Search colleges"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => handleOpenDialog()}
          sx={{ ml: 2 }}
        >
          Add College
        </Button>
      </Box>

      <Table
        columns={columns}
        dataSource={colleges}
        rowKey="id"
        loading={tableLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
        style={{ marginTop: '16px' }}
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit College' : 'Add New College'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="College Name"
              name="collegeName"
              value={collegeData.collegeName || ''}
              onChange={handleInputChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                College Image
              </Typography>
              <input
                accept="image/*"
                type="file"
                id="college-image-upload"
                name="image"
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />
              {collegeData.fileError && (
                <Typography color="error" variant="caption" display="block" gutterBottom>
                  {collegeData.fileError}
                </Typography>
              )}
              <label htmlFor="college-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                >
                  {collegeData.image ? 'Change Image' : 'Upload Image'}
                </Button>
              </label>
            </Box>


          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading || !collegeData.collegeName?.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}