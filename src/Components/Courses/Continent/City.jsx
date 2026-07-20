import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, Typography, CircularProgress } from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import CityService from "./CityService";
import University from "./University";
import LoadingOverlay from "../../Common/LoadingOverlay";

const initialCity = {
  city: "",
  description: "",
  photo: null,
};

export default function City({ state, onBack }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cityData, setCityData] = useState(initialCity);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [showUniversity, setShowUniversity] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const role = sessionStorage.getItem("role");
  const email = sessionStorage.getItem("email");
  const branchCode = sessionStorage.getItem("branchCode") || "";

  const fetchCities = async () => {
    setTableLoading(true);
    setApiLoading(true);
    try {
      const data = await CityService.getAllCities(role, email, state?.id);
      const formattedData = data?.map(city => ({
        ...city,
        imageUrl: city.image || null
      })) || [];
      setCities(formattedData);
    } catch (error) {
      message.error("Failed to fetch cities");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    if (state?.id) {
      fetchCities();
    }
  }, [search, state]);

  const handleOpenDialog = (record = null) => {
    if (record) {
      setCityData({ ...record, city: record.city || record.name || "", photo: null });
      setEditing(record.id);
    } else {
      setCityData(initialCity);
      setEditing(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCityData(initialCity);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setCityData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setCityData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!cityData.city) {
      message.error("City name is required");
      return;
    }

    setLoading(true);
    setApiLoading(true);
    try {
      const payload = { city: cityData.city };
      if (editing) {
        await CityService.updateCity(editing, payload, cityData.photo, state?.id, role, email, branchCode);
        message.success("City updated");
      } else {
        await CityService.createCity(payload, cityData.photo, state?.id, role, email);
        message.success("City created");
      }
      fetchCities();
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
      await CityService.deleteCity(id, role, email, branchCode);
      message.success("City deleted");
      fetchCities();
    } catch (error) {
      message.error(error.message || "Delete failed");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const columns = [
    { title: "City Name", dataIndex: "city", key: "city" },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (url, record) =>
        url ? (
          <img 
            src={url.startsWith('data:image') || url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || ''}${url}`} 
            alt={record.city || 'city'} 
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
          <Popconfirm title="Delete this city?" onConfirm={() => handleDelete(record.id)}>
            <IconButton><DeleteOutlined /></IconButton>
          </Popconfirm>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedCity(record);
              setShowUniversity(true);
            }}
            sx={{ ml: 1 }}
          >
            Manage Universities
          </Button>
        </Stack>
      ),
    },
  ];

  if (showUniversity && selectedCity) {
    return (
      <University
        country={state.country} // Pass the country object from state
        city={selectedCity}    // Pass the selected city
        onBack={() => setShowUniversity(false)}
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
          Back to State
        </Button>
        <Input.Search
          placeholder="Search cities"
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 250 }}
        />
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => handleOpenDialog()}
          sx={{ minWidth: 150 }}
        >
          Add City
        </Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Update City" : "Add City"}</DialogTitle>
        <DialogContent>
          <TextField
            label="City Name"
            name="city"
            value={cityData.city}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload Image
            <input type="file" name="photo" accept="image/*" hidden onChange={handleChange} />
          </Button>
          {cityData.photo && (
            <Typography variant="body2" sx={{ mt: 1 }}>{cityData.photo.name}</Typography>
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
        dataSource={cities}
        rowKey="id"
        loading={tableLoading}
        pagination={{ pageSize: 8 }}
        style={{ marginTop: 24 }}
      />
    </div>
  );
}