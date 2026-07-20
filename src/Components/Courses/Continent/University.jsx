import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, Typography, CircularProgress } from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getAllUniversity, createUniversity, updateUniversity, deleteUniversity } from "./UniversityService";
import College from "./College";
import LoadingOverlay from "../../Common/LoadingOverlay";

const initialCountry = {
  universityName: "",
  photo: null,
};

export default function University({ country, city, branchCode, role, email, onBack }) {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [universitiesData, setUniversitiesData] = useState(initialCountry);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [showCollege, setShowCollege] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const fetchUniversities = async () => {
    setTableLoading(true);
    setApiLoading(true);
    try {
      const params = { search, email, role, branchCode };
      if (city?.id) {
        params.cityId = city.id;
      } else if (country?.id) {
        params.countryId = country.id;
      }
      
      const data = await getAllUniversity(params);
      // Map through the data to ensure proper field mapping
      const formattedData = data?.map(university => ({
        ...university,
        universityName: university.universityName || university.university || university.name || 'N/A',
        imageUrl: university.image || null
      })) || [];
      setUniversities(formattedData);
    } catch (error) {
      console.error("Error fetching universities:", error);
      message.error("Failed to fetch universities");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
    // eslint-disable-next-line
  }, [search]);

  const handleOpenDialog = (record = null) => {
    if (record) {
      setUniversitiesData({ ...record, universityName: record.universityName || record.university || record.name || "", photo: null });
      setEditing(record.id);
    } else {
      setUniversitiesData(initialCountry);
      setEditing(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setUniversitiesData(initialCountry);
    setEditing(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setUniversitiesData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setUniversitiesData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!universitiesData.universityName?.trim()) {
      message.error("University name is required");
      return;
    }
    
    setLoading(true);
    setApiLoading(true);
    try {
      const payload = { 
        universityName: universitiesData.universityName.trim()
      };
      let response;
      if (editing) {
        const params = { email, role, branchCode };
        if (city?.id) {
          params.cityId = city.id;
        } else if (country?.id) {
          params.countryId = country.id;
        }
        response = await updateUniversity(editing, payload, universitiesData.photo, country?.id, email, role, branchCode, city?.id);
        message.success("University updated");
      } else {
        response = await createUniversity(payload, universitiesData.photo, country?.id, email, role, city?.id);
        message.success("University created");
      }
      
      // Ensure we have the latest data including the name
      if (response) {
        fetchUniversities();
      }
      fetchUniversities();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving university:", error);
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
      await deleteUniversity(id, email, role, branchCode);
      message.success("University deleted");
      fetchUniversities();
    } catch {
      message.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeClick = (university) => {
    setSelectedUniversity(university);
    setShowCollege(true);
  };

  const handleBackFromCollege = () => {
    setShowCollege(false);
    setSelectedUniversity(null);
  };

  const columns = [
    { title: "University Name", dataIndex: "universityName", key: "universityName" },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (url, record) =>
        url ? (
          <img 
            src={url.startsWith('data:image') || url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || ''}${url}`} 
            alt={record.universityName || 'university'} 
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
          <Popconfirm title="Delete this university?" onConfirm={() => handleDelete(record.id)}>
            <IconButton><DeleteOutlined /></IconButton>
          </Popconfirm>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleCollegeClick(record)}
            sx={{ ml: 1 }}
          >
            Manage Colleges
          </Button>
        </Stack>
      ),
    },
  ];

  if (showCollege && selectedUniversity) {
    return (
      <College
        university={selectedUniversity}
        onBack={handleBackFromCollege}
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
          Back to {city ? 'City' : 'Country'}
        </Button>
        <Input.Search
          placeholder="Search universities"
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
          Add University
        </Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Update University" : "Add University"}</DialogTitle>
        <DialogContent>
          <TextField
            label="University Name"
            name="universityName"
            value={universitiesData.universityName}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload Image
            <input type="file" name="photo" accept="image/*" hidden onChange={handleChange} />
          </Button>
          {universitiesData.photo && (
            <Typography variant="body2" sx={{ mt: 1 }}>{universitiesData.photo.name}</Typography>
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
        dataSource={universities}
        rowKey="id"
        loading={tableLoading}
        pagination={{ pageSize: 8 }}
        style={{ marginTop: 24 }}
      />
    </div>
  );
}