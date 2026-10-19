import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Input, Popconfirm, Table, Tag, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { deleteJob, getJobSettings, searchJobs } from "./JobService";

const emptyFilters = { keyword: "", educationId: "", sectorId: "", jobRoleId: "", locationId: "", jobTypeId: "", minSalary: "", maxSalary: "", active: "" };
const getPageData = (response) => ({
  content: Array.isArray(response?.content) ? response.content : Array.isArray(response) ? response : [],
  totalElements: Number(response?.totalElements ?? response?.content?.length ?? 0),
});

export default function JobList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState(emptyFilters);
  const [settings, setSettings] = useState({ education: [], sector: [], role: [], location: [], jobType: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async (nextPage = page, nextSize = pageSize, nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const response = await searchJobs({
        keyword: nextFilters.keyword.trim(),
        educationId: nextFilters.educationId,
        sectorId: nextFilters.sectorId,
        jobRoleId: nextFilters.jobRoleId,
        locationId: nextFilters.locationId,
        jobTypeId: nextFilters.jobTypeId,
        minSalary: nextFilters.minSalary,
        maxSalary: nextFilters.maxSalary,
        active: nextFilters.active,
        page: nextPage,
        size: nextSize,
        sortBy: "id",
        sortDir: "DESC",
      });
      const result = getPageData(response);
      setRows(result.content);
      setTotal(result.totalElements);
      setPage(nextPage);
      setPageSize(nextSize);
    } catch (e) {
      console.error("Failed to load jobs:", e);
      setRows([]);
      setTotal(0);
      setError(e?.response?.data?.message || e.message || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    let alive = true;
    Promise.all(["education", "sector", "role", "location", "jobType"].map((type) => getJobSettings(type)))
      .then((values) => {
        if (!alive) return;
        setSettings(Object.fromEntries(["education", "sector", "role", "location", "jobType"].map((type, index) => [type, Array.isArray(values[index]) ? values[index] : []])));
      })
      .catch((e) => console.error("Failed to load job filters:", e));
    loadJobs(0, 10, emptyFilters);
    return () => { alive = false; };
  }, []); // initial load only

  const changeFilter = (name, value) => setFilters((previous) => {
    const next = { ...previous, [name]: value };
    if (name === "educationId") { next.sectorId = ""; next.jobRoleId = ""; }
    if (name === "sectorId") next.jobRoleId = "";
    return next;
  });

  const sectorOptions = settings.sector.filter((item) => !filters.educationId || String(item.education?.id ?? item.educationId ?? "") === String(filters.educationId));
  const roleOptions = settings.role.filter((item) => !filters.sectorId || String(item.sector?.id ?? item.sectorId ?? "") === String(filters.sectorId));
  const optionName = (item) => item?.name || item?.educationName || item?.sectorName || item?.jobRoleName || item?.locationName || item?.jobTypeName || `#${item.id}`;

  const doSearch = () => loadJobs(0, pageSize, filters);
  const clearFilters = () => { setFilters(emptyFilters); loadJobs(0, pageSize, emptyFilters); };

  const handleDelete = async (id) => {
    try {
      await deleteJob(id);
      message.success("Job deleted successfully.");
      loadJobs(Math.min(page, Math.max(0, Math.ceil((total - 1) / pageSize) - 1)), pageSize, filters);
    } catch (e) {
      console.error("Failed to delete job:", e);
      message.error(e?.response?.data?.message || "Failed to delete job.");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    { title: "Job Title", dataIndex: "jobTitle", key: "jobTitle", render: (value) => value || "-" },
    { title: "Education", dataIndex: "educationName", key: "educationName", render: (value) => value || "-" },
    { title: "Sector", dataIndex: "sectorName", key: "sectorName", render: (value) => value || "-" },
    { title: "Role", dataIndex: "jobRoleName", key: "jobRoleName", render: (value) => value || "-" },
    { title: "Location", dataIndex: "locationName", key: "locationName", render: (value) => value || "-" },
    { title: "Salary", key: "salary", render: (_, record) => `${record.currencyName || ""} ${record.salary ?? "-"}`.trim() },
    { title: "Job Type", dataIndex: "jobTypeName", key: "jobTypeName", render: (value) => value || "-" },
    { title: "Openings", dataIndex: "openings", key: "openings", width: 90 },
    { title: "Status", dataIndex: "active", key: "active", render: (active) => <Tag color={active ? "green" : "default"}>{active ? "Active" : "Inactive"}</Tag> },
    { title: "Actions", key: "actions", fixed: "right", width: 130, render: (_, record) => (
      <Stack direction="row" spacing={0.5}>
        <Button size="small" aria-label={`Edit job ${record.id}`} onClick={() => navigate(`/wayabroadadmin/admin/jobs/create?editId=${record.id}`)}><EditOutlined /></Button>
        <Popconfirm title="Delete this job?" description="This action cannot be undone." onConfirm={() => handleDelete(record.id)} okText="Delete" cancelText="Cancel">
          <Button size="small" color="error" aria-label={`Delete job ${record.id}`}><DeleteOutlined /></Button>
        </Popconfirm>
      </Stack>
    ) },
  ];

  const selectFilter = (name, label, options, disabled = false) => (
    <TextField select size="small" label={label} value={filters[name]} onChange={(e) => changeFilter(name, e.target.value)} sx={{ minWidth: 150, flex: "1 1 150px" }} disabled={disabled}>
      <MenuItem value="">All</MenuItem>
      {options.map((item) => <MenuItem key={item.id} value={String(item.id)}>{optionName(item)}</MenuItem>)}
    </TextField>
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700} color="#183b56">Job List</Typography>
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => navigate("/wayabroadadmin/admin/jobs/create")}>Create Job</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 2, mb: 2, display: "flex", gap: 1.25, flexWrap: "wrap", alignItems: "center" }}>
        <Input.Search placeholder="Search job title or keyword" allowClear value={filters.keyword} onChange={(e) => changeFilter("keyword", e.target.value)} onSearch={doSearch} style={{ minWidth: 220, flex: "2 1 240px" }} />
        {selectFilter("educationId", "Education", settings.education)}
        {selectFilter("sectorId", "Sector", sectorOptions, !filters.educationId)}
        {selectFilter("jobRoleId", "Role", roleOptions, !filters.sectorId)}
        {selectFilter("locationId", "Location", settings.location)}
        {selectFilter("jobTypeId", "Job Type", settings.jobType)}
        <TextField size="small" type="number" label="Min salary" value={filters.minSalary} onChange={(e) => changeFilter("minSalary", e.target.value)} sx={{ minWidth: 120, flex: "1 1 120px" }} inputProps={{ min: 0 }} />
        <TextField size="small" type="number" label="Max salary" value={filters.maxSalary} onChange={(e) => changeFilter("maxSalary", e.target.value)} sx={{ minWidth: 120, flex: "1 1 120px" }} inputProps={{ min: 0 }} />
        {selectFilter("active", "Status", [{ id: "true", name: "Active" }, { id: "false", name: "Inactive" }])}
        <Button variant="contained" startIcon={<SearchOutlined />} onClick={doSearch}>Search</Button>
        <Button variant="text" onClick={clearFilters}>Clear</Button>
      </Box>
      <Box sx={{ "& .ant-table": { fontSize: 13 }, "& .ant-table-thead > tr > th": { fontWeight: 600, whiteSpace: "nowrap" } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          size="middle"
          scroll={{ x: 1250 }}
          pagination={{ current: page + 1, pageSize, total, showSizeChanger: true, pageSizeOptions: ["10", "20", "25", "50"], showTotal: (count, range) => `Showing ${range[0]}-${range[1]} of ${count} jobs`, onChange: (current, size) => loadJobs(current - 1, size, filters) }}
        />
      </Box>
    </Box>
  );
}
