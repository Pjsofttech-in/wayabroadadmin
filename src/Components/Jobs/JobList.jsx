import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Slider,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { Input, Popconfirm, Table, Tag, message } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  CheckCircleOutlineRounded,
  EventSeatRounded,
  FilterAltOffRounded,
  FilterAltRounded,
  FilterListRounded,
  PauseCircleOutlineRounded,
  PublicRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";
import { deleteJob, getJobSettings, searchJobs } from "./JobService";
import JobDetailDialog from "./JobDetailDialog";

const EMPTY_FILTERS = {
  keyword: "",
  educationId: "",
  sectorId: "",
  jobRoleId: "",
  countryId: "",
  jobTypeId: "",
  workTypeId: "",
  minExperience: "",
  maxExperience: "",
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
    totalPages: Number(
      nested?.totalPages ??
      nested?.data?.totalPages ??
      payload?.totalPages ??
      0
    ),
  };
}

// Backend experienceLevel values are strings (for example: "0", "1 Year", "0-1", "2-4 years").
// Convert only the leading numeric value(s); unrecognized formats are excluded from range results.
function parseExperienceRange(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().replace(/[–—]/g, "-");
  const matches = normalized.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return null;

  const minimum = Number(matches[0]);
  const maximum = matches.length > 1 ? Number(matches[1]) : minimum;
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum < minimum) {
    return null;
  }
  return { minimum, maximum };
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

// Strict total: returns null when the API response has no totalElements (never guesses).
function getTotal(response) {
  const payload = unwrapPayload(response);
  const page = payload?.data ?? payload;
  const value = page?.totalElements;
  if (value === null || value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

// Loads every job (100 per request) for overview figures that need all records.
async function fetchAllJobs() {
  const size = 100;
  const params = { sortBy: "id", sortDir: "ASC", size };
  const first = normalizePage(await searchJobs({ ...params, page: 0 }));
  const pageCount = first.totalPages || Math.ceil(first.totalElements / size);
  if (pageCount <= 1) return first.content;
  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => searchJobs({ ...params, page: index + 1 }))
  );
  return [...first.content, ...rest.flatMap((response) => normalizePage(response).content)];
}

