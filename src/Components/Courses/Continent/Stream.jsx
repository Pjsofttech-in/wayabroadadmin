import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, Typography, CircularProgress } from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getAllStreams, createStream, updateStream, deleteStream } from "./StreamService";
import Course from "./Course";
import LoadingOverlay from "../../Common/LoadingOverlay";

const initialStream = {
  name: "",
  photo: null,
};

export default function Stream({ college, branchCode, role, email, onBack }) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [streamData, setStreamData] = useState(initialStream);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [showCourse, setShowCourse] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const fetchStreams = async () => {
    setTableLoading(true);
    setApiLoading(true);
    try {
      const data = await getAllStreams({ 
        search, 
        email, 
        role, 
        branchCode, 
        collegeId: college.id 
      });
      
      const formattedData = data?.map(stream => ({
        ...stream,
        imageUrl: stream.image || null
      })) || [];
      
      setStreams(formattedData);
    } catch (error) {
      console.error("Error fetching streams:", error);
      message.error("Failed to fetch streams");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
    // eslint-disable-next-line
  }, [search]);

  const handleOpenDialog = (record = null) => {
    if (record) {
      setStreamData({ ...record, name: record.name || "", photo: null });
      setEditing(record.id);
    } else {
      setStreamData(initialStream);
      setEditing(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setStreamData(initialStream);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setStreamData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setStreamData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setApiLoading(true);
    try {
      const payload = { name: streamData.name };
      if (editing) {
        await updateStream(editing, payload, streamData.photo, email, role);
        message.success("Stream updated successfully");
      } else {
        await createStream(
          payload, 
          streamData.photo, 
          role, 
          email, 
          college.id, 
          branchCode
        );
        message.success("Stream created successfully");
      }
      fetchStreams();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving stream:", error);
      message.error(error.response?.data?.message || "Failed to save stream");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setApiLoading(true);
    try {
      await deleteStream(id, role, email);
      message.success("Stream deleted");
      fetchStreams();
    } catch {
      message.error("Delete failed");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const columns = [
    { title: "Stream Name", dataIndex: "name", key: "name" },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (url, record) =>
        url ? (
          <img 
            src={url.startsWith('data:image') || url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || ''}${url}`} 
            alt={record.name || 'stream'} 
            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} 
          />
        ) : (
          <div style={{
            width: 40,
            height: 40,
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4
          }}>
            No Image
          </div>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => handleOpenDialog(record)}><EditOutlined /></IconButton>
          <Popconfirm title="Delete this stream?" onConfirm={() => handleDelete(record.id)}>
            <IconButton size="small">
              <DeleteOutlined />
            </IconButton>
          </Popconfirm>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedStream(record);
              setShowCourse(true);
            }}
            sx={{ ml: 1 }}
          >
            Manage Courses
          </Button>
        </Stack>
      ),
    },
  ];

  if (showCourse && selectedStream) {
    return (
      <Course
        stream={selectedStream}
        branchCode={branchCode}
        role={role}
        email={email}
        onBack={() => setShowCourse(false)}
      />
    );
  }

  if (showCourse && selectedStream) {
    return (
      <Course
        stream={selectedStream}
        onBack={() => setShowCourse(false)}
        branchCode={branchCode}
        role={role}
        email={email}
      />
    );
  }

  return (
    <div>
      <LoadingOverlay loading={apiLoading} />
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          Back to College
        </Button>
        <Input.Search
          placeholder="Search streams"
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 250 }}
        />
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => handleOpenDialog()}
        >
          Add Stream
        </Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Update Stream" : "Add Stream"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Stream Name"
            name="name"
            value={streamData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload Image
            <input type="file" name="photo" accept="image/*" hidden onChange={handleChange} />
          </Button>
          {streamData.photo && (
            <Typography variant="body2" sx={{ mt: 1 }}>{streamData.photo.name}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Table
        columns={columns}
        dataSource={streams}
        rowKey="id"
        loading={tableLoading}
        pagination={{ pageSize: 8 }}
        style={{ marginTop: 24 }}
      />
    </div>
  );
}
