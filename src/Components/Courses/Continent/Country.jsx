import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  IconButton,
  Typography,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  getAllCountries,
  createCountry,
  updateCountry,
  deleteCountry,
} from "./CountryService";
import State from "./State.jsx";
import LoadingOverlay from "../../Common/LoadingOverlay";

const initialCountry = {
  country: "",
  code: "",
  description: "",
  photo: null,
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50];

export default function Country({ continent, onBack }) {
  const navigate = useNavigate();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const role = sessionStorage.getItem("role");
  const email = sessionStorage.getItem("email");
  const branchCode = sessionStorage.getItem("branchCode") || "";

  const fetchCountries = async () => {
    setTableLoading(true);
    setApiLoading(true);

    try {
      const data = await getAllCountries({
        search,
        email,
        role,
        branchCode,
        continentId: continent?.id,
      });

      const formattedData = (Array.isArray(data) ? data : []).map(
        (country) => ({
          ...country,
          imageUrl: country.image || null,
        })
      );

      setCountries(formattedData);
    } catch (error) {
      console.error("Failed to fetch countries:", error);
      message.error("Failed to fetch countries");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    // Search is handled by the existing API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, continent?.id]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleOpenDialog = (record = null) => {
    if (record) {
      setCountryData({
        ...initialCountry,
        ...record,
        country: record.country || record.name || "",
        photo: null,
      });
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

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "photo") {
      setCountryData((previous) => ({
        ...previous,
        photo: files?.[0] || null,
      }));
    } else {
      setCountryData((previous) => ({
        ...previous,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    if (!countryData.country.trim()) {
      message.warning("Please enter a country name");
      return;
    }

    setLoading(true);
    setApiLoading(true);

    try {
      const payload = { country: countryData.country.trim() };

      if (editing) {
        await updateCountry(
          editing,
          payload,
          countryData.photo,
          continent.id,
          email,
          role,
          branchCode
        );
        message.success("Country updated successfully");
      } else {
        await createCountry(
          payload,
          countryData.photo,
          continent.id,
          email,
          role
        );
        message.success("Country created successfully");
      }

      handleCloseDialog();
      setCurrentPage(1);
      await fetchCountries();
    } catch (error) {
      console.error("Country save failed:", error);
      message.error("Operation failed");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setApiLoading(true);

    try {
      await deleteCountry(id, email, role, branchCode);
      message.success("Country deleted successfully");
      await fetchCountries();
    } catch (error) {
      console.error("Country deletion failed:", error);
      message.error("Delete failed");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const totalRecords = countries.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visibleRange = useMemo(() => {
    if (totalRecords === 0) {
      return { start: 0, end: 0 };
    }

    return {
      start: (currentPage - 1) * pageSize + 1,
      end: Math.min(currentPage * pageSize, totalRecords),
    };
  }, [currentPage, pageSize, totalRecords]);

  const columns = [
    {
      title: "ID", dataIndex: "id", key: "id", width: 80,
      render: (value) => value ?? "-",
    },
    {
      title: "Country Name", dataIndex: "country", key: "country",
      sorter: (a, b) => String(a.country || a.name || "").localeCompare(String(b.country || b.name || "")),
      render: (value, record) => <Typography variant="body2" fontWeight={500}>{value || record.name || "-"}</Typography>,
    },
    {
      title: "Continent", key: "continent",
      render: (_, record) => {
        const value = record.continentName || record.continent_name || record.continent?.continentname || record.continent?.name;
        const selectedName = continent?.continentname || continent?.continentName || continent?.name;
        const relationId = record.continentId ?? record.continent_id;
        return value || selectedName || (relationId != null ? `#${relationId}` : "-");
      },
    },
    {
      title: "Image", dataIndex: "imageUrl", key: "imageUrl", width: 120,
      render: (url, record) => {
        const imageSrc = url ? (url.startsWith("data:image") || /^https?:\/\//i.test(url) ? url : `${import.meta.env.VITE_API_URL || ""}${url}`) : null;
        return imageSrc ? <img src={imageSrc} alt={record.country || record.name || "Country"} loading="lazy" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} /> : "-";
      },
    },
    {
      title: "Created By Email", key: "createdByEmail",
      render: (_, record) => record.createdByEmail || record.created_by_email || "-",
    },
    {
      title: "Role", dataIndex: "role", key: "role", render: (value) => value || "-",
    },
    {
      title: "Actions", key: "actions", width: 230,
      render: (_, record) => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <IconButton size="small" aria-label={`Edit ${record.country || "country"}`} disabled={loading} onClick={() => handleOpenDialog(record)}><EditOutlined /></IconButton>
          <Popconfirm title="Delete this country?" description="This action cannot be undone." onConfirm={() => handleDelete(record.id)} okText="Delete" cancelText="Cancel">
            <IconButton size="small" aria-label={`Delete ${record.country || "country"}`} color="default" disabled={loading}><DeleteOutlined /></IconButton>
          </Popconfirm>
          <Button size="small" variant="outlined" onClick={() => { setSelectedCountry(record); navigate(`/wayabroadadmin/admin/courses/state?countryId=${record.id}&continentId=${continent?.id || ""}`); }}>Manage States</Button>
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
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <LoadingOverlay loading={apiLoading} />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2, width: "100%" }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" } }}
        >
          Back to Continents
        </Button>

        <Box
          sx={{
            display: "flex",
            flex: 1,
            justifyContent: { xs: "stretch", sm: "flex-end" },
            gap: 1.5,
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          <Input.Search
            placeholder="Search countries"
            allowClear
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            style={{ width: "100%", maxWidth: 300 }}
            aria-label="Search countries"
          />

          <Button
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={() => handleOpenDialog()}
            sx={{ minWidth: 150, flexShrink: 0 }}
          >
            Add Country
          </Button>
        </Box>
      </Stack>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editing ? "Update Country" : "Add Country"}
        </DialogTitle>

        <DialogContent>
          <TextField
            label="Country Name"
            name="country"
            value={countryData.country}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            autoFocus
          />

          <Button
            variant="contained"
            component="label"
            sx={{ mt: 2 }}
          >
            Upload Image
            <input
              type="file"
              name="photo"
              accept="image/*"
              hidden
              onChange={handleChange}
            />
          </Button>

          {countryData.photo && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {countryData.photo.name}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={18} /> : null
            }
          >
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          mt: 2,
          borderRadius: 1,
          overflow: "hidden",
          "& .ant-table": { fontSize: 13 },
          "& .ant-table-thead > tr > th": {
            fontWeight: 600,
            whiteSpace: "nowrap",
            padding: "12px 16px",
          },
          "& .ant-table-tbody > tr > td": {
            padding: "12px 16px",
            verticalAlign: "middle",
          },
          "& .ant-pagination": {
            margin: "16px 0",
          },
        }}
      >
        <Table
          columns={columns}
          dataSource={countries}
          rowKey="id"
          loading={tableLoading}
          size="middle"
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalRecords,
            showSizeChanger: false,
            onChange: (page) => setCurrentPage(page),
            position: ["bottomCenter"],
          }}
        />
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        sx={{ mt: 1, pb: 1 }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {visibleRange.start}–{visibleRange.end} of {totalRecords}{" "}
          items
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Rows per page
          </Typography>

          <TextField
            select
            size="small"
            value={pageSize}
            onChange={(event) =>
              handlePageSizeChange(Number(event.target.value))
            }
            sx={{
              width: 105,
              "& .MuiInputBase-root": { height: 36 },
              "& .MuiSelect-select": { py: 0.75 },
            }}
            inputProps={{ "aria-label": "Rows per page" }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <MenuItem key={size} value={size}>
                {size} / page
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>
    </Box>
  );
}
