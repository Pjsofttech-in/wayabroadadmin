import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { Input, Popconfirm, Table, Tag, message } from "antd";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import {
  deactivateJobApplication, getJobApplicationById, searchJobApplications, updateJobApplicationStatus,
} from "./JobService";

const STATUSES = ["PENDING", "SHORTLISTED", "REJECTED", "HIRED"];

export default function JobApplications() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ jobId: "", status: "", applicantEmail: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadApplications = useCallback(async (nextPage = page, nextSize = pageSize, nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const response = await searchJobApplications({
        jobId: nextFilters.jobId,
        status: nextFilters.status,
        applicantEmail: nextFilters.applicantEmail.trim(),
        page: nextPage,
        size: nextSize,
      });
      setRows(Array.isArray(response?.content) ? response.content : []);
      setTotal(Number(response?.totalElements ?? 0));
      setPage(nextPage);
      setPageSize(nextSize);
    } catch (e) {
      console.error("Failed to fetch job applications:", e);
      setRows([]);
      setTotal(0);
      setError(e?.response?.data?.message || e.message || "Failed to fetch applications.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => { loadApplications(0, 10, { jobId: "", status: "", applicantEmail: "" }); }, []);

  const updateFilter = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));

  const viewDetails = async (record) => {
    setSelected(record);
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const data = await getJobApplicationById(record.id);
      setSelected(data);
    } catch (e) {
      console.error("Failed to load application details:", e);
      message.error(e?.response?.data?.message || "Could not load application details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const changeStatus = async (record, status) => {
    try {
      const updated = await updateJobApplicationStatus(record.id, status);
      setRows((previous) => previous.map((item) => item.id === record.id ? { ...item, ...updated, status } : item));
      if (selected?.id === record.id) setSelected((previous) => ({ ...previous, ...updated, status }));
      message.success("Application status updated.");
    } catch (e) {
      console.error("Status update failed:", e);
      message.error(e?.response?.data?.message || "Could not update status.");
    }
  };

  const deactivate = async (id) => {
    try {
      await deactivateJobApplication(id);
      message.success("Application deactivated.");
      loadApplications(Math.min(page, Math.max(0, Math.ceil((total - 1) / pageSize) - 1)), pageSize, filters);
    } catch (e) {
      console.error("Application deactivation failed:", e);
      message.error(e?.response?.data?.message || "Could not deactivate application.");
    }
  };

  const columns = [
    { title: "Application ID", dataIndex: "id", key: "id", width: 115 },
    { title: "Job", dataIndex: "jobTitle", key: "jobTitle", render: (v, r) => v || (r.jobId != null ? `Job #${r.jobId}` : "-") },
    { title: "Applicant", dataIndex: "applicantName", key: "applicantName", render: (v) => v || "-" },
    { title: "Email", dataIndex: "email", key: "email", render: (v) => v || "-" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (v) => v || "-" },
    { title: "Applied At", dataIndex: "appliedAt", key: "appliedAt", render: (v) => v ? new Date(v).toLocaleString() : "-" },
    { title: "Resume", dataIndex: "resumeUrl", key: "resumeUrl", render: (url) => url ? <a href={url} target="_blank" rel="noreferrer">View Resume</a> : "-" },
    { title: "Status", dataIndex: "status", key: "status", render: (status, record) => (
      <TextField select size="small" value={status || "PENDING"} onChange={(e) => changeStatus(record, e.target.value)} sx={{ minWidth: 145 }}>
        {STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
      </TextField>
    ) },
    { title: "Actions", key: "actions", fixed: "right", width: 100, render: (_, record) => (
      <Stack direction="row" spacing={0.5}>
        <Button size="small" aria-label={`View application ${record.id}`} onClick={() => viewDetails(record)}><EyeOutlined /></Button>
        <Popconfirm title="Deactivate this application?" description="The application will be marked inactive." onConfirm={() => deactivate(record.id)} okText="Deactivate" cancelText="Cancel">
          <Button size="small" color="error" aria-label={`Deactivate application ${record.id}`}><DeleteOutlined /></Button>
        </Popconfirm>
      </Stack>
    ) },
  ];

  const clearFilters = () => {
    const empty = { jobId: "", status: "", applicantEmail: "" };
    setFilters(empty);
    loadApplications(0, pageSize, empty);
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
      <Typography variant="h5" fontWeight={700} color="#183b56" sx={{ mb: 2 }}>Job Applications</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "center", p: 2, mb: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <TextField size="small" type="number" label="Job ID" value={filters.jobId} onChange={(e) => updateFilter("jobId", e.target.value)} sx={{ minWidth: 130 }} inputProps={{ min: 1 }} />
        <TextField select size="small" label="Application Status" value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} sx={{ minWidth: 175 }}>
          <MenuItem value="">All statuses</MenuItem>
          {STATUSES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
        </TextField>
        <Input placeholder="Applicant email" allowClear value={filters.applicantEmail} onChange={(e) => updateFilter("applicantEmail", e.target.value)} onPressEnter={() => loadApplications(0, pageSize, filters)} style={{ minWidth: 220, flex: "1 1 220px", height: 40 }} />
        <Button variant="contained" onClick={() => loadApplications(0, pageSize, filters)}>Search</Button>
        <Button onClick={clearFilters}>Clear</Button>
      </Box>
      <Box sx={{ "& .ant-table": { fontSize: 13 }, "& .ant-table-thead > tr > th": { fontWeight: 600, whiteSpace: "nowrap" } }}>
        <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} size="middle" scroll={{ x: 1450 }}
          pagination={{ current: page + 1, pageSize, total, showSizeChanger: true, pageSizeOptions: ["10", "20", "25", "50"], showTotal: (count, range) => `Showing ${range[0]}-${range[1]} of ${count} applications`, onChange: (current, size) => loadApplications(current - 1, size, filters) }} />
      </Box>
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? <Typography>Loading application details…</Typography> : selected ? (
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
            </Stack>
          ) : <Typography>No application details available.</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailsOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
