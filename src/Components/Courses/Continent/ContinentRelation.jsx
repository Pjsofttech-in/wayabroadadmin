import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, Typography, CircularProgress } from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getAllContinents, createContinent, updateContinent, deleteContinent, getContinentById } from "./ContinentService";
import Country from "./Country";
import LoadingOverlay from "../../Common/LoadingOverlay";

// --- Main Component ---
const initialContinent = {
  continentname: "",
  photo: null,
};

export default function ContinentRelation() {
  const [continents, setContinents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [continentData, setContinentData] = useState(initialContinent);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Get role and email once, pass to API
  const role = sessionStorage.getItem("role");
  const email = sessionStorage.getItem("email");

  const fetchContinents = async () => {
    setTableLoading(true);
    setApiLoading(true);
    try {
      const data = await getAllContinents(role, email);
      setContinents(data || []);
    } catch (err) {
      console.error("Failed to fetch continents:", err);
      message.error(err.response?.data?.message || "Failed to fetch continents");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchContinents();
    // eslint-disable-next-line
  }, [search]);

  const handleOpenDialog = async (record = null) => {
    try {
      if (record) {
        const continent = await getContinentById(record.id, role, email);
        setContinentData({
          continentname: continent.continentname,
          photo: continent.photo || null,
        });
        setEditing(record.id);
      } else {
        setContinentData(initialContinent);
        setEditing(null);
      }
      setDialogOpen(true);
    } catch (err) {
      console.error("Error loading continent:", err);
      message.error(err.response?.data?.message || "Failed to load continent data");
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setContinentData(initialContinent);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setContinentData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setContinentData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setApiLoading(true);
    try {
      const data = {
        continent: {
          continentname: continentData.continentname,
        },
        image: continentData.photo
      };

      if (editing) {
        await updateContinent(editing, data, role, email);
        message.success("Continent updated successfully");
      } else {
        await createContinent(data, role, email);
        message.success("Continent created successfully");
      }
      fetchContinents();
      handleCloseDialog();
    } catch (err) {
      console.error("Error saving continent:", err);
      message.error(err.response?.data?.message || "Failed to save continent");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setApiLoading(true);
    try {
      await deleteContinent(id, role, email);
      message.success("Continent deleted successfully");
      fetchContinents();
    } catch (err) {
      console.error("Error deleting continent:", err);
      message.error(err.response?.data?.message || "Failed to delete continent");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCountry = async (record) => {
    setApiLoading(true);
    try {
      const continent = await getContinentById(record.id, role, email);
      setSelectedContinent(continent);
      setShowCountry(true);
    } catch (err) {
      console.error("Error loading continent:", err);
      message.error("Failed to load continent details");
    } finally {
      setApiLoading(false);
    }
  };

  // Add action button in columns for "Add Country"
  const columns = [
    { title: "Continent Name", dataIndex: "continentname", key: "continentname" },
    { title: "Code", dataIndex: "code", key: "code" },
    // { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (url) =>
        url ? <img src={url} alt="continent" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} /> : "No Image",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Stack direction="row" spacing={1}>
          {/* <IconButton onClick={() => handleOpenDialog(record)}><EditOutlined /></IconButton> */}
          <Popconfirm title="Delete this continent?" onConfirm={() => handleDelete(record.id)}>
            <IconButton><DeleteOutlined /></IconButton>
          </Popconfirm>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleViewCountry(record)}
            sx={{ ml: 1 }}
          >
            Add Country
          </Button>
        </Stack>
      ),
    },
  ];

  if (showCountry && selectedContinent) {
    return (
      <Country
        continent={selectedContinent}
        onBack={() => setShowCountry(false)}
      />
    );
  }

  return (
    <div>
      <LoadingOverlay loading={apiLoading} />
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Input.Search
          placeholder="Search continents"
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
          Add Continent
        </Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Update Continent" : "Add Continent"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Continent Name"
            name="continentname"
            value={continentData.continentname}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
      
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload Image
            <input type="file" name="photo" accept="image/*" hidden onChange={handleChange} />
          </Button>
          {continentData.photo && (
            <Typography variant="body2" sx={{ mt: 1 }}>{continentData.photo.name}</Typography>
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
        dataSource={continents}
        rowKey="id"
        loading={tableLoading}
        pagination={{ pageSize: 8 }}
        style={{ marginTop: 24 }}
      />
    </div>
  );
}