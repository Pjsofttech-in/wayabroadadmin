import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
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
  SearchOutlined,
} from "@ant-design/icons";
import { deleteJob, getJobSettings, searchJobs } from "./JobService";

const EMPTY_FILTERS = {
  keyword: "",
  educationId: "",
  sectorId: "",
  jobRoleId: "",
  locationId: "",
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
  "location",
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
    item?.locationName ??
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
  const [settings, setSettings] = useState({
    education: [],
    sector: [],
    role: [],
    location: [],
    jobType: [],
    workType: [],
  });
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async (nextPage, nextSize, nextFilters) => {
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

      const result = normalizePage(response);
      setRows(result.content);
      setTotal(result.totalElements);
      setPage(nextPage);
      setPageSize(nextSize);
    } catch (requestError) {
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
      setLoading(false);
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
    loadJobs(0, 10, EMPTY_FILTERS);
  }, [loadJobs, loadSettings]);

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

  const doSearch = () => loadJobs(0, pageSize, filters);

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadJobs(0, pageSize, EMPTY_FILTERS);
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
          onSearch={doSearch}
          style={{ minWidth: 220, flex: "2 1 240px" }}
        />
        {selectFilter("educationId", "Education", settings.education)}
        {selectFilter("sectorId", "Sector", settings.sector)}
        {selectFilter("jobRoleId", "Role", roleOptions, !filters.sectorId)}
        {selectFilter("locationId", "Location", settings.location)}
        {selectFilter("jobTypeId", "Job Type", settings.jobType)}
        {selectFilter("workTypeId", "Work Type", settings.workType)}
        <TextField
          size="small"
          label="Experience Level"
          value={filters.experienceLevel}
          onChange={(event) => changeFilter("experienceLevel", event.target.value)}
          sx={{ minWidth: 150, flex: "1 1 150px" }}
        />
        <TextField
          size="small"
          type="number"
          label="Min salary"
          value={filters.minSalary}
          onChange={(event) => changeFilter("minSalary", event.target.value)}
          sx={{ minWidth: 120, flex: "1 1 120px" }}
          inputProps={{ min: 0 }}
        />
        <TextField
          size="small"
          type="number"
          label="Max salary"
          value={filters.maxSalary}
          onChange={(event) => changeFilter("maxSalary", event.target.value)}
          sx={{ minWidth: 120, flex: "1 1 120px" }}
          inputProps={{ min: 0 }}
        />
        {selectFilter("active", "Status", [
          { id: "true", name: "Active" },
          { id: "false", name: "Inactive" },
        ])}
        <Button variant="contained" startIcon={<SearchOutlined />} onClick={doSearch}>
          Search
        </Button>
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
