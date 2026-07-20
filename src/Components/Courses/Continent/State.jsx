import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, Typography, CircularProgress } from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditOutlined, DeleteOutlined, PlusOutlined, EnvironmentOutlined } from "@ant-design/icons";
import StateService from "./StateService";
import City from "./City";
import LoadingOverlay from "../../Common/LoadingOverlay";

const initialState = {
  state: "",
  description: "",
  photo: null,
};

export default function State({ country, onBack }) {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stateData, setStateData] = useState(initialState);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [showCity, setShowCity] = useState(false);
  const [selectedState, setSelectedState] = useState(null);

  const role = sessionStorage.getItem("role");
  const email = sessionStorage.getItem("email");
  const branchCode = sessionStorage.getItem("branchCode") || "";

  const fetchStates = async () => {
    setTableLoading(true);
    setApiLoading(true);
    try {
      const data = await StateService.getAllStates(role, email, country?.id);
      // Map through the data to ensure imageUrl is properly set
      const formattedData = data?.map(state => ({
        ...state,
        imageUrl: state.image || null
      })) || [];
      setStates(formattedData);
    } catch (error) {
      message.error("Failed to fetch states");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    if (country?.id) {
      fetchStates();
    }
    // eslint-disable-next-line
  }, [search, country]);

  const handleOpenDialog = (record = null) => {
    if (record) {
      setStateData({ ...record, state: record.state || record.name || "", photo: null });
      setEditing(record.id);
    } else {
      setStateData(initialState);
      setEditing(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setStateData(initialState);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setStateData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setStateData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!stateData.state) {
      message.error("State name is required");
      return;
    }

    setLoading(true);
    setApiLoading(true);
    try {
      const payload = { state: stateData.state };
      if (editing) {
        await StateService.updateState(editing, payload, stateData.photo, country?.id, role, email, branchCode);
        message.success("State updated");
      } else {
        await StateService.createState(payload, stateData.photo, country?.id, role, email);
        message.success("State created");
      }
      fetchStates();
      handleCloseDialog();
    } catch (error) {
      message.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setApiLoading(true);
    try {
      await StateService.deleteState(id, role, email, branchCode);
      message.success("State deleted");
      fetchStates();
    } catch (error) {
      message.error(error.message || "Delete failed");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const columns = [
    { title: "State Name", dataIndex: "state", key: "state" },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (url, record) =>
        url ? (
          <img 
            src={url.startsWith('data:image') || url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || ''}${url}`} 
            alt={record.state || 'state'} 
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
          {/* <IconButton onClick={() => handleOpenDialog(record)}><EditOutlined /></IconButton> */}
          <Popconfirm title="Delete this state?" onConfirm={() => handleDelete(record.id)}>
            <IconButton><DeleteOutlined /></IconButton>
          </Popconfirm>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedState(record);
              setShowCity(true);
            }}
            sx={{ ml: 1 }}
            startIcon={<EnvironmentOutlined />}
          >
            Manage Cities
          </Button>
        </Stack>
      ),
    },
  ];

  if (showCity && selectedState) {
    return (
      <City
        state={selectedState}
        onBack={() => setShowCity(false)}
        role={role}
        email={email}
        branchCode={branchCode}
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
          Back to Country
        </Button>
        <Input.Search
          placeholder="Search states"
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
          Add State
        </Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Update State" : "Add State"}</DialogTitle>
        <DialogContent>
          <TextField
            label="State Name"
            name="state"
            value={stateData.state}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload Image
            <input type="file" name="photo" accept="image/*" hidden onChange={handleChange} />
          </Button>
          {stateData.photo && (
            <Typography variant="body2" sx={{ mt: 1 }}>{stateData.photo.name}</Typography>
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
        dataSource={states}
        rowKey="id"
        loading={tableLoading}
        pagination={{ pageSize: 8 }}
        style={{ marginTop: 24 }}
      />
    </div>
  );
}