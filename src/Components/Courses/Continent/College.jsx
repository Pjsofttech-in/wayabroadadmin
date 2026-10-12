import React, { useEffect, useState } from "react";
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
import DeleteOutlined from "@ant-design/icons/DeleteOutlined";
import PlusOutlined from "@ant-design/icons/PlusOutlined";
import UploadIcon from "@mui/icons-material/Upload";

import {
  getAllColleges,
  createCollege,
  updateCollege,
  deleteCollege,
} from "./CollegeService";

import LoadingOverlay from "../../Common/LoadingOverlay";

const initialCollege = {
  collegeName: "",
  image: null,
  fileError: null,
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function College({ university, onBack }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [collegeData, setCollegeData] = useState({
    ...initialCollege,
  });

  const [search, setSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiLoading, setApiLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const API_URL = import.meta.env.VITE_API_URL || "";

  // Get authentication information.
  const getAuthData = () => {
    const sessionRole = sessionStorage.getItem("role");
    const sessionEmail = sessionStorage.getItem("email");
    const sessionBranchCode =
      sessionStorage.getItem("branchCode") || "";

    if (sessionRole && sessionEmail) {
      return {
        role: sessionRole,
        email: sessionEmail,
        branchCode: sessionBranchCode,
      };
    }

    const localRole = localStorage.getItem("role");
    const localEmail = localStorage.getItem("email");
    const localBranchCode =
      localStorage.getItem("branchCode") || "";

    if (localRole && localEmail) {
      return {
        role: localRole,
        email: localEmail,
        branchCode: localBranchCode,
      };
    }

    return {
      role: null,
      email: null,
      branchCode: "",
    };
  };

  const { role, email, branchCode } = getAuthData();

  // Fetch colleges belonging to the selected university.
  const fetchColleges = async () => {
    if (!university?.id || !role || !email) {
      setColleges([]);
      return;
    }

    setTableLoading(true);
    setApiLoading(true);

    try {
      const data = await getAllColleges({
        search: search.trim(),
        email,
        role,
        branchCode,
        universityId: university.id,
      });

      const formattedData = (
        Array.isArray(data) ? data : []
      ).map((college) => ({
        ...college,
        collegeName:
          college.collegeName ||
          college.college ||
          (college.id != null ? String(college.id) : "N/A"),
      }));

      setColleges(formattedData);
    } catch (error) {
      console.error("Error fetching colleges:", error);
      message.error("Failed to fetch colleges");
    } finally {
      setTableLoading(false);
      setApiLoading(false);
    }
  };

  useEffect(() => {
    if (!role || !email) {
      window.location.href = "/login";
      return;
    }

    if (university?.id) {
      fetchColleges();
    } else {
      setColleges([]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, university?.id, role, email, branchCode]);

  // Reset pagination when search or page size changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  // Keep the selected page valid when the number of records changes.
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(colleges.length / pageSize)
    );

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [colleges.length, currentPage, pageSize]);

  // Open Add/Edit College dialog.
  const handleOpenDialog = (college = null) => {
    if (college) {
      setEditing(college.id);

      setCollegeData({
        collegeName:
          college.collegeName || college.college || "",
        image: null,
        fileError: null,
      });
    } else {
      setEditing(null);
      setCollegeData({ ...initialCollege });
    }

    setDialogOpen(true);
  };

  // Close and reset the dialog.
  const handleCloseDialog = () => {
    if (loading) return;

    setDialogOpen(false);
    setCollegeData({ ...initialCollege });
    setEditing(null);
  };

  // Handle college name and image inputs.
  const handleInputChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "image") {
      if (!files?.length) return;

      const file = files[0];

      if (file.size > MAX_FILE_SIZE) {
        message.error("File size should not exceed 5MB");

        setCollegeData((previous) => ({
          ...previous,
          image: null,
          fileError: "File size should not exceed 5MB",
        }));

        event.target.value = "";
        return;
      }

      setCollegeData((previous) => ({
        ...previous,
        image: file,
        fileError: null,
      }));

      return;
    }

    setCollegeData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create or update a college.
  const handleSave = async () => {
    if (!collegeData.collegeName?.trim()) {
      message.error("Please enter college name");
      return;
    }

    if (!email || !role) {
      message.error("Authentication error. Please log in again.");
      window.location.href = "/login";
      return;
    }

    if (!university?.id) {
      message.error("University information is missing");
      return;
    }

    if (collegeData.fileError) {
      message.error(collegeData.fileError);
      return;
    }

    setLoading(true);
    setApiLoading(true);

    try {
      const formData = new FormData();

      const collegeObj = {
        collegeName: collegeData.collegeName.trim(),
        createdByEmail: email,
        role,
        abroadUniversity: {
          id: university.id,
        },
      };

      formData.append("college", JSON.stringify(collegeObj));

      if (collegeData.image instanceof File) {
        formData.append("image", collegeData.image);
      }

      formData.append("universityId", String(university.id));

      if (editing !== null && editing !== undefined) {
        await updateCollege(
          editing,
          formData,
          email,
          role,
          branchCode,
          null
        );

        message.success("College updated successfully");
      } else {
        await createCollege(
          formData,
          null,
          university.id,
          email,
          role
        );

        message.success("College created successfully");
      }

      setDialogOpen(false);
      setCollegeData({ ...initialCollege });
      setEditing(null);

      await fetchColleges();
    } catch (error) {
      console.error("Error saving college:", error);

      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      message.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to save college. Please try again."
      );
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  // Delete a college.
  const handleDelete = async (id) => {
    setLoading(true);
    setApiLoading(true);

    try {
      await deleteCollege(id, email, role, branchCode);

      message.success("College deleted successfully");
      await fetchColleges();
    } catch (error) {
      console.error("Error deleting college:", error);

      message.error(
        error.response?.data?.message ||
          "Failed to delete college"
      );
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  };

  // Open the standalone Streams route while preserving the selected hierarchy.
  const handleManageCourses = (college) => {
    const params = new URLSearchParams(searchParams);
    params.set("collegeId", String(college.id));
    navigate(`/wayabroadadmin/admin/courses/stream?${params.toString()}`);
  };

  // Resolve college image URLs.
  const getImageUrl = (record) => {
    const image =
      record.imageUrl ||
      record.image ||
      (Array.isArray(record.images) ? record.images[0] : null) ||
      record.imagePath;

    if (!image) return null;

    if (
      image.startsWith("data:image") ||
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  const columns = [
    {
      title: "College Name",
      dataIndex: "collegeName",
      key: "collegeName",
      sorter: (a, b) =>
        (a.collegeName || "").localeCompare(b.collegeName || ""),
      render: (name) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            overflowWrap: "anywhere",
          }}
        >
          {name || "N/A"}
        </Typography>
      ),
    },
    {
      title: "Image",
      key: "image",
      width: 120,
      render: (_, record) => {
        const imageUrl = getImageUrl(record);

        return imageUrl ? (
          <img
            src={imageUrl}
            alt={record.collegeName || "College"}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 60,
              height: 40,
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              color: "#777",
              fontSize: 10,
              textAlign: "center",
              p: 0.5,
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
      width: 220,
      render: (_, record) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
        >
          <Popconfirm
            title="Delete this college?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <IconButton
              size="small"
              color="error"
              aria-label="Delete college"
              disabled={loading}
            >
              <DeleteOutlined />
            </IconButton>
          </Popconfirm>

          <Button
            size="small"
            variant="outlined"
            onClick={() => handleManageCourses(record)}
            sx={{ whiteSpace: "nowrap" }}
          >
            Manage Courses
          </Button>
        </Stack>
      ),
    },
  ];

  const totalRecords = colleges.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startRecord =
    totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;

  const endRecord = Math.min(
    safeCurrentPage * pageSize,
    totalRecords
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <LoadingOverlay loading={apiLoading} />

      {/* Toolbar */}
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
          Back to University
        </Button>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Input.Search
            placeholder="Search colleges"
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
            sx={{
              whiteSpace: "nowrap",
              alignSelf: { xs: "flex-start", sm: "center" },
            }}
          >
            Add College
          </Button>
        </Stack>
      </Stack>

      {/* Add / Edit College Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editing !== null && editing !== undefined
            ? "Edit College"
            : "Add New College"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="College Name"
              name="collegeName"
              value={collegeData.collegeName || ""}
              onChange={handleInputChange}
              fullWidth
              required
              autoFocus
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                College Image
              </Typography>

              <input
                accept="image/*"
                type="file"
                id="college-image-upload"
                name="image"
                onChange={handleInputChange}
                style={{ display: "none" }}
              />

              {collegeData.fileError && (
                <Typography
                  color="error"
                  variant="caption"
                  display="block"
                  gutterBottom
                >
                  {collegeData.fileError}
                </Typography>
              )}

              <label htmlFor="college-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={loading}
                >
                  {collegeData.image ? "Change Image" : "Upload Image"}
                </Button>
              </label>

              {collegeData.image && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, overflowWrap: "anywhere" }}
                >
                  Selected: {collegeData.image.name}
                </Typography>
              )}

              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Maximum image size: 5 MB
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading || !collegeData.collegeName?.trim()}
            startIcon={
              loading ? <CircularProgress size={18} /> : null
            }
          >
            {loading
              ? "Saving..."
              : editing !== null && editing !== undefined
                ? "Update"
                : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Colleges Table */}
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          mt: 2,
          "& .ant-table": {
            fontSize: "14px",
          },
          "& .ant-table-thead > tr > th": {
            backgroundColor: "#fafafa",
            fontWeight: 600,
            whiteSpace: "nowrap",
          },
          "& .ant-table-cell": {
            verticalAlign: "middle",
            padding: { xs: "10px 8px", sm: "12px 16px" },
          },
        }}
      >
        <Table
          columns={columns}
          dataSource={colleges}
          rowKey="id"
          loading={tableLoading}
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
              ? "No colleges match your search"
              : "No colleges found",
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
          mb: 2,
          width: "100%",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {startRecord}–{endRecord} of {totalRecords} items
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
            onChange={(event) =>
              setPageSize(Number(event.target.value))
            }
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
