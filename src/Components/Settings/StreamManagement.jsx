import React, { useState, useEffect, useMemo } from "react";
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
import { Table, Image } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { createStream, updateStream, getAllStreams, deleteStream } from "./StreamService";
import Loading from '../Common/LoadingOverlay';
import AlertService from '../Common/AlertService';

const StreamManagement = () => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [streams, setStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const role = sessionStorage.getItem("role") || "staff";
  const email = sessionStorage.getItem("email") || "";

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const response = await getAllStreams();
      setStreams(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setName("");
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const handleClickOpen = (record) => {
    if (!record) {
      console.error('No record provided to handleClickOpen');
      return;
    }
    setSelectedStream(record);
    setName(record.name || "");
    setImagePreview(record.imageUrl || "");
    setImageFile(null); // Reset image file when opening edit dialog
    setOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStream(null);
    setName("");
    setImagePreview("");
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Stream name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddStream = async () => {
    if (!validateForm()) return;
    
    try {
      const streamData = { name };
      await createStream(streamData, imageFile);
      AlertService.success('Stream added successfully');
      await fetchStreams();
      handleDialogClose();
    } catch (error) {
      console.error("Failed to add stream:", error);
      AlertService.error(error.message || 'Failed to add stream');
    }
  };

  const handleSave = async () => {
    try {
      // Validate selected stream
      if (!selectedStream || typeof selectedStream !== 'object' || !selectedStream.id) {
        console.error('Invalid or missing selectedStream:', selectedStream);
        AlertService.error('No valid stream selected for update');
        return;
      }
      
      // Validate form
      if (!validateForm()) {
        console.error('Form validation failed');
        return;
      }
      
      setLoading(true);
      
      // Prepare updated stream data
      const updatedStream = {
        id: selectedStream.id,
        name: (name || '').trim(),
        ...(selectedStream.createdByEmail && { createdByEmail: selectedStream.createdByEmail }),
        ...(selectedStream.role && { role: selectedStream.role }),
        ...(selectedStream.image && { image: selectedStream.image })
      };
      
      if (!updatedStream.name) {
        throw new Error('Stream name cannot be empty');
      }
      
      // Update the stream
      const response = await updateStream(selectedStream.id, updatedStream, imageFile);
      
      if (!response) {
        throw new Error('No response received from server');
      }
      
      AlertService.success('Stream updated successfully');
      await fetchStreams();
      handleClose();
    } catch (error) {
      console.error("Error in handleSave:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update stream';
      AlertService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    const isConfirmed = await AlertService.confirm(`Are you sure you want to delete "${record.name || 'this stream'}"?`);
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      await deleteStream(record.id);
      AlertService.success('Stream deleted successfully');
      await fetchStreams();
    } catch (error) {
      console.error("Failed to delete stream:", error);
      AlertService.error(error.message || 'Failed to delete stream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStreams = streams.filter(stream =>
    (stream.name || "").toLowerCase().includes(search.toLowerCase())
  );

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
      title: "Image",
      dataIndex: "imageUrl",
      key: "image",
      className: "custom-header",
      width: 100,
      render: (imageUrl) => (
        <Image
          src={imageUrl || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMnptMCAxYzQuOTcxIDAgOSA0LjAyOSA5IDlzLTQuMDI5IDktOSA5LTktNC4wMjktOS05IDQuMDI5LTkgOS05eiIvPjwvc3ZnPg=='}
          alt="Stream"
          width={50}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      )
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      className: "custom-header",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || "")
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
        Stream Management
      </Typography>

      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Search Streams"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
            placeholder="Search by name"
          />
          <Typography variant="body1" color="textSecondary">
            Total: {filteredStreams.length} stream{filteredStreams.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlusOutlined />}
          onClick={handleDialogOpen}
        >
          Add Stream
        </Button>
      </Box>

      {/* Add Stream Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Stream</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="stream-image-upload"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="stream-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadOutlined />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {imageFile ? 'Change Image' : 'Upload Image'}
              </Button>
            </label>
            {imagePreview && (
              <Box mt={1} textAlign="center">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={150}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>
          <TextField
            label="Stream Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleAddStream} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Stream Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Stream</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="edit-stream-image-upload"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="edit-stream-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadOutlined />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {imageFile ? 'Change Image' : 'Upload New Image'}
              </Button>
            </label>
            {(imagePreview || selectedStream?.imageUrl) && (
              <Box mt={1} textAlign="center">
                <Image
                  src={imagePreview || selectedStream?.imageUrl}
                  alt="Preview"
                  width={150}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>
          <TextField
            label="Stream Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Table 
        columns={columns} 
        dataSource={useMemo(() => filteredStreams, [filteredStreams])}
        rowKey="id"
        className="stream-table"
        pagination={{
          defaultPageSize: 10,
          pageSizeOptions: ['5', '10', '20', '50'],
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} streams`,
          position: ['bottomRight']
        }}
        loading={loading}
        bordered
        size="middle"
      />
      <style>
        {`
          .stream-table .ant-table-thead > tr > th.custom-header {
            background: #f5f5f5 !important;
            color: #333 !important;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
          }
          .stream-table .ant-table-tbody > tr > td {
            padding: 12px 16px;
          }
          .stream-table .ant-pagination {
            margin: 16px 0;
            padding: 0 24px;
          }
          .ant-table {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
        `}
      </style>
    </div>
  );
};

export default StreamManagement;
