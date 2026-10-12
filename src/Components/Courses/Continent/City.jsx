import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import CityService from "./CityService";
import LoadingOverlay from "../../Common/LoadingOverlay";

const initialCity = {
  city: "",
  description: "",
  photo: null,
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50];

export default function City({ state, onBack }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cityData, setCityData] = useState(initialCity);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const role = sessionStorage.getItem("role");
  const email = sessionStorage.getItem("email");
  const branchCode = sessionStorage.getItem("branchCode") || "";

  const fetchCities = async () => {
    if (!state?.id) return;

    setTableLoading(true);
    setApiLoading(true);

    try {
      const data = await CityService.getAllCities(
        role,
        email,
        state.id
      );

      const formattedData = (Array.isArray(data) ? data : []).map(
        (cityItem) => ({
          ...cityItem,
          imageUrl: cityItem.image || null,
        })
      );

      setCities(formattedData);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      message.error("Failed to fetch cities");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
    // CityService.getAllCities currently receives no search argument.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.id]);

  const filteredCities = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return cities;

    return cities.filter((item) =>
      String(item.city || item.name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [cities, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const handleOpenDialog = (record = null) => {
    if (record) {
      setCityData({
        ...initialCity,
        ...record,
        city: record.city || record.name || "",
        photo: null,
      });
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

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "photo") {
      setCityData((previous) => ({
        ...previous,
        photo: files?.[0] || null,
      }));
    } else {
      setCityData((previous) => ({
        ...previous,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    if (!cityData.city.trim()) {
      message.error("City name is required");
      return;
    }

    setLoading(true);
    setApiLoading(true);

    try {
      const payload = { city: cityData.city.trim() };

      if (editing) {
        await CityService.updateCity(
          editing,
          payload,
          cityData.photo,
          state?.id,
          role,
          email,
          branchCode
        );
        message.success("City updated successfully");
      } else {
        await CityService.createCity(
          payload,
          cityData.photo,
          state?.id,
          role,
          email
        );
        message.success("City created successfully");
      }

      handleCloseDialog();
      setCurrentPage(1);
      await fetchCities();
    } catch (error) {
      console.error("City save failed:", error);
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
      message.success("City deleted successfully");
      await fetchCities();
    } catch (error) {
      console.error("City deletion failed:", error);
      message.error(error.message || "Delete failed");
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const totalRecords = filteredCities.length;
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

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "City Name",
      dataIndex: "city",
      key: "city",
      render: (value, record) => (
        <Typography variant="body2" fontWeight={500}>
          {value || record.name || "-"}
        </Typography>
      ),
    },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 120,
      render: (url, record) => {
        const imageSrc = url
          ? url.startsWith("data:image") || url.startsWith("http")
            ? url
            : `${import.meta.env.VITE_API_URL || ""}${url}`
          : null;

        return imageSrc ? (
          <img
            src={imageSrc}
            alt={record.city || record.name || "City"}
            loading="lazy"
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              fontSize: 10,
              color: "text.secondary",
            }}
          >
            No Image
          </Box>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 230,
      render: (_, record) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Popconfirm
            title="Delete this city?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <IconButton
              size="small"
              aria-label={`Delete ${record.city || "city"}`}
            >
              <DeleteOutlined />
            </IconButton>
          </Popconfirm>

          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const params = new URLSearchParams();
              params.set("cityId", String(record.id));
              if (state?.id != null) params.set("stateId", String(state.id));
              const countryId = searchParams.get("countryId") || state?.country?.id;
              if (countryId != null && countryId !== "") {
                params.set("countryId", String(countryId));
              }
              navigate(`/wayabroadadmin/admin/courses/university?${params.toString()}`);
            }}
          >
            Manage Universities
          </Button>
        </Stack>
      ),
    },
  ];

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
          sx={{
            flexShrink: 0,
            alignSelf: { xs: "flex-start", sm: "auto" },
          }}
        >
          Back to State
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
            placeholder="Search cities"
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: "100%", maxWidth: 300 }}
            aria-label="Search cities"
          />

          <Button
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={() => handleOpenDialog()}
            sx={{ minWidth: 150, flexShrink: 0 }}
          >
            Add City
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
          {editing ? "Update City" : "Add City"}
        </DialogTitle>

        <DialogContent>
          <TextField
            label="City Name"
            name="city"
            value={cityData.city}
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

          {cityData.photo && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {cityData.photo.name}
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
          dataSource={filteredCities}
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