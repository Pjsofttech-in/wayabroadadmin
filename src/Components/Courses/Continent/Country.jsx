import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, Typography, CircularProgress } from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getAllCountries, createCountry, updateCountry, deleteCountry } from "./CountryService";
import State from "./State.jsx";
import LoadingOverlay from "../../Common/LoadingOverlay";

const initialCountry = {
  country: "",
  code: "",
  description: "",
  photo: null,
};

export default function Country({ continent, onBack }) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [countryData, setCountryData] = useState(initialCountry);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const role = sessionStorage.getItem("role");
  const email = sessionStorage.getItem("email");
  const branchCode = sessionStorage.getItem("branchCode") || "";

  const fetchCountries = async () => {
    setTableLoading(true);
    setApiLoading(true);
    try {
      const data = await getAllCountries({ search, email, role, branchCode, continentId: continent.id });
      // Map through the data to ensure imageUrl is properly set
      const formattedData = data?.map(country => ({
        ...country,
        imageUrl: country.image || null
      })) || [];
      setCountries(formattedData);
    } catch {
      message.error("Failed to fetch countries");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    // eslint-disable-next-line
  }, [search]);

  const handleOpenDialog = (record = null) => {
    if (record) {
      setCountryData({ ...record, country: record.country || record.name || "", photo: null });
      setEditing(record.id);
    } else {
      setCountryData(initialCountry);
      setEditing(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCountryData(initialCountry);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setCountryData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setCountryData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setApiLoading(true);
    try {
      // Pass as { country: countryData.country }
      const payload = { country: countryData.country };
      if (editing) {
        await updateCountry(editing, payload, countryData.photo, continent.id, email, role, branchCode);
        message.success("Country updated");
      } else {
        await createCountry(payload, countryData.photo, continent.id, email, role);
        message.success("Country created");
      }
      fetchCountries();
      handleCloseDialog();
    } catch {
      message.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setApiLoading(true);
    try {
      await deleteCountry(id, email, role, branchCode);
      message.success("Country deleted");
      fetchCountries();
    } catch {
      message.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Country Name", dataIndex: "country", key: "country" },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (url, record) =>
        url ? (
          <img 
            src={url.startsWith('data:image') || url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || ''}${url}`} 
            alt={record.country || 'country'} 
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
          <Popconfirm title="Delete this country?" onConfirm={() => handleDelete(record.id)}>
            <IconButton><DeleteOutlined /></IconButton>
          </Popconfirm>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedCountry(record);
              setShowStates(true);
            }}
            sx={{ ml: 1 }}
          >
            Add State
          </Button>
        </Stack>
      ),
    },
  ];

  if (showStates && selectedCountry) {
    return (
      <State
        country={selectedCountry}
        onBack={() => setShowStates(false)}
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
          Back to Continents
        </Button>
        <Input.Search
          placeholder="Search countries"
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
          Add Country
        </Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Update Country" : "Add Country"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Country Name"
            name="country"
            value={countryData.country}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload Image
            <input type="file" name="photo" accept="image/*" hidden onChange={handleChange} />
          </Button>
          {countryData.photo && (
            <Typography variant="body2" sx={{ mt: 1 }}>{countryData.photo.name}</Typography>
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
        dataSource={countries}
        rowKey="id"
        loading={tableLoading}
        pagination={{ pageSize: 8 }}
        style={{ marginTop: 24 }}
      />
    </div>
  );
}