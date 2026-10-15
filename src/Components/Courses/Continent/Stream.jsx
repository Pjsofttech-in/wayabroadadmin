import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, Typography, CircularProgress } from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getAllStreams, createStream, updateStream, deleteStream } from "./StreamService";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiLoading, setApiLoading] = useState(false);
  const effectiveRole = role || sessionStorage.getItem("role") || localStorage.getItem("role") || "";
  const effectiveEmail = email || sessionStorage.getItem("email") || localStorage.getItem("email") || "";
  const effectiveBranchCode = branchCode || sessionStorage.getItem("branchCode") || localStorage.getItem("branchCode") || "";

  const fetchStreams = async () => {
    setTableLoading(true);
    setApiLoading(true);
    try {
      const data = await getAllStreams({
        search,
        email: effectiveEmail,
        role: effectiveRole,
        branchCode: effectiveBranchCode,
        // Optional: streams have no college_id column in the supplied SQL schema.
        // Preserve this request filter when a college context is selected.
        collegeId: college?.id,
      });
      
      const formattedData = (Array.isArray(data) ? data : []).map((streamItem) => ({
        ...streamItem,
        imageUrl: streamItem.image || null,
      }));
      
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
  }, [search, college?.id, effectiveEmail, effectiveRole, effectiveBranchCode]);

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
    if (!streamData.name?.trim()) {
      message.error("Stream name is required");
      return;
    }

    setLoading(true);
    setApiLoading(true);
    try {
      const payload = { name: streamData.name.trim() };
      if (editing) {
        await updateStream(editing, payload, streamData.photo, effectiveEmail, effectiveRole, effectiveBranchCode);
        message.success("Stream updated successfully");
      } else {
        await createStream(
          payload, 
          streamData.photo, 
          effectiveRole,
          effectiveEmail,
          college?.id,
          effectiveBranchCode
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
      await deleteStream(id, effectiveRole, effectiveEmail, effectiveBranchCode);
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
    { title: "ID", dataIndex: "id", key: "id", width: 80, render: (value) => value ?? "-" },
    {
      title: "Stream Name", dataIndex: "name", key: "name",
      sorter: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
      render: (value) => value || "-",
    },
    {
      title: "Image", dataIndex: "imageUrl", key: "imageUrl", width: 120,
      render: (url, record) => {
        const imageSrc = url ? (url.startsWith("data:image") || /^https?:\/\//i.test(url) ? url : `${import.meta.env.VITE_API_URL || ""}${url}`) : null;
        return imageSrc ? <img src={imageSrc} alt={record.name || "Stream"} loading="lazy" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} /> : "-";
      },
    },
    {
      title: "Created By Email", key: "createdByEmail",
      render: (_, record) => record.createdByEmail || record.created_by_email || "-",
    },
    { title: "Role", dataIndex: "role", key: "role", render: (value) => value || "-" },
    {
      title: "Actions", key: "actions", width: 230,
      render: (_, record) => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <IconButton aria-label={`Edit ${record.name || "stream"}`} disabled={loading} onClick={() => handleOpenDialog(record)}><EditOutlined /></IconButton>
          <Popconfirm title="Delete this stream?" onConfirm={() => handleDelete(record.id)}>
            <IconButton size="small" aria-label={`Delete ${record.name || "stream"}`} disabled={loading}><DeleteOutlined /></IconButton>
          </Popconfirm>
          <Button size="small" variant="outlined" onClick={() => { const params = new URLSearchParams(searchParams); params.set("streamId", String(record.id)); if (college?.id != null) params.set("collegeId", String(college.id)); else params.delete("collegeId"); navigate(`/wayabroadadmin/admin/courses/course?${params.toString()}`); }}>Manage Courses</Button>
        </Stack>
      ),
    },
  ];

  return (
    <div>
      <LoadingOverlay loading={apiLoading} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} mb={2}>
        {onBack && (
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
            Back to College
          </Button>
        )}
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
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 8 }}
        style={{ marginTop: 24 }}
      />
    </div>
  );
}
