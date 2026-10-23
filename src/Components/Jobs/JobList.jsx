import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Slider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Input, Popconfirm, Table, Tag, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { deleteJob, getJobSettings, getJobs, searchJobs } from "./JobService";

const EMPTY_FILTERS = {
  keyword: "",
  educationId: "",
  sectorId: "",
  jobRoleId: "",
  countryId: "",
  jobTypeId: "",
  workTypeId: "",
  experienceLevel: "",
  minSalary: "",
  maxSalary: "",
  active: "",
};

const SETTING_TYPES = [
  "education",
  "sector",
  "role",
  "country",
  "jobType",
  "workType",
];

function unwrapPayload(response) {
  return response?.data ?? response;
}

function normalizeArray(response) {
  const payload = unwrapPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
}

function normalizePage(response) {
  const payload = unwrapPayload(response);
  const nested = payload?.data ?? payload;
  const content = Array.isArray(nested?.content)
    ? nested.content
    : Array.isArray(nested)
      ? nested
      : Array.isArray(nested?.data?.content)
        ? nested.data.content
        : Array.isArray(nested?.data)
          ? nested.data
          : [];

  return {
    content,
    totalElements: Number(
      nested?.totalElements ??
      nested?.data?.totalElements ??
      payload?.totalElements ??
      content.length
    ),
  };
}

function getOptionName(item) {
  return (
    item?.name ??
    item?.educationName ??
    item?.sectorName ??
    item?.jobRoleName ??
    item?.countryName ??
    item?.country?.name ??
    item?.jobTypeName ??
    item?.workTypeName ??
    (item?.id != null ? `#${item.id}` : "Unnamed")
  );
}

function formatSkills(skills) {
  if (Array.isArray(skills)) return skills.filter(Boolean).join(", ") || "-";
  if (typeof skills === "string") return skills || "-";
  // Compatibility with older response objects that use `skill`.
  if (typeof skills?.skill === "string") return skills.skill || "-";
  return "-";
}

