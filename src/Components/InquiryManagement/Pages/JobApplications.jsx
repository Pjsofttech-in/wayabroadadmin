import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { Input, Popconfirm, Table, Tag, message } from "antd";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { getJobSettings, searchJobApplications, getJobApplicationById, updateJobApplicationStatus, deactivateJobApplication } from "./JobService";
import { getAllCountries } from "../Courses/Continent/CountryService";

const STATUSES = ["PENDING", "SHORTLISTED", "REJECTED", "HIRED"];
const emptyFilters = { jobId: "", status: "", applicantEmail: "", countryId: "", sectorId: "", jobRoleId: "", jobTypeId: "" };
const unwrapArray = (data) => Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
const optionName = (item) => item?.name || item?.sectorName || item?.jobRoleName || item?.jobTypeName || item?.countryName || "";

export default function JobApplications() {
  const isBranch = (sessionStorage.getItem("role") || "").toLowerCase() === "branch";
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState(emptyFilters);
  const [options, setOptions] = useState({ countries: [], sector: [], role: [], jobType: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterNotice, setFilterNotice] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getAllCountries({ role: sessionStorage.getItem("role") || "", email: sessionStorage.getItem("email") || "" }),
      getJobSettings("sector"), getJobSettings("role"), getJobSettings("jobType"),
    ]).then(([countries, sector, role, jobType]) => {
      if (!alive) return;
      setOptions({ countries: unwrapArray(countries), sector: unwrapArray(sector), role: unwrapArray(role), jobType: unwrapArray(jobType) });
    }).catch((e) => {
      console.warn("Some application filter options could not be loaded:", e);
      if (alive) setFilterNotice("Some filter options could not be loaded. Existing application filters remain available.");
    });
    return () => { alive = false; };
  }, []);

  const roles = useMemo(() => options.role.filter((item) => !filters.sectorId || String(item.sector?.id ?? item.sectorId ?? "") === String(filters.sectorId)), [options.role, filters.sectorId]);

  const loadApplications = useCallback(async (nextPage = page, nextSize = pageSize, nextFilters = filters) => {
    const newFiltersSelected = nextFilters.countryId || nextFilters.sectorId || nextFilters.jobRoleId || nextFilters.jobTypeId;
    if (newFiltersSelected) {
      setFilterNotice("Country, Sector, Job Role and Job Type controls are displayed, but the supplied /job-applications/admin/search endpoint does not accept these parameters. Search was not sent with these filters, so results are not misleadingly presented as filtered. Backend support is required.");
      return;
    }
    setLoading(true);
    setError("");
    setFilterNotice("");
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
      setRows([]); setTotal(0);
      setError(e?.response?.data?.message || e.message || "Failed to fetch applications.");
    } finally { setLoading(false); }
  }, [page, pageSize, filters]);

  useEffect(() => { loadApplications(0, 10, emptyFilters); /* initial load only */ }, []);
  const updateFilter = (name, value) => setFilters((prev) => {
    const next = { ...prev, [name]: value };
    if (name === "sectorId") next.jobRoleId = "";
    return next;
  });
  const viewDetails = async (record) => {
    setSelected(record); setDetailsOpen(true); setDetailsLoading(true);
    try { setSelected(await getJobApplicationById(record.id)); }
    catch (e) { console.error("Failed to load application details:", e); message.error(e?.response?.data?.message || "Could not load application details."); }
    finally { setDetailsLoading(false); }
  };
  const changeStatus = async (record, status) => {
    try {
      const updated = await updateJobApplicationStatus(record.id, status);
      setRows((previous) => previous.map((item) => item.id === record.id ? { ...item, ...updated, status } : item));
      if (selected?.id === record.id) setSelected((previous) => ({ ...previous, ...updated, status }));
      message.success("Application status updated.");
    } catch (e) { console.error("Status update failed:", e); message.error(e?.response?.data?.message || "Could not update status."); }
  };
  const deactivate = async (id) => {
    try {
      await deactivateJobApplication(id); message.success("Application deactivated.");
      loadApplications(Math.min(page, Math.max(0, Math.ceil((total - 1) / pageSize) - 1)), pageSize, filters);
    } catch (e) { console.error("Application deactivation failed:", e); message.error(e?.response?.data?.message || "Could not deactivate application."); }
  };
  const clearFilters = () => { setFilters(emptyFilters); setFilterNotice(""); loadApplications(0, pageSize, emptyFilters); };
  const columns = [
    { title: "Application ID", dataIndex: "id", key: "id", width: 115 },
    { title: "Job", dataIndex: "jobTitle", key: "jobTitle", render: (v, r) => v || (r.jobId != null ? `Job #${r.jobId}` : "-") },
    { title: "Applicant", dataIndex: "applicantName", key: "applicantName", render: (v) => v || "-" },
    { title: "Email", dataIndex: "email", key: "email", render: (v) => v || "-" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (v) => v || "-" },
    { title: "Applied At", dataIndex: "appliedAt", key: "appliedAt", render: (v) => v ? new Date(v).toLocaleString() : "-" },
    { title: "Resume", dataIndex: "resumeUrl", key: "resumeUrl", render: (url) => url ? <a href={url} target="_blank" rel="noreferrer">View Resume</a> : "-" },
    { title: "Status", dataIndex: "status", key: "status", render: (status, record) => isBranch ? (status || "PENDING") : <TextField select size="small" value={status || "PENDING"} onChange={(e) => changeStatus(record, e.target.value)} sx={{ minWidth: 145 }}>{STATUSES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField> },
    { title: "Actions", key: "actions", fixed: "right", width: 100, render: (_, record) => <Button size="small" aria-label={`View application ${record.id}`} onClick={() => viewDetails(record)}><EyeOutlined /></Button> },
  ];
  const selectFilter = (name, label, items, disabled = false) => <TextField select size="small" label={label} value={filters[name]} onChange={(e) => updateFilter(name, e.target.value)} sx={{ minWidth: 160, flex: "1 1 160px" }} disabled={disabled}><MenuItem value="">All {label}</MenuItem>{items.map((item) => <MenuItem key={item.id ?? item.countryId} value={String(item.id ?? item.countryId)}>{optionName(item) || `#${item.id ?? item.countryId}`}</MenuItem>)}</TextField>;

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
      <Typography variant="h5" fontWeight={700} color="#183b56" sx={{ mb: 2 }}>Job Applications</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {filterNotice && <Alert severity="warning" sx={{ mb: 2 }}>{filterNotice}</Alert>}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "center", p: 2, mb: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <TextField size="small" type="number" label="Job ID" value={filters.jobId} onChange={(e) => updateFilter("jobId", e.target.value)} sx={{ minWidth: 130 }} inputProps={{ min: 1 }} />
        <TextField select size="small" label="Application Status" value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} sx={{ minWidth: 175 }}><MenuItem value="">All statuses</MenuItem>{STATUSES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</TextField>
        <Input placeholder="Applicant email" allowClear value={filters.applicantEmail} onChange={(e) => updateFilter("applicantEmail", e.target.value)} onPressEnter={() => loadApplications(0, pageSize, filters)} style={{ minWidth: 220, flex: "1 1 220px", height: 40 }} />
        {selectFilter("countryId", "Country", options.countries)}
        {selectFilter("sectorId", "Sector", options.sector)}
        {selectFilter("jobRoleId", "Job Role", roles, !filters.sectorId)}
        {selectFilter("jobTypeId", "Job Type", options.jobType)}
        <Button variant="contained" onClick={() => loadApplications(0, pageSize, filters)}>Search</Button><Button onClick={clearFilters}>Clear</Button>
      </Box>
      <Box sx={{ "& .ant-table": { fontSize: 13 }, "& .ant-table-thead > tr > th": { fontWeight: 600, whiteSpace: "nowrap" } }}>
        <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} size="middle" scroll={{ x: 1450 }} pagination={{ current: page + 1, pageSize, total, showSizeChanger: true, pageSizeOptions: ["10", "20", "25", "50"], showTotal: (count, range) => `Showing ${range[0]}-${range[1]} of ${count} applications`, onChange: (current, size) => loadApplications(current - 1, size, filters) }} />
      </Box>
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Application Details</DialogTitle><DialogContent dividers>
          {detailsLoading ? <Typography>Loading application details…</Typography> : selected ? <Stack spacing={1.25} sx={{ pt: 0.5 }}>
            <Typography><b>Application ID:</b> {selected.id ?? "-"}</Typography><Typography><b>Job:</b> {selected.jobTitle || (selected.jobId != null ? `Job #${selected.jobId}` : "-")}</Typography><Typography><b>Applicant:</b> {selected.applicantName || "-"}</Typography><Typography><b>Email:</b> {selected.email || "-"}</Typography><Typography><b>Phone:</b> {selected.phone || "-"}</Typography><Typography><b>Applied:</b> {selected.appliedAt ? new Date(selected.appliedAt).toLocaleString() : "-"}</Typography><Typography><b>Status:</b> <Tag color="blue">{selected.status || "-"}</Tag></Typography><Typography><b>Cover Letter:</b> {selected.coverLetter || "-"}</Typography>{selected.resumeUrl && <Typography><a href={selected.resumeUrl} target="_blank" rel="noreferrer">Open resume</a></Typography>}
          </Stack> : <Typography>No application details available.</Typography>}
        </DialogContent><DialogActions><Button onClick={() => setDetailsOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
