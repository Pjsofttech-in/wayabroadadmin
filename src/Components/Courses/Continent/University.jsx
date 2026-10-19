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
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import {
  getAllUniversity,
  createUniversity,
  updateUniversity,
  deleteUniversity,
} from "./UniversityService";

import LoadingOverlay from "../../Common/LoadingOverlay";

const initialUniversity = {
  universityName: "",
  photo: null,
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50];

export default function University({
  country,
  city,
  branchCode,
  role,
  email,
  onBack,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [universitiesData, setUniversitiesData] =
    useState({ ...initialUniversity });

  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const API_URL = import.meta.env.VITE_API_URL || "";

  // Fetch universities for the selected city or country.
  const fetchUniversities = async () => {
    setTableLoading(true);
    setApiLoading(true);

    try {
      const params = {
        search: "",
        email,
        role,
        branchCode,
      };

      if (city?.id) {
        params.cityId = city.id;
      } else if (country?.id) {
        params.countryId = country.id;
      }

      const data = await getAllUniversity(params);

      const formattedData = (Array.isArray(data) ? data : []).map(
        (university) => ({
          ...university,
          universityName:
            university.universityName ||
            university.university ||
            university.name ||
            "N/A",
          imageUrl: university.image || university.imageUrl || null,
        })
      );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city?.id, country?.id]);

  // Client-side search.
  const filteredUniversities = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return universities;
    }

    return universities.filter((university) =>
      String(university.universityName || "")
        .toLowerCase()
        .includes(searchText)
    );
  }, [universities, search]);

  // Reset pagination when search or page size changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  // Keep the current page valid when records are deleted.
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredUniversities.length / pageSize)
    );

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredUniversities.length, pageSize, currentPage]);

  const handleOpenDialog = (record = null) => {
    if (record) {
      setUniversitiesData({
        universityName:
          record.universityName ||
          record.university ||
          record.name ||
          "",
        photo: null,
      });

      setEditing(record.id);
    } else {
      setUniversitiesData({ ...initialUniversity });
      setEditing(null);
    }

    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (loading) return;

    setDialogOpen(false);
    setUniversitiesData({ ...initialUniversity });
    setEditing(null);
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "photo") {
      setUniversitiesData((previous) => ({
        ...previous,
        photo: files?.[0] || null,
      }));
    } else {
      setUniversitiesData((previous) => ({
        ...previous,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    const universityName = universitiesData.universityName?.trim();

    if (!universityName) {
      message.error("University name is required");
      return;
    }

    setLoading(true);

    try {
      const payload = { universityName };

      if (editing !== null && editing !== undefined) {
        await updateUniversity(
          editing,
          payload,
          universitiesData.photo,
          country?.id,
          email,
          role,
          branchCode,
          city?.id
        );

        message.success("University updated successfully");
      } else {
        await createUniversity(
          payload,
          universitiesData.photo,
          country?.id,
          email,
          role,
          city?.id
        );

        message.success("University created successfully");
      }

      setDialogOpen(false);
      setUniversitiesData({ ...initialUniversity });
      setEditing(null);

      await fetchUniversities();
    } catch (error) {
      console.error("Error saving university:", error);

      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "University operation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);

    try {
      await deleteUniversity(id, email, role, branchCode);

      message.success("University deleted successfully");
      await fetchUniversities();
    } catch (error) {
      console.error("Error deleting university:", error);

      message.error(
        error?.response?.data?.message ||
          "Failed to delete university"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeClick = (university) => {
    const params = new URLSearchParams();
    params.set("universityId", String(university.id));

    const cityId = city?.id || searchParams.get("cityId");
    const stateId = searchParams.get("stateId");
    const countryId = searchParams.get("countryId");
    const continentId = searchParams.get("continentId");

    if (cityId) params.set("cityId", String(cityId));
    if (stateId) params.set("stateId", String(stateId));
    if (countryId) params.set("countryId", String(countryId));
    if (continentId) params.set("continentId", String(continentId));

    navigate(`/wayabroadadmin/admin/courses/college?${params.toString()}`);
  };

  const getImageUrl = (url) => {
    if (!url) return "";

    if (
      url.startsWith("data:image") ||
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const columns = [
    {
      title: "ID", dataIndex: "id", key: "id", width: 80,
      render: (value) => value ?? "-",
    },
    {
      title: "University Name", dataIndex: "universityName", key: "universityName",
      sorter: (a, b) => String(a.universityName || "").localeCompare(String(b.universityName || "")),
      render: (name) => <Typography variant="body2" sx={{ fontWeight: 500, overflowWrap: "anywhere" }}>{name || "-"}</Typography>,
    },
    {
      title: "City", key: "city",
      render: (_, record) => {
        const value = record.cityName || record.city_name || record.city?.city || record.city?.name;
        const selectedName = city?.city || city?.cityName || city?.name;
        const relationId = record.cityId ?? record.city_id;
        return value || selectedName || (relationId != null ? `#${relationId}` : "-");
      },
    },
    {
      title: "Image", dataIndex: "imageUrl", key: "imageUrl", width: 130,
      render: (url, record) => {
        const imageSrc = url ? getImageUrl(url) : null;
        return imageSrc ? <img src={imageSrc} alt={record.universityName || "University"} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} /> : "-";
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
      title: "Actions", key: "actions", width: 280,
      render: (_, record) => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <IconButton color="primary" size="small" aria-label={`Edit ${record.universityName || "university"}`} disabled={loading} onClick={() => handleOpenDialog(record)}><EditOutlined /></IconButton>
          <Popconfirm title="Delete this university?" description="This action cannot be undone." onConfirm={() => handleDelete(record.id)} okText="Delete" cancelText="Cancel">
            <IconButton color="error" size="small" aria-label={`Delete ${record.universityName || "university"}`} disabled={loading}><DeleteOutlined /></IconButton>
          </Popconfirm>
          <Button size="small" variant="outlined" onClick={() => handleCollegeClick(record)}>Manage Colleges</Button>
        </Stack>
      ),
    },
  ];

  const totalRecords = filteredUniversities.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex =
    totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize;

  const endIndex = Math.min(startIndex + pageSize, totalRecords);

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <LoadingOverlay loading={apiLoading} />

      {/* Top Toolbar */}
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
            alignSelf: { xs: "flex-start", sm: "center" },
            whiteSpace: "nowrap",
          }}
        >
          Back to {city ? "City" : "Country"}
        </Button>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Input.Search
            placeholder="Search universities"
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: "100%",
              maxWidth: 320,
            }}
          />

          <Button
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={() => handleOpenDialog()}
            sx={{ whiteSpace: "nowrap" }}
          >
            Add University
          </Button>
        </Stack>
      </Stack>

      {/* Add / Update University Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editing !== null && editing !== undefined
            ? "Update University"
            : "Add University"}
        </DialogTitle>

        <DialogContent>
          <TextField
            label="University Name"
            name="universityName"
            value={universitiesData.universityName}
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
            disabled={loading}
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

          {universitiesData.photo && (
            <Typography
              variant="body2"
              sx={{ mt: 1, overflowWrap: "anywhere" }}
            >
              Selected image: {universitiesData.photo.name}
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
            {editing !== null && editing !== undefined
              ? "Update"
              : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Universities Table */}
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          mt: 2,
          "& .ant-table": {
            fontSize: "14px",
          },
          "& .ant-table-thead > tr > th": {
            whiteSpace: "nowrap",
            backgroundColor: "#fafafa",
          },
          "& .ant-table-cell": {
            verticalAlign: "middle",
          },
        }}
      >
        <Table
          columns={columns}
          dataSource={filteredUniversities}
          rowKey={(record) => record.id}
          loading={tableLoading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: safeCurrentPage,
            pageSize,
            total: totalRecords,
            showSizeChanger: false,
            showQuickJumper: false,
            position: ["bottomCenter"],
            onChange: (page) => setCurrentPage(page),
          }}
          locale={{
            emptyText: search.trim()
              ? "No universities match your search"
              : "No universities found",
          }}
          tableLayout="auto"
        />
      </Box>

      {/* Record Count and Page Size */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{
          mt: 2,
          mb: 1,
          width: "100%",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex + (totalRecords > 0 ? 1 : 0)}–{endIndex} of{" "}
          {totalRecords} items
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "nowrap" }}
          >
            Rows per page:
          </Typography>

          <TextField
            select
            size="small"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            sx={{
              width: 100,
              "& .MuiSelect-select": {
                py: 1,
              },
            }}
            inputProps={{
              "aria-label": "Rows per page",
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>
    </Box>
  );
}
