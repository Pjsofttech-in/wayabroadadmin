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
} from "@mui/material";
import { Table, Input, Popconfirm, message } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  getAllContinents,
  createContinent,
  updateContinent,
  deleteContinent,
  getContinentById,
} from "./ContinentService";
import LoadingOverlay from "../../Common/LoadingOverlay";
import CourseBreadcrumb from "./CourseBreadcrumb";
import {
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

const initialContinent = {
  continentname: "",
  photo: null,
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50];

export default function ContinentRelation() {
  const [continents, setContinents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [continentData, setContinentData] = useState(initialContinent);
  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Get role and email once, pass to API
  const role = sessionStorage.getItem("role");
  const email = sessionStorage.getItem("email");
  const navigate = useNavigate();

  const fetchContinents = async () => {
    setTableLoading(true);
    setApiLoading(true);

    try {
      const data = await getAllContinents(role, email);
      setContinents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch continents:", err);
      message.error(
        err.response?.data?.message || "Failed to fetch continents"
      );
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchContinents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter data locally based on the search term
  const filteredContinents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return continents;

    return continents.filter((continent) => {
      const searchableValues = [
        continent.continentname,
        continent.createdByEmail,
        continent.created_by_email,
        continent.role,
      ];

      return searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );
    });
  }, [continents, search]);

  const totalItems = filteredContinents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const safePage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  );

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pageContinents = filteredContinents.slice(
    startIndex,
    endIndex
  );

  // Keep the selected page valid when filtering or deleting data
  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleOpenDialog = async (record = null) => {
    try {
      if (record) {
        const continent = await getContinentById(
          record.id,
          role,
          email
        );

        setContinentData({
          continentname: continent.continentname,
          photo: continent.image || continent.photo || null,
        });

        setEditing(record.id);
      } else {
        setContinentData(initialContinent);
        setEditing(null);
      }

      setDialogOpen(true);
    } catch (err) {
      console.error("Error loading continent:", err);
      message.error(
        err.response?.data?.message ||
          "Failed to load continent data"
      );
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setContinentData(initialContinent);
    setEditing(null);
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "photo") {
      setContinentData((prev) => ({
        ...prev,
        photo: files?.[0] || null,
      }));
    } else {
      setContinentData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    if (!continentData.continentname?.trim()) {
      message.error("Continent name is required");
      return;
    }

    setLoading(true);
    setApiLoading(true);

    try {
      const data = {
        continent: {
          continentname: continentData.continentname.trim(),
        },
        image: continentData.photo,
      };

      if (editing) {
        await updateContinent(editing, data, role, email);
        message.success("Continent updated successfully");
      } else {
        await createContinent(data, role, email);
        message.success("Continent created successfully");
        setCurrentPage(1);
      }

      handleCloseDialog();
      await fetchContinents();
    } catch (err) {
      console.error("Error saving continent:", err);
      message.error(
        err.response?.data?.message || "Failed to save continent"
      );
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setApiLoading(true);

    try {
      await deleteContinent(id, role, email);
      message.success("Continent deleted successfully");
      await fetchContinents();
    } catch (err) {
      console.error("Error deleting continent:", err);
      message.error(
        err.response?.data?.message || "Failed to delete continent"
      );
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  const handleViewCountry = (record) => {
    // Keep the selected continent in the URL so the Courses sub-sidebar
    // follows the user from Continents to Countries.
    navigate(`/wayabroadadmin/admin/courses/country?continentId=${encodeURIComponent(record.id)}`);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    const pages = new Set([
      1,
      totalPages,
      safePage - 1,
      safePage,
      safePage + 1,
    ]);

    const sortedPages = [...pages]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    const result = [];

    sortedPages.forEach((page, index) => {
      if (index > 0) {
        const previousPage = sortedPages[index - 1];

        if (page - previousPage > 1) {
          result.push(`ellipsis-${previousPage}`);
        }
      }

      result.push(page);
    });

    return result;
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (value) => value ?? "-",
    },
    {
      title: "Continent Name",
      dataIndex: "continentname",
      key: "continentname",
      sorter: (a, b) => String(a.continentname || "").localeCompare(String(b.continentname || "")),
      render: (value) => value || "-",
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 120,
      render: (url, record) => {
        const imageUrl = url || record.imageUrl;
        const src = imageUrl
          ? imageUrl.startsWith("data:image") || /^https?:\/\//i.test(imageUrl)
            ? imageUrl
            : `${import.meta.env.VITE_API_URL || ""}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
          : null;
        return src ? (
          <img src={src} alt={record.continentname || "Continent"} loading="lazy" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
        ) : "-";
      },
    },
    {
      title: "Created By Email",
      key: "createdByEmail",
      render: (_, record) => record.createdByEmail || record.created_by_email || "-",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (value) => value || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 260,
      render: (_, record) => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <IconButton aria-label={`Edit ${record.continentname || "continent"}`} size="small" disabled={loading} onClick={() => handleOpenDialog(record)}>
            <EditOutlined />
          </IconButton>
          <Popconfirm
            title="Delete this continent?"
            description="Are you sure you want to delete this continent?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <IconButton aria-label={`Delete ${record.continentname || "continent"}`} color="default" size="small" disabled={loading}>
              <DeleteOutlined />
            </IconButton>
          </Popconfirm>
          <Button size="small" variant="outlined" onClick={() => handleViewCountry(record)}>
            Manage Countries
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <LoadingOverlay loading={apiLoading} />
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        Continent Management
      </Typography>
      <CourseBreadcrumb currentLabel="Continent Management" />

      {/* Search and Add Continent */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={2}
      >
        <Input.Search
          placeholder="Search continents"
          allowClear
          value={search}
          onChange={handleSearchChange}
          style={{ width: "100%", maxWidth: 250 }}
        />

        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => handleOpenDialog()}
          sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
        >
          Add Continent
        </Button>
      </Stack>

      {/* Add / Update Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editing ? "Update Continent" : "Add Continent"}
        </DialogTitle>

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

          {continentData.photo && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {continentData.photo instanceof File
                ? continentData.photo.name
                : "Existing image selected"}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={18} /> : null
            }
          >
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Continents Table */}
      <Box sx={{ width: "100%", overflowX: "auto", mt: 3 }}>
        <Table
          columns={columns}
          dataSource={pageContinents}
          rowKey="id"
          loading={tableLoading}
          pagination={false}
          locale={{ emptyText: "No continents found" }}
        />
      </Box>

      {/* Pagination Footer */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{
          mt: 2,
          mb: 2,
          width: "100%",
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ whiteSpace: "nowrap" }}
        >
          Showing {startIndex + (totalItems > 0 ? 1 : 0)}–
          {endIndex} of {totalItems} items
        </Typography>

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          justifyContent={{ xs: "flex-start", md: "center" }}
          flexWrap="wrap"
          useFlexGap
        >
          <IconButton
            aria-label="First page"
            size="small"
            disabled={safePage <= 1 || totalPages === 0}
            onClick={() => setCurrentPage(1)}
          >
            <FirstPage />
          </IconButton>

          <IconButton
            aria-label="Previous page"
            size="small"
            disabled={safePage <= 1 || totalPages === 0}
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
            }
          >
            <ChevronLeft />
          </IconButton>

          {getPageNumbers().map((page) =>
            typeof page === "string" ? (
              <Box
                key={page}
                component="span"
                sx={{ px: 1, color: "text.secondary" }}
              >
                …
              </Box>
            ) : (
              <Button
                key={page}
                variant={safePage === page ? "outlined" : "text"}
                size="small"
                onClick={() => setCurrentPage(page)}
                sx={{
                  minWidth: 34,
                  height: 34,
                  px: 1,
                  borderRadius: 1.5,
                  borderColor:
                    safePage === page ? "primary.main" : "transparent",
                  color:
                    safePage === page ? "primary.main" : "text.primary",
                }}
              >
                {page}
              </Button>
            )
          )}

          <IconButton
            aria-label="Next page"
            size="small"
            disabled={safePage >= totalPages || totalPages === 0}
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(totalPages, page + 1)
              )
            }
          >
            <ChevronRight />
          </IconButton>

          <IconButton
            aria-label="Last page"
            size="small"
            disabled={safePage >= totalPages || totalPages === 0}
            onClick={() => setCurrentPage(totalPages)}
          >
            <LastPage />
          </IconButton>
        </Stack>

        <TextField
          select
          size="small"
          label="Rows per page"
          value={pageSize}
          onChange={handlePageSizeChange}
          SelectProps={{ native: true }}
          sx={{
            width: { xs: "100%", md: 135 },
            minWidth: 135,
          }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </TextField>
      </Stack>
    </Box>
  );
}