function OverviewCard({ title, value, icon, color, loading, onClick, selected }) {
  const hasValue = value !== null && value !== undefined;
  return (
    <Card
      elevation={0}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? Boolean(selected) : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      sx={{
        minWidth: 0,
        borderRadius: 3,
        cursor: onClick ? "pointer" : "default",
        border: `1px solid ${alpha(color, selected ? 0.75 : 0.2)}`,
        boxShadow: selected ? `0 0 0 3px ${alpha(color, 0.16)}` : "none",
        background: `linear-gradient(145deg, ${alpha(color, 0.095)} 0%, #ffffff 78%)`,
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": onClick
          ? { transform: "translateY(-2px)", boxShadow: `0 8px 20px ${alpha(color, 0.14)}` }
          : undefined,
      }}
    >
      <CardContent sx={{ p: { xs: 1, sm: 1.25 }, "&:last-child": { pb: { xs: 1, sm: 1.25 } } }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              flex: "0 0 34px",
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              color,
              bgcolor: alpha(color, 0.12),
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 20 } })}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="overline"
              noWrap
              sx={{ display: "block", color: "text.secondary", fontSize: 10, lineHeight: 1.3, fontWeight: 700, letterSpacing: 0.5 }}
            >
              {title}
            </Typography>
            {loading && !hasValue ? (
              <Skeleton variant="text" width={52} sx={{ fontSize: 24 }} />
            ) : (
              <Typography sx={{ fontSize: { xs: 18, sm: 21 }, fontWeight: 750, lineHeight: 1.2, color: "#17212b" }}>
                {hasValue ? Number(value).toLocaleString("en-IN") : "—"}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
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
  const [experienceBounds] = useState([0, 30]); // 0–30 years
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
  const [detailJob, setDetailJob] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile only; filters are always shown on md+
  const [overview, setOverview] = useState({ total: null, active: null, inactive: null, openings: null, countries: null });
  const [overviewCountsLoading, setOverviewCountsLoading] = useState(true);
  const [overviewDerivedLoading, setOverviewDerivedLoading] = useState(true);
  const [overviewIssue, setOverviewIssue] = useState("");
  const overviewRequestRef = useRef(0);

  // Overview cards describe the whole job inventory (not the current filters).
  const loadOverview = useCallback(() => {
    const requestId = ++overviewRequestRef.current;
    const isCurrent = () => requestId === overviewRequestRef.current;
    setOverviewCountsLoading(true);
    setOverviewDerivedLoading(true);
    setOverviewIssue("");

    const base = { page: 0, size: 1, sortBy: "id", sortDir: "DESC" };
    Promise.allSettled([
      searchJobs(base),
      searchJobs({ ...base, active: true }),
      searchJobs({ ...base, active: false }),
    ]).then((results) => {
      if (!isCurrent()) return;
      const next = {};
      let failed = false;
      ["total", "active", "inactive"].forEach((key, index) => {
        const result = results[index];
        const value = result.status === "fulfilled" ? getTotal(result.value) : null;
        next[key] = value;
        if (value === null) failed = true;
      });
      setOverview((previous) => ({ ...previous, ...next }));
      setOverviewCountsLoading(false);
      if (failed) setOverviewIssue("Some overview counts could not be loaded.");
    });

    fetchAllJobs()
      .then((list) => {
        if (!isCurrent()) return;
        const activeJobs = list.filter((job) => job?.active !== false);
        setOverview((previous) => ({
          ...previous,
          openings: activeJobs.reduce((sum, job) => sum + (Number(job?.openings) || 0), 0),
          countries: new Set(activeJobs.map((job) => job?.countryName).filter(Boolean)).size,
        }));
      })
      .catch((overviewError) => {
        if (!isCurrent()) return;
        console.error("Failed to load job overview:", overviewError);
        setOverview((previous) => ({ ...previous, openings: null, countries: null }));
        setOverviewIssue((previous) => previous || "Some overview figures could not be loaded.");
      })
      .finally(() => {
        if (isCurrent()) setOverviewDerivedLoading(false);
      });
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const loadJobs = useCallback(async (nextPage, nextSize, nextFilters) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const apiFilters = {
        keyword: nextFilters.keyword.trim(),
        educationId: nextFilters.educationId,
        sectorId: nextFilters.sectorId,
        jobRoleId: nextFilters.jobRoleId,
        countryId: nextFilters.countryId,
        jobTypeId: nextFilters.jobTypeId,
        workTypeId: nextFilters.workTypeId,
        minSalary: nextFilters.minSalary,
        maxSalary: nextFilters.maxSalary,
        active: nextFilters.active,
        sortBy: "id",
        sortDir: "ASC",
      };

      let resultRows = [];
      let resultTotal = 0;

      if (nextFilters.minExperience !== "" || nextFilters.maxExperience !== "") {
        const fetchSize = 100;
        const firstResponse = await searchJobs({ ...apiFilters, page: 0, size: fetchSize });
        const firstPage = normalizePage(firstResponse);
        resultRows = [...firstPage.content];
        resultTotal = firstPage.totalElements;

        // Fetch every server-filtered page before applying the experience range,
        // so matching jobs are not missed because of server pagination.
        const pageCount = firstPage.totalPages || Math.ceil(resultTotal / fetchSize);
        if (pageCount > 1) {
          const remainingResponses = await Promise.all(
            Array.from({ length: pageCount - 1 }, (_, index) =>
              searchJobs({ ...apiFilters, page: index + 1, size: fetchSize })
            )
          );
          remainingResponses.forEach((pageResponse) => {
            resultRows.push(...normalizePage(pageResponse).content);
          });
        }

        const minimum = nextFilters.minExperience === ""
          ? null
          : Number(nextFilters.minExperience);
        const maximum = nextFilters.maxExperience === ""
          ? null
          : Number(nextFilters.maxExperience);

        resultRows = resultRows.filter((job) => {
          const experience = parseExperienceRange(job?.experienceLevel);
          if (!experience) return false;
          // Inclusive interval overlap: a job marked 2-4 years matches a selected 3-5 range.
          return (maximum === null || experience.minimum <= maximum) &&
            (minimum === null || experience.maximum >= minimum);
        });

        resultTotal = resultRows.length;
        resultRows = resultRows.slice(nextPage * nextSize, (nextPage + 1) * nextSize);
      } else {
        const response = await searchJobs({
          ...apiFilters,
          experienceLevel: "",
          page: nextPage,
          size: nextSize,
        });
        const result = normalizePage(response);
        resultRows = result.content;
        resultTotal = result.totalElements;
      }

      // Ignore older responses so fast filter changes cannot overwrite newer results.
      if (requestId !== requestIdRef.current) return;
      setRows(resultRows);
      setTotal(resultTotal);
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
    const hasNegativeExperience =
      (filters.minExperience !== "" && Number(filters.minExperience) < 0) ||
      (filters.maxExperience !== "" && Number(filters.maxExperience) < 0);
    const hasInvalidExperienceRange =
      filters.minExperience !== "" &&
      filters.maxExperience !== "" &&
      Number(filters.minExperience) > Number(filters.maxExperience);

    if (hasNegativeExperience || hasInvalidExperienceRange) {
      setRows([]);
      setTotal(0);
      setError(hasNegativeExperience
        ? "Experience values cannot be negative."
        : "Minimum experience cannot be greater than maximum experience.");
      return undefined;
    }

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

  const activeFilterCount = [
    filters.keyword.trim(),
    filters.educationId,
    filters.sectorId,
    filters.jobRoleId,
    filters.countryId,
    filters.jobTypeId,
    filters.workTypeId,
    filters.active,
    filters.minExperience !== "" || filters.maxExperience !== "" ? "range" : "",
    filters.minSalary !== "" || filters.maxSalary !== "" ? "range" : "",
  ].filter((value) => value !== "").length;

  // Clicking Active/Inactive again turns that status filter off.
  const toggleStatusFilter = (value) =>
    changeFilter("active", filters.active === value ? "" : value);

  const overviewCards = [
    {
      title: "Total Jobs",
      value: overview.total,
      icon: <WorkOutlineRounded />,
      color: "#2878C8",
      loading: overviewCountsLoading,
      onClick: () => changeFilter("active", ""),
    },
    {
      title: "Active Jobs",
      value: overview.active,
      icon: <CheckCircleOutlineRounded />,
      color: "#29965A",
      loading: overviewCountsLoading,
      onClick: () => toggleStatusFilter("true"),
      selected: filters.active === "true",
    },
    {
      title: "Inactive Jobs",
      value: overview.inactive,
      icon: <PauseCircleOutlineRounded />,
      color: "#7B8794",
      loading: overviewCountsLoading,
      onClick: () => toggleStatusFilter("false"),
      selected: filters.active === "false",
    },
    {
      title: "Total Openings",
      value: overview.openings,
      icon: <EventSeatRounded />,
      color: "#7654B8",
      loading: overviewDerivedLoading,
    },
    {
      title: "Countries Hiring",
      value: overview.countries,
      icon: <PublicRounded />,
      color: "#17A2B8",
      loading: overviewDerivedLoading,
    },
    {
      title: "Matching Filters",
      value: total,
      icon: <FilterAltRounded />,
      color: "#D49A16",
      loading,
    },
  ];

  const experienceRange = [
    filters.minExperience === "" ? experienceBounds[0] : Number(filters.minExperience),
    filters.maxExperience === "" ? experienceBounds[1] : Number(filters.maxExperience),
  ];

  const handleExperienceRangeChange = (_, newValue) => {
    if (!Array.isArray(newValue) || newValue.length !== 2) return;
    const [minimum, maximum] = newValue;
    setFilters((previous) => ({
      ...previous,
      minExperience: minimum <= experienceBounds[0] ? "" : String(minimum),
      maxExperience: maximum >= experienceBounds[1] ? "" : String(maximum),
    }));
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

  const refreshAfterUpdate = async () => {
    await loadJobs(page, pageSize, filters);
    loadOverview();
  };

  const handleDelete = async (id) => {
    try {
      await deleteJob(id);
      message.success("Job deleted successfully.");
      const lastPage = Math.max(0, Math.ceil((total - 1) / pageSize) - 1);
      await loadJobs(Math.min(page, lastPage), pageSize, filters);
      loadOverview();
    } catch (requestError) {
      console.error("Failed to delete job:", requestError);
      message.error(
        requestError?.response?.data?.message || "Failed to delete job."
      );
    }
  };

  // Columns appear progressively with screen width so the table never needs a
  // horizontal scrollbar. Every detail is always available in the row popup.
  const text = (value) => value || "-";
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 56, responsive: ["md"] },
    { title: "Job Title", dataIndex: "jobTitle", key: "jobTitle", ellipsis: true, render: text },
    { title: "Education", dataIndex: "educationName", key: "educationName", width: 110, ellipsis: true, responsive: ["xxl"], render: text },
    { title: "Sector", dataIndex: "sectorName", key: "sectorName", width: 120, ellipsis: true, responsive: ["xl"], render: text },
    { title: "Job Role", dataIndex: "jobRoleName", key: "jobRoleName", width: 130, ellipsis: true, responsive: ["lg"], render: text },
    {
      title: "Skills", dataIndex: "skills", key: "skills", width: 170, ellipsis: true, responsive: ["xxl"],
      render: (value, record) => formatSkills(value ?? record?.skill),
    },
    { title: "Country", dataIndex: "countryName", key: "countryName", width: 100, ellipsis: true, responsive: ["sm"], render: text },
    { title: "Location", dataIndex: "locationName", key: "locationName", width: 110, ellipsis: true, responsive: ["md"], render: text },
    { title: "Work Type", dataIndex: "workTypeName", key: "workTypeName", width: 95, ellipsis: true, responsive: ["lg"], render: text },
    { title: "Experience", dataIndex: "experienceLevel", key: "experienceLevel", width: 100, ellipsis: true, responsive: ["xl"], render: text },
    {
      title: "Salary", key: "salary", width: 110, ellipsis: true, responsive: ["md"],
      render: (_, record) => `${record?.currencyName || ""} ${record?.salary ?? "-"}`.trim(),
    },
    { title: "Job Type", dataIndex: "jobTypeName", key: "jobTypeName", width: 100, ellipsis: true, responsive: ["xl"], render: text },
    { title: "Openings", dataIndex: "openings", key: "openings", width: 80, responsive: ["lg"], render: (value) => value ?? "-" },
    {
      title: "Status", dataIndex: "active", key: "active", width: 84,
      render: (active) => <Tag style={{ marginInlineEnd: 0 }} color={active ? "green" : "default"}>{active ? "Active" : "Inactive"}</Tag>,
    },
    ...(!isBranch
      ? [
          {
            title: "",
            key: "actions",
            width: 48,
            align: "center",
            render: (_, record) => (
              // Stops the click (including the confirm popup) from opening the row popup.
              <span onClick={(event) => event.stopPropagation()}>
                <Popconfirm
                  title={`Delete "${record.jobTitle || `job #${record.id}`}"?`}
                  description="This action cannot be undone."
                  onConfirm={() => handleDelete(record.id)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button size="small" color="error" sx={{ minWidth: 0, p: 0.5 }} aria-label={`Delete job ${record.id}`}>
                    <DeleteOutlined />
                  </Button>
                </Popconfirm>
              </span>
            ),
          },
        ]
      : []),
  ];

  const openDetails = (record) => {
    setDetailJob(record);
    setDetailOpen(true);
  };

  const selectFilter = (name, label, options, disabled = false) => (
    <TextField
      select
      size="small"
      label={label}
      value={filters[name]}
      onChange={(event) => changeFilter(name, event.target.value)}
      fullWidth
      sx={{ minWidth: 0, width: "100%" }}
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
    <Box sx={{ width: "100%", minWidth: 0, pb: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1, py: 0 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {overviewIssue && (
        <Alert severity="warning" sx={{ mb: 1, py: 0 }} onClose={() => setOverviewIssue("")}>
          {overviewIssue}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(6, minmax(0, 1fr))",
          },
          gap: 1,
          mb: 1.25,
        }}
      >
        {overviewCards.map((card) => (
          <OverviewCard key={card.title} {...card} />
        ))}
      </Box>

      <Stack direction="row" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 1 }}>
        <Box sx={{ flex: "1 1 220px", minWidth: 0 }}>
          <Input.Search
            placeholder="Search jobs"
            allowClear
            value={filters.keyword}
            onChange={(event) => changeFilter("keyword", event.target.value)}
            style={{ width: "100%" }}
          />
        </Box>
        <Button
          size="small"
          startIcon={<FilterListRounded />}
          onClick={() => setFiltersOpen((open) => !open)}
          sx={{ display: { xs: "inline-flex", md: "none" }, textTransform: "none", whiteSpace: "nowrap" }}
        >
          Filters
        </Button>
        <Button
          size="small"
          startIcon={<FilterAltOffRounded />}
          onClick={clearFilters}
          disabled={activeFilterCount === 0}
          sx={{ textTransform: "none", whiteSpace: "nowrap" }}
        >
          {activeFilterCount > 0 ? `Clear (${activeFilterCount})` : "Clear"}
        </Button>
        {!isBranch && (
          <Button
            size="small"
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={() => navigate("/wayabroadadmin/admin/jobs/create")}
            sx={{ textTransform: "none", whiteSpace: "nowrap", boxShadow: "none" }}
          >
            Create Job
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          border: "1px solid #e2e8f0",
          borderRadius: 2,
          p: 1,
          mb: 1.25,
          display: { xs: filtersOpen ? "grid" : "none", md: "grid" },
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
          gap: 1,
          alignItems: "center",
          minWidth: 0,
          width: "100%",
          "& > *": { minWidth: 0, maxWidth: "100%" },
          "& .MuiFormControl-root": { minWidth: 0, width: "100%" },
          "& .MuiSlider-root": { minWidth: 0 },
        }}
      >
        {selectFilter("educationId", "Education", settings.education)}
        {selectFilter("sectorId", "Sector", settings.sector)}
        {selectFilter("jobRoleId", "Role", roleOptions, !filters.sectorId)}
        {selectFilter("countryId", "Country", settings.country)}
        {selectFilter("jobTypeId", "Job Type", settings.jobType)}
        {selectFilter("workTypeId", "Work Type", settings.workType)}
        {selectFilter("active", "Status", [
          { id: "true", name: "Active" },
          { id: "false", name: "Inactive" },
        ])}
        <Box sx={{ px: 0.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
            <Typography variant="body2" fontWeight={600}>Experience</Typography>
            <Stack direction="row" spacing={0.75} alignItems="baseline">
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                {experienceRange[0]} – {experienceRange[1]} yrs
              </Typography>
              {(filters.minExperience !== "" || filters.maxExperience !== "") && (
                <Button
                  size="small"
                  onClick={() => setFilters((previous) => ({
                    ...previous,
                    minExperience: "",
                    maxExperience: "",
                  }))}
                  sx={{ minWidth: "auto", p: 0, textTransform: "none", lineHeight: 1.2 }}
                >
                  Clear
                </Button>
              )}
            </Stack>
          </Stack>
          <Slider
            size="small"
            value={[
              Math.min(experienceRange[0], experienceRange[1]),
              Math.max(experienceRange[0], experienceRange[1]),
            ]}
            min={experienceBounds[0]}
            max={experienceBounds[1]}
            step={1}
            onChange={handleExperienceRangeChange}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value} yrs`}
            aria-label="Experience range"
            sx={{ my: 0, py: 0.5 }}
          />
        </Box>
        <Box sx={{ px: 0.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
            <Typography variant="body2" fontWeight={600}>Salary</Typography>
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
            sx={{ my: 0, py: 0.5 }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          "& .ant-table": { fontSize: 13 },
          "& .ant-table-thead > tr > th": { fontWeight: 600, whiteSpace: "nowrap", padding: "8px" },
          "& .ant-table-tbody > tr > td": { padding: "7px 8px" },
          "& .ant-table-tbody > tr": { cursor: "pointer" },
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          size="small"
          onRow={(record) => ({ onClick: () => openDetails(record) })}
          pagination={{
            current: page + 1,
            pageSize,
            total,
            size: "small",
            showLessItems: true,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (count, range) => `${range[0]}-${range[1]} of ${count}`,
            onChange: (current, size) => loadJobs(current - 1, size, filters),
          }}
        />
      </Box>

      <JobDetailDialog
        open={detailOpen}
        job={detailJob}
        canEdit={!isBranch}
        onClose={() => setDetailOpen(false)}
        onUpdated={refreshAfterUpdate}
      />
    </Box>
  );
}