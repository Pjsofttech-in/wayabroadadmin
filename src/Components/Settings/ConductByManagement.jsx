import React, { useState, useEffect } from "react";
import {
  TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Box, Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import Loading from "../Common/LoadingOverlay";
import AlertService from "../Common/AlertService";

import {
  createConductBy,
  getAllConductBy,
  updateConductBy,
  deleteConductBy
} from "./ConductByManagement";

const ConductByManagement = () => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [conductList, setConductList] = useState([]);
  const [selectedConduct, setSelectedConduct] = useState(null);
  const [conductBy, setConductBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchConductBy();
  }, []);

  const fetchConductBy = async () => {
    setLoading(true);
    try {
      const data = await getAllConductBy();
      setConductList(Array.isArray(data) ? data : []);
    } catch {
      AlertService.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setConductBy("");
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormErrors({});
  };

  const handleClickOpen = (record) => {
    setSelectedConduct(record);
    setConductBy(record.conductBy || "");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedConduct(null);
    setFormErrors({});
  };

  const handleAdd = async () => {
    const trimmedConductBy = conductBy?.trim();
    if (!trimmedConductBy) {
      setFormErrors({ conductBy: "Conduct By is required" });
      return;
    }
    try {
      await createConductBy({ conductBy: trimmedConductBy });
      AlertService.success("Added successfully");
      await fetchConductBy();
      handleDialogClose();
    } catch (error) {
      AlertService.error(error.message || "Failed to add");
    }
  };

  const handleUpdate = async () => {
    const trimmedConductBy = conductBy?.trim();
    if (!selectedConduct || !trimmedConductBy) {
      setFormErrors({ conductBy: "Conduct By is required" });
      return;
    }
    setLoading(true);
    try {
      await updateConductBy(selectedConduct.id, { conductBy: trimmedConductBy });
      AlertService.success("Updated successfully");
      await fetchConductBy();
      handleClose();
    } catch (error) {
      AlertService.error(error.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    const isConfirmed = await AlertService.confirm(
      `Are you sure you want to delete "${record.name}"?`
    );
    if (!isConfirmed) return;
    setLoading(true);
    try {
      await deleteConductBy(record.id);
      AlertService.success("Deleted successfully");
      await fetchConductBy();
    } catch (error) {
      AlertService.error(error.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const filteredList = conductList.filter((c) =>
    (c.conductBy || "").toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: "Conducted By",
      dataIndex: "conductBy",
      key: "conductBy",
      render: (text) =>
        text || (
          <span style={{ color: "#999", fontStyle: "italic" }}>
            Unnamed
          </span>
        ),
      sorter: (a, b) => (a.conductBy || "").localeCompare(b.conductBy || "")
    },
    {
      title: "Actions",
      key: "actions",
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
      <Typography variant="h5" gutterBottom>
        Conducted By Management
      </Typography>

      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" gap={2}>
          <TextField
            label="Search"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <Typography variant="body1" color="textSecondary">
            Total: {filteredList.length}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlusOutlined />}
          onClick={handleDialogOpen}
        >
          Add Conducted By
        </Button>
      </Box>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Conducted By</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={conductBy}
            onChange={(e) => setConductBy(e.target.value)}
            error={!!formErrors.conductBy}
            helperText={formErrors.conductBy}
            onKeyPress={(e) => e.key === "Enter" && handleAdd()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Conducted By</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={conductBy}
            onChange={(e) => setConductBy(e.target.value)}
            error={!!formErrors.conductBy}
            helperText={formErrors.conductBy}
            onKeyPress={(e) => e.key === "Enter" && handleUpdate()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Table
        columns={columns}
        dataSource={filteredList.map((c) => ({ ...c, key: c.id }))}
        rowKey="key"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} records`
        }}
        loading={loading}
      />

      <style>
        {`
          .ant-table-thead > tr > th {
            background: #f5f5f5 !important;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
          }
        `}
      </style>
    </div>
  );
};

export default ConductByManagement;