export default function JobList() {
  const navigate = useNavigate();
  const isBranch = (sessionStorage.getItem("role") || "").toLowerCase() === "branch";

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const requestIdRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [salaryBounds] = useState([0, 5000000]); // ₹0–₹50 lakh (0–50 LPA)
  const [settings, setSettings] = useState({
    education: [],
    sector: [],
    role: [],
    country: [],
    jobType: [],
    workType: [],
  });
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async (nextPage, nextSize, nextFilters) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const response = await searchJobs({
        keyword: nextFilters.keyword.trim(),
        educationId: nextFilters.educationId,
        sectorId: nextFilters.sectorId,
        jobRoleId: nextFilters.jobRoleId,
        countryId: nextFilters.countryId,
        jobTypeId: nextFilters.jobTypeId,
        workTypeId: nextFilters.workTypeId,
        experienceLevel: nextFilters.experienceLevel.trim(),
        minSalary: nextFilters.minSalary,
        maxSalary: nextFilters.maxSalary,
        active: nextFilters.active,
        page: nextPage,
        size: nextSize,
        sortBy: "id",
        sortDir: "DESC",
      });

      // Ignore older responses so fast filter changes cannot overwrite newer results.
      if (requestId !== requestIdRef.current) return;
      const result = normalizePage(response);
      setRows(result.content);
      setTotal(result.totalElements);
      setPage(nextPage);
      setPageSize(nextSize);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      console.error("Failed to load jobs:", requestError);
      setRows([]);
      setTotal(0);
      setError(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          requestError?.message ||
          "Failed to load jobs."
      );
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const results = await Promise.allSettled(
        SETTING_TYPES.map((type) => getJobSettings(type))
      );
      const nextSettings = {};
      results.forEach((result, index) => {
        const type = SETTING_TYPES[index];
        if (result.status === "fulfilled") {
          nextSettings[type] = normalizeArray(result.value);
        } else {
          nextSettings[type] = [];
          console.error(`Failed to load ${type} job settings:`, result.reason);
        }
      });
      setSettings((previous) => ({ ...previous, ...nextSettings }));
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Live filtering: debounce all filter changes slightly. This is especially useful
  // for keyword typing and dragging the salary slider, and prevents request floods.
  useEffect(() => {
    setPage(0);
    const timer = setTimeout(() => {
      loadJobs(0, pageSize, filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, refreshKey, loadJobs]);

  const changeFilter = (name, value) => {
    setFilters((previous) => {
      const next = { ...previous, [name]: value };
      if (name === "sectorId") next.jobRoleId = "";
      return next;
    });
  };

  const roleOptions = useMemo(
    () => settings.role.filter((item) => {
      if (!filters.sectorId) return true;
      const itemSectorId = item?.sector?.id ?? item?.sectorId;
      return itemSectorId != null && String(itemSectorId) === String(filters.sectorId);
    }),
    [settings.role, filters.sectorId]
  );

  const clearFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setPage(0);
    // Also refresh when Clear is clicked while filters are already empty.
    setRefreshKey((value) => value + 1);
  };

  const salaryRange = [
    filters.minSalary === "" ? salaryBounds[0] : Number(filters.minSalary),
    filters.maxSalary === "" ? salaryBounds[1] : Number(filters.maxSalary),
  ];

  // Salary values are stored/sent as numeric INR amounts; show them in LPA for readability.
  const formatSalary = (value) => `${(Number(value) / 100000).toLocaleString("en-IN", {
    maximumFractionDigits: 1,
  })} LPA`;

  const handleSalaryRangeChange = (_, newValue) => {
    if (!Array.isArray(newValue) || newValue.length !== 2) return;
    const [minimum, maximum] = newValue;
    setFilters((previous) => ({
      ...previous,
      minSalary: minimum <= salaryBounds[0] ? "" : String(minimum),
      maxSalary: maximum >= salaryBounds[1] ? "" : String(maximum),
    }));
  };

  const handleDelete = async (id) => {
    try {
      await deleteJob(id);
      message.success("Job deleted successfully.");
      const lastPage = Math.max(0, Math.ceil((total - 1) / pageSize) - 1);
      await loadJobs(Math.min(page, lastPage), pageSize, filters);
    } catch (requestError) {
      console.error("Failed to delete job:", requestError);
      message.error(
        requestError?.response?.data?.message || "Failed to delete job."
      );
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "Job Title",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (value) => value || "-",
    },
    {
      title: "Education",
      dataIndex: "educationName",
      key: "educationName",
      render: (value) => value || "-",
    },
    {
      title: "Sector",
      dataIndex: "sectorName",
      key: "sectorName",
      render: (value) => value || "-",
    },
    {
      title: "Job Role",
      dataIndex: "jobRoleName",
      key: "jobRoleName",
      render: (value) => value || "-",
    },
    {
      title: "Skills",
      dataIndex: "skills",
      key: "skills",
      render: (value, record) => formatSkills(value ?? record?.skill),
    },
    {
      title: "Country",
      dataIndex: "countryName",
      key: "countryName",
      render: (value) => value || "-",
    },
    {
      title: "Location",
      dataIndex: "locationName",
      key: "locationName",
      render: (value) => value || "-",
    },
    {
      title: "Work Type",
      dataIndex: "workTypeName",
      key: "workTypeName",
      render: (value) => value || "-",
    },
    {
      title: "Experience Level",
      dataIndex: "experienceLevel",
      key: "experienceLevel",
      render: (value) => value || "-",
    },
    {
      title: "Salary",
      key: "salary",
      render: (_, record) =>
        `${record?.currencyName || ""} ${record?.salary ?? "-"}`.trim(),
    },
    {
      title: "Job Type",
      dataIndex: "jobTypeName",
      key: "jobTypeName",
      render: (value) => value || "-",
    },
    {
      title: "Openings",
      dataIndex: "openings",
      key: "openings",
      width: 90,
      render: (value) => value ?? "-",
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "green" : "default"}>
          {active ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    ...(!isBranch
      ? [
          {
            title: "Actions",
            key: "actions",
            fixed: "right",
            width: 130,
            render: (_, record) => (
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  aria-label={`Edit job ${record.id}`}
                  onClick={() =>
                    navigate(
                      `/wayabroadadmin/admin/jobs/create?editId=${record.id}`
                    )
                  }
                >
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title="Delete this job?"
                  description="This action cannot be undone."
                  onConfirm={() => handleDelete(record.id)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button
                    size="small"
                    color="error"
                    aria-label={`Delete job ${record.id}`}
                  >
                    <DeleteOutlined />
                  </Button>
                </Popconfirm>
              </Stack>
            ),
          },
        ]
      : []),
  ];

  const selectFilter = (name, label, options, disabled = false) => (
    <TextField
      select
      size="small"
      label={label}
      value={filters[name]}
      onChange={(event) => changeFilter(name, event.target.value)}
      sx={{ minWidth: 150, flex: "1 1 150px" }}
      disabled={disabled || settingsLoading}
    >
      <MenuItem value="">All</MenuItem>
      {options.map((item) => (
        <MenuItem key={item.id} value={String(item.id)}>
          {getOptionName(item)}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={700} color="#183b56">
          Job List
        </Typography>
        {!isBranch && (
          <Button
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={() => navigate("/wayabroadadmin/admin/jobs/create")}
          >
            Create Job
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 2,
          p: 2,
          mb: 2,
          display: "flex",
          gap: 1.25,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Input.Search
          placeholder="Search job title or keyword"
          allowClear
          value={filters.keyword}
          onChange={(event) => changeFilter("keyword", event.target.value)}
          style={{ minWidth: 220, flex: "2 1 240px" }}
        />
        {selectFilter("educationId", "Education", settings.education)}
        {selectFilter("sectorId", "Sector", settings.sector)}
        {selectFilter("jobRoleId", "Role", roleOptions, !filters.sectorId)}
        {selectFilter("countryId", "Country", settings.country)}
        {selectFilter("jobTypeId", "Job Type", settings.jobType)}
        {selectFilter("workTypeId", "Work Type", settings.workType)}
        <TextField
          size="small"
          label="Experience Level"
          value={filters.experienceLevel}
          onChange={(event) => changeFilter("experienceLevel", event.target.value)}
          sx={{ minWidth: 150, flex: "1 1 150px" }}
        />
        <Box
          sx={{
            flex: "2 1 280px",
            minWidth: { xs: "100%", sm: 260 },
            maxWidth: { xs: "100%", lg: 380 },
            px: 1.25,
            pt: 0.25,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
            <Typography variant="body2" fontWeight={600}>
              Salary Range
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
              {formatSalary(salaryRange[0])} – {formatSalary(salaryRange[1])}
            </Typography>
          </Stack>
          <Slider
            size="small"
            value={[
              Math.min(salaryRange[0], salaryRange[1]),
              Math.max(salaryRange[0], salaryRange[1]),
            ]}
            min={salaryBounds[0]}
            max={salaryBounds[1]}
            step={100000}
            onChange={handleSalaryRangeChange}
            valueLabelDisplay="auto"
            valueLabelFormat={formatSalary}
            aria-label="Salary range"
            sx={{ mt: 0.5, mb: 0, py: 0.5 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -0.5 }}>
Range: 0–50 LPA. Salary filter values are sent as numeric amounts; jobs may use different currencies.
          </Typography>
        </Box>
        {selectFilter("active", "Status", [
          { id: "true", name: "Active" },
          { id: "false", name: "Inactive" },
        ])}
        <Button variant="text" onClick={clearFilters}>
          Clear
        </Button>
      </Box>

      <Box
        sx={{
          "& .ant-table": { fontSize: 13 },
          "& .ant-table-thead > tr > th": {
            fontWeight: 600,
            whiteSpace: "nowrap",
          },
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          size="middle"
          scroll={{ x: 1800 }}
          pagination={{
            current: page + 1,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "25", "50"],
            showTotal: (count, range) =>
              `Showing ${range[0]}-${range[1]} of ${count} jobs`,
            onChange: (current, size) =>
              loadJobs(current - 1, size, filters),
          }}
        />
      </Box>
    </Box>
  );
}
