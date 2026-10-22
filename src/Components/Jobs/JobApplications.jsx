import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Input, Popconfirm, Table, Tag, message } from "antd";
import { DeleteOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import {
  searchJobApplications,
  getJobApplicationById,
  updateJobApplicationStatus,
  deactivateJobApplication,
} from "./JobService";

// Must match com.abroad.Enum.JobApplicationStatus in the supplied backend.
const STATUSES = ["PENDING", "SHORTLISTED", "REJECTED", "HIRED"];
const EMPTY_FILTERS = { jobId: "", status: "", applicantEmail: "" };

const getPageData = (response) => {
  const payload = response?.data ?? response;
  const pageData = payload?.data ?? payload;
  const content = Array.isArray(pageData?.content)
    ? pageData.content
    : Array.isArray(pageData)
      ? pageData
      : [];

  return {
    content,
    totalElements: Number(pageData?.totalElements ?? content.length),
  };
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

export default function JobApplications() {
  const isBranch = (sessionStorage.getItem("role") || "").toLowerCase() === "branch";
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const loadApplications = useCallback(async (nextPage = page, nextSize = pageSize, nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      // The supplied backend search endpoint supports only these three filters.
      const response = await searchJobApplications({
        jobId: nextFilters.jobId,
        status: nextFilters.status,
        applicantEmail: nextFilters.applicantEmail.trim(),
        page: nextPage,
        size: nextSize,
      });
      const result = getPageData(response);
      setRows(result.content);
      setTotal(result.totalElements);
      setPage(nextPage);
      setPageSize(nextSize);
    } catch (e) {
      console.error("Failed to fetch job applications:", e);
      setRows([]);
      setTotal(0);
      setError(getErrorMessage(e, "Failed to fetch applications."));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    loadApplications(0, 10, EMPTY_FILTERS);
    // Load the first page once on mount. Filter changes are submitted explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFilter = (name, value) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const viewDetails = async (record) => {
    setSelected(record);
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const response = await getJobApplicationById(record.id);
      setSelected(response?.data ?? response);
    } catch (e) {
      console.error("Failed to load application details:", e);
      message.error(getErrorMessage(e, "Could not load application details."));
    } finally {
      setDetailsLoading(false);
    }
  };

  const changeStatus = async (record, status) => {
    const previousStatus = record.status || "PENDING";
    if (previousStatus === status) return;
    setStatusUpdatingId(record.id);
    try {
      const response = await updateJobApplicationStatus(record.id, status);
      const updated = response?.data ?? response;
      setRows((previous) => previous.map((item) =>
        item.id === record.id ? { ...item, ...updated, status: updated?.status || status } : item
      ));
      setSelected((previous) => previous?.id === record.id
        ? { ...previous, ...updated, status: updated?.status || status }
        : previous);
      message.success("Application status updated.");
    } catch (e) {
      console.error("Status update failed:", e);
      message.error(getErrorMessage(e, "Could not update status."));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const deactivate = async (id) => {
    try {
      await deactivateJobApplication(id);
      message.success("Application deactivated.");
      const lastPage = Math.max(0, Math.ceil((total - 1) / pageSize) - 1);
      await loadApplications(Math.min(page, lastPage), pageSize, filters);
      if (selected?.id === id) {
        setDetailsOpen(false);
        setSelected(null);
      }
    } catch (e) {
      console.error("Application deactivation failed:", e);
      message.error(getErrorMessage(e, "Could not deactivate application."));
    }
  };

  const search = () => loadApplications(0, pageSize, filters);
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadApplications(0, pageSize, EMPTY_FILTERS);
  };

  const columns = [
    { title: "Application ID", dataIndex: "id", key: "id", width: 120 },
    {
      title: "Job",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (value, record) => value || (record.jobId != null ? `Job #${record.jobId}` : "-"),
    },
    { title: "Applicant", dataIndex: "applicantName", key: "applicantName", render: (value) => value || "-" },
    { title: "Email", dataIndex: "email", key: "email", render: (value) => value || "-" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (value) => value || "-" },
    {
      title: "Applied At",
      dataIndex: "appliedAt",
      key: "appliedAt",
      render: (value) => {
        if (!value) return "-";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
      },
    },
    {
      title: "Resume",
      dataIndex: "resumeUrl",
      key: "resumeUrl",
      render: (url) => url
        ? <a href={url} target="_blank" rel="noreferrer">View Resume</a>
        : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (status, record) => isBranch
        ? <Tag color={status === "HIRED" ? "green" : status === "REJECTED" ? "red" : status === "SHORTLISTED" ? "blue" : "default"}>{status || "PENDING"}</Tag>
        : (
          <TextField
            select
            size="small"
            value={status || "PENDING"}
            disabled={statusUpdatingId === record.id}
            onChange={(event) => changeStatus(record, event.target.value)}
            sx={{ minWidth: 145 }}
          >
            {STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: isBranch ? 80 : 110,
      render: (_, record) => (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" aria-label={`View application ${record.id}`} onClick={() => viewDetails(record)}>
            <EyeOutlined />
          </Button>
          {!isBranch && (
            <Popconfirm
              title="Deactivate this application?"
              description="The application will be marked inactive."
              onConfirm={() => deactivate(record.id)}
              okText="Deactivate"
              cancelText="Cancel"
            >
              <Button size="small" color="error" aria-label={`Deactivate application ${record.id}`}>
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={700} color="#183b56">Job Applications</Typography>
        <Typography variant="body2" color="text.secondary">Review applications, update status, and view applicant details.</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "center", p: 2, mb: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <TextField
          size="small"
          type="number"
          label="Job ID"
          value={filters.jobId}
          onChange={(event) => updateFilter("jobId", event.target.value)}
          sx={{ minWidth: 130, flex: "1 1 130px" }}
          inputProps={{ min: 1 }}
        />
        <TextField
          select
          size="small"
          label="Application Status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
          sx={{ minWidth: 175, flex: "1 1 175px" }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STATUSES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
        </TextField>
        <Input
          placeholder="Applicant email"
          allowClear
          value={filters.applicantEmail}
          onChange={(event) => updateFilter("applicantEmail", event.target.value)}
          onPressEnter={search}
          style={{ minWidth: 220, flex: "2 1 240px", height: 40 }}
        />
        <Button variant="contained" startIcon={<SearchOutlined />} onClick={search}>Search</Button>
        <Button onClick={clearFilters}>Clear</Button>
      </Box>

      <Box sx={{ "& .ant-table": { fontSize: 13 }, "& .ant-table-thead > tr > th": { fontWeight: 600, whiteSpace: "nowrap" } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          size="middle"
          scroll={{ x: 1250 }}
          pagination={{
            current: page + 1,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "25", "50"],
            showTotal: (count, range) => `Showing ${range[0]}-${range[1]} of ${count} applications`,
            onChange: (current, size) => loadApplications(current - 1, size, filters),
          }}
        />
      </Box>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Typography>Loading application details…</Typography>
          ) : selected ? (
            <Stack spacing={1.25} sx={{ pt: 0.5 }}>
              <Typography><b>Application ID:</b> {selected.id ?? "-"}</Typography>
              <Typography><b>Job:</b> {selected.jobTitle || (selected.jobId != null ? `Job #${selected.jobId}` : "-")}</Typography>
              <Typography><b>Applicant:</b> {selected.applicantName || "-"}</Typography>
              <Typography><b>Email:</b> {selected.email || "-"}</Typography>
              <Typography><b>Phone:</b> {selected.phone || "-"}</Typography>
              <Typography><b>Applied:</b> {selected.appliedAt ? new Date(selected.appliedAt).toLocaleString() : "-"}</Typography>
              <Typography><b>Status:</b> <Tag color="blue">{selected.status || "-"}</Tag></Typography>
              <Typography><b>Cover Letter:</b> {selected.coverLetter || "-"}</Typography>
              {selected.resumeUrl && <Typography><a href={selected.resumeUrl} target="_blank" rel="noreferrer">Open resume</a></Typography>}
              <Typography><b>Active:</b> {selected.active === false ? "No" : "Yes"}</Typography>
            </Stack>
          ) : (
            <Typography>No application details available.</Typography>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailsOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
