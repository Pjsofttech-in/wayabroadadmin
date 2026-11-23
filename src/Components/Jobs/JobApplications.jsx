import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Input, Popconfirm, Table, Tag, message } from "antd";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Groups2Rounded,
  LooksOneRounded,
  LooksTwoRounded,
  PendingActionsRounded,
  PersonAddAlt1,
  PlaylistAddCheckRounded,
  StarBorderRounded,
  ThumbUpAltRounded,
  WatchLaterRounded,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  searchJobApplications,
  searchJobs, // NEW: used to map jobId -> country/sector and to build filter options
  getJobApplicationById,
  updateJobApplicationStatus,
  deactivateJobApplication,
} from "./JobService";

// "value" must match com.abroad.Enum.JobApplicationStatus in the backend.
// Only the labels shown to the admin use the "inquiry" wording.
const STATUSES = [
  { value: "PENDING", label: "Pending", tag: "gold", color: "#D49A16", icon: <PendingActionsRounded /> },
  { value: "INTERESTED", label: "Interested", tag: "cyan", color: "#17A2B8", icon: <StarBorderRounded /> },
  // Keep the backend enum value unchanged; only the admin-facing label is renamed.
  { value: "SHORTLISTED", label: "Not Interested", tag: "blue", color: "#2878C8", icon: <PlaylistAddCheckRounded /> },
  { value: "APPLY_LATER", label: "Apply Later", tag: "orange", color: "#E67E22", icon: <WatchLaterRounded /> },
  // Keep PROCESS_2 for API compatibility; display it as DND in the UI.
  { value: "PROCESS_2", label: "DND", tag: "purple", color: "#9B59B6", icon: <LooksTwoRounded /> },
  { value: "PROCESS_1", label: "In Process", tag: "processing", color: "#7654B8", icon: <LooksOneRounded /> },
  { value: "SELECTED", label: "Selected", tag: "green", color: "#29965A", icon: <ThumbUpAltRounded /> },
];
const STATUS_BY_VALUE = Object.fromEntries(STATUSES.map((item) => [item.value, item]));
export const getStatusLabel = (status) => STATUS_BY_VALUE[status]?.label || status || "Pending";
export const getStatusColor = (status) => STATUS_BY_VALUE[status]?.tag || "default";

const EMPTY_FILTERS = {
  jobId: "",
  status: "",
  country: "", // NEW
  sector: "", // NEW
  applicantEmail: "",
  applicantName: "",
  phone: "",
  appliedFrom: "",
  appliedTo: "",
};
const EMPTY_COUNTS = Object.fromEntries([["total", null], ...STATUSES.map((item) => [item.value, null])]);

export const getPageData = (response) => {
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

// Strict total: null when the response has no totalElements (never guessed).
export const getTotal = (response) => {
  const payload = response?.data ?? response;
  const pageData = payload?.data ?? payload;
  const value = pageData?.totalElements;
  if (value === null || value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : null;
};

export const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

// The backend search only understands jobId, status and applicantEmail, so
// applicant name, phone, country, sector and applied date are matched on the frontend.
const SERVER_PAGE_SIZE = 100;
export const normalize = (value) => String(value ?? "").trim().toLowerCase();
export const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

// NEW: reads a plain text value from either a string or an object like { name }.
const textOf = (value) => String(value?.name ?? value ?? "").trim();

// NEW: country / sector of a job. If your API uses other keys, change only these two.
export const getJobCountry = (job) => textOf(job?.country ?? job?.countryName);
export const getJobSector = (job) => textOf(job?.sector ?? job?.sectorName);

// NEW: country / sector of an inquiry. Uses the value on the inquiry itself and
// falls back to its job (jobMeta is a { [jobId]: { country, sector } } lookup).
export const getInquiryCountry = (item, jobMeta) =>
  textOf(item?.country ?? item?.countryName ?? item?.jobCountry) ||
  jobMeta?.[String(item?.jobId)]?.country ||
  "";
export const getInquirySector = (item, jobMeta) =>
  textOf(item?.sector ?? item?.sectorName ?? item?.jobSector) ||
  jobMeta?.[String(item?.jobId)]?.sector ||
  "";

const usesClientFilters = (f) =>
  Boolean(
    f.applicantEmail.trim() ||
      f.applicantName.trim() ||
      digitsOnly(f.phone) ||
      f.appliedFrom ||
      f.appliedTo ||
      f.country ||
      f.sector
  );

const matchesClientFilters = (item, f, jobMeta) => {
  const name = normalize(f.applicantName);
  if (name && !normalize(item?.applicantName).includes(name)) return false;

  // The backend matches applicantEmail exactly; the filter has always been "contains".
  const emailText = normalize(f.applicantEmail);
  if (emailText && !normalize(item?.email).includes(emailText)) return false;

  const phone = digitsOnly(f.phone);
  if (phone && !digitsOnly(item?.phone).includes(phone)) return false;

  // NEW
  if (f.country && normalize(getInquiryCountry(item, jobMeta)) !== normalize(f.country)) return false;
  if (f.sector && normalize(getInquirySector(item, jobMeta)) !== normalize(f.sector)) return false;

  if (f.appliedFrom || f.appliedTo) {
    const applied = new Date(item?.appliedAt);
    if (Number.isNaN(applied.getTime())) return false;
    if (f.appliedFrom && applied < new Date(`${f.appliedFrom}T00:00:00`)) return false;
    if (f.appliedTo && applied > new Date(`${f.appliedTo}T23:59:59.999`)) return false;
  }
  return true;
};

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};
export const show = (value) => (value === null || value === undefined || value === "" ? "-" : value);

export function OverviewCard({ title, value, icon, color, loading, onClick, selected }) {
  const hasValue = value !== null && value !== undefined;
  return (
    <Card
      elevation={0}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick && selected !== undefined ? Boolean(selected) : undefined}
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
              <Skeleton variant="text" width={40} sx={{ fontSize: 21 }} />
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

export function Field({ label, children, sx }) {
  return (
    <Box sx={{ minWidth: 0, ...sx }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ fontWeight: 500, wordBreak: "break-word" }}>
        {children}
      </Typography>
    </Box>
  );
}

export default function JobApplications() {
  const navigate = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isBranch = (sessionStorage.getItem("role") || "").toLowerCase() === "branch";

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsIssue, setCountsIssue] = useState("");

  // NEW: jobId -> { country, sector }
  const [jobMeta, setJobMeta] = useState({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mode, setMode] = useState("view");
  const [statusValue, setStatusValue] = useState("PENDING");
  const [remark, setRemark] = useState("");
  const [remarkError, setRemarkError] = useState("");
  const [updating, setUpdating] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);

  const requestIdRef = useRef(0);
  const clientCacheRef = useRef(null);
  const countsRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const jobMetaRef = useRef({}); // NEW: latest jobMeta for use inside loadApplications

  const loadApplications = useCallback(async (nextPage, nextSize, nextFilters, reuse = false) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      // The backend search supports jobId, status and applicantEmail filters.
      // sortBy/sortDir follow the same convention as the jobs search endpoint.
      const serverParams = {
        jobId: nextFilters.jobId,
        status: nextFilters.status,
        sortBy: "id",
        sortDir: "ASC",
      };

      if (usesClientFilters(nextFilters)) {
        if (nextFilters.appliedFrom && nextFilters.appliedTo && nextFilters.appliedFrom > nextFilters.appliedTo) {
          setRows([]);
          setTotal(0);
          setError("The From date must be on or before the To date.");
          return;
        }

        // Fetch every server-filtered page, then apply the extra filters here.
        // Paging through the result reuses the list instead of fetching again.
        const key = JSON.stringify(nextFilters);
        let matches = reuse && clientCacheRef.current?.key === key ? clientCacheRef.current.rows : null;
        if (!matches) {
          const first = getPageData(await searchJobApplications({ ...serverParams, page: 0, size: SERVER_PAGE_SIZE }));
          const combined = [...first.content];
          const pageCount = Math.ceil(first.totalElements / SERVER_PAGE_SIZE);
          if (pageCount > 1) {
            const rest = await Promise.all(
              Array.from({ length: pageCount - 1 }, (_, index) =>
                searchJobApplications({ ...serverParams, page: index + 1, size: SERVER_PAGE_SIZE })
              )
            );
            rest.forEach((response) => combined.push(...getPageData(response).content));
          }
          matches = combined
            .filter((item) => matchesClientFilters(item, nextFilters, jobMetaRef.current))
            .sort((a, b) => Number(a.id) - Number(b.id));
          clientCacheRef.current = { key, rows: matches };
        }
        if (requestId !== requestIdRef.current) return;
        setRows(matches.slice(nextPage * nextSize, (nextPage + 1) * nextSize));
        setTotal(matches.length);
        setPage(nextPage);
        setPageSize(nextSize);
        return;
      }

      clientCacheRef.current = null;
      const response = await searchJobApplications({ ...serverParams, page: nextPage, size: nextSize });
      if (requestId !== requestIdRef.current) return;
      const result = getPageData(response);
      setRows(result.content);
      setTotal(result.totalElements);
      setPage(nextPage);
      setPageSize(nextSize);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      console.error("Failed to fetch job inquiries:", e);
      setRows([]);
      setTotal(0);
      setError(getErrorMessage(e, "Failed to fetch inquiries."));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Card counts describe the whole inquiry list (not the current filters).
  const loadCounts = useCallback(() => {
    const requestId = ++countsRequestRef.current;
    setCountsLoading(true);
    setCountsIssue("");
    const base = { page: 0, size: 1 };
    Promise.allSettled([
      searchJobApplications(base),
      ...STATUSES.map((item) => searchJobApplications({ ...base, status: item.value })),
    ]).then((results) => {
      if (requestId !== countsRequestRef.current) return;
      const next = {};
      let failed = false;
      ["total", ...STATUSES.map((item) => item.value)].forEach((key, index) => {
        const result = results[index];
        const value = result.status === "fulfilled" ? getTotal(result.value) : null;
        next[key] = value;
        if (value === null) failed = true;
      });
      setCounts(next);
      setCountsLoading(false);
      if (failed) setCountsIssue("Some counts could not be loaded.");
    });
  }, []);

  // NEW: load jobs once to know each job's country and sector.
  const loadJobMeta = useCallback(async () => {
    try {
      const response = await searchJobs({
        page: 0,
        size: 100,
        sortBy: "jobTitle",
        sortDir: "ASC",
      });
      const list = getPageData(response).content;
      const next = {};
      list.forEach((job) => {
        const id = job?.id ?? job?.jobId;
        if (id === null || id === undefined) return;
        next[String(id)] = { country: getJobCountry(job), sector: getJobSector(job) };
      });
      jobMetaRef.current = next;
      setJobMeta(next);
    } catch (e) {
      // Not fatal: columns and filters still use values present on the inquiry itself.
      console.error("Failed to load job country/sector:", e);
    }
  }, []);

  useEffect(() => {
    loadApplications(0, 10, EMPTY_FILTERS);
    loadCounts();
    loadJobMeta();
  }, [loadApplications, loadCounts, loadJobMeta]);

  // NEW: dropdown options = values from the jobs list + values seen in loaded inquiries.
  const { countryOptions, sectorOptions } = useMemo(() => {
    const countries = new Set();
    const sectors = new Set();
    Object.values(jobMeta).forEach((meta) => {
      if (meta.country) countries.add(meta.country);
      if (meta.sector) sectors.add(meta.sector);
    });
    rows.forEach((row) => {
      const country = getInquiryCountry(row, jobMeta);
      const sector = getInquirySector(row, jobMeta);
      if (country) countries.add(country);
      if (sector) sectors.add(sector);
    });
    const sort = (set) => [...set].sort((a, b) => a.localeCompare(b));
    return { countryOptions: sort(countries), sectorOptions: sort(sectors) };
  }, [jobMeta, rows]);

  const updateFilter = (name, value) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const search = () => loadApplications(0, pageSize, filters);
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadApplications(0, pageSize, EMPTY_FILTERS);
  };

  // Clicking a status card filters by that status; clicking it again (or Total) clears it.
  const applyStatusCard = (value) => {
    const nextStatus = value === "" || filters.status === value ? "" : value;
    const next = { ...filters, status: nextStatus };
    setFilters(next);
    loadApplications(0, pageSize, next);
  };

  const hasFilters = Boolean(
    filters.jobId || filters.status || filters.applicantEmail.trim() || usesClientFilters(filters)
  );

  /* ------------------------------ row popup ------------------------------ */

  const openDetails = async (record) => {
    const requestId = ++detailRequestRef.current;
    setSelected(record);
    setMode("view");
    setRemark("");
    setRemarkError("");
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await getJobApplicationById(record.id);
      if (requestId === detailRequestRef.current) {
        setSelected(response?.data ?? response ?? record);
      }
    } catch (e) {
      console.error("Failed to load inquiry details:", e);
      if (requestId === detailRequestRef.current) {
        message.error(getErrorMessage(e, "Could not load inquiry details."));
      }
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    if (!updating) setDetailOpen(false);
  };

  const startStatusUpdate = () => {
    setStatusValue(selected?.status || "PENDING");
    setRemark("");
    setRemarkError("");
    setMode("status");
  };

  const cancelStatusUpdate = () => {
    if (updating) return;
    setMode("view");
    setRemarkError("");
  };

  const currentStatus = selected?.status || "PENDING";

  const submitStatusChange = async () => {
    const trimmed = remark.trim();
    if (!trimmed) {
      setRemarkError("Remark is required to update the status.");
      return;
    }
    if (statusValue === currentStatus) {
      setRemarkError("Choose a different status.");
      return;
    }
    setUpdating(true);
    try {
      await updateJobApplicationStatus(selected.id, statusValue, trimmed);
      message.success("Inquiry status updated.");
      setDetailOpen(false);
      await loadApplications(page, pageSize, filters);
      loadCounts();
    } catch (e) {
      console.error("Status update failed:", e);
      message.error(getErrorMessage(e, "Could not update status."));
    } finally {
      setUpdating(false);
    }
  };

  const deactivate = async (id) => {
    try {
      await deactivateJobApplication(id);
      message.success("Inquiry deactivated.");
      const lastPage = Math.max(0, Math.ceil((total - 1) / pageSize) - 1);
      await loadApplications(Math.min(page, lastPage), pageSize, filters);
      loadCounts();
      if (selected?.id === id) {
        setDetailOpen(false);
        setSelected(null);
      }
    } catch (e) {
      console.error("Inquiry deactivation failed:", e);
      message.error(getErrorMessage(e, "Could not deactivate inquiry."));
    }
  };

  /* -------------------------------- table -------------------------------- */

  // Columns appear progressively with screen width so no horizontal scrollbar is
  // needed. Everything is always available in the row popup.
  const text = (value) => value || "-";
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 56, responsive: ["md"] },
    {
      title: "Job", dataIndex: "jobTitle", key: "jobTitle", ellipsis: true,
      render: (value, record) => value || (record.jobId != null ? `Job #${record.jobId}` : "-"),
    },
    // NEW: Country and Sector columns
    {
      title: "Country", key: "country", width: 110, ellipsis: true, responsive: ["lg"],
      render: (_, record) => text(getInquiryCountry(record, jobMeta)),
    },
    {
      title: "Sector", key: "sector", width: 120, ellipsis: true, responsive: ["lg"],
      render: (_, record) => text(getInquirySector(record, jobMeta)),
    },
    { title: "Applicant", dataIndex: "applicantName", key: "applicantName", ellipsis: true, render: text },
    { title: "Email", dataIndex: "email", key: "email", ellipsis: true, responsive: ["md"], render: text },
    { title: "Phone", dataIndex: "phone", key: "phone", width: 125, ellipsis: true, responsive: ["lg"], render: text },
    { title: "Applied", dataIndex: "appliedAt", key: "appliedAt", width: 110, responsive: ["lg"], render: formatDate },
    {
      title: "Resume", dataIndex: "resumeUrl", key: "resumeUrl", width: 80, responsive: ["xl"],
      render: (url) => url
        ? <a href={url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>View</a>
        : "-",
    },
    {
      title: "Status", dataIndex: "status", key: "status", width: 105,
      render: (status) => (
        <Tag style={{ marginInlineEnd: 0 }} color={getStatusColor(status || "PENDING")}>
          {getStatusLabel(status || "PENDING")}
        </Tag>
      ),
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
                  title="Deactivate this inquiry?"
                  description="It will be marked inactive."
                  onConfirm={() => deactivate(record.id)}
                  okText="Deactivate"
                  cancelText="Cancel"
                >
                  <Button size="small" color="error" sx={{ minWidth: 0, p: 0.5 }} aria-label={`Deactivate inquiry ${record.id}`}>
                    <DeleteOutlined />
                  </Button>
                </Popconfirm>
              </span>
            ),
          },
        ]
      : []),
  ];

  const cards = [
    { key: "total", title: "Total", color: "#183b56", icon: <Groups2Rounded />, onClick: () => applyStatusCard("") },
    ...STATUSES.map((item) => ({
      key: item.value,
      title: item.label,
      color: item.color,
      icon: item.icon,
      onClick: () => applyStatusCard(item.value),
      selected: filters.status === item.value,
    })),
  ];

  const detailGrid = {
    display: "grid",
    gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" },
    gap: { xs: 1.25, sm: 1.5 },
  };
  const fullRow = { gridColumn: "1 / -1" };

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1, py: 0 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {countsIssue && (
        <Alert severity="warning" sx={{ mb: 1, py: 0 }} onClose={() => setCountsIssue("")}>
          {countsIssue}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
            xl: "repeat(8, minmax(0, 1fr))",
          },
          gap: 1,
          mb: 1.25,
        }}
      >
        {cards.map(({ key, ...card }) => (
          <OverviewCard
            key={key}
            {...card}
            value={counts[key]}
            loading={countsLoading}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          alignItems: "center",
          p: 1,
          mb: 1.25,
          border: "1px solid #e2e8f0",
          borderRadius: 2,
        }}
      >
        <TextField
          size="small"
          type="number"
          label="Job ID"
          value={filters.jobId}
          onChange={(event) => updateFilter("jobId", event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") search(); }}
          sx={{ flex: "1 1 100px", maxWidth: { sm: 130 }, minWidth: 90 }}
          inputProps={{ min: 1 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
          sx={{ flex: "1 1 140px", maxWidth: { sm: 170 }, minWidth: 130 }}
        >
          <MenuItem value="">All</MenuItem>
          {STATUSES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
        </TextField>
        {/* NEW: Country filter */}
        <TextField
          select
          size="small"
          label="Country"
          value={filters.country}
          onChange={(event) => updateFilter("country", event.target.value)}
          sx={{ flex: "1 1 140px", maxWidth: { sm: 170 }, minWidth: 130 }}
        >
          <MenuItem value="">All</MenuItem>
          {countryOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        {/* NEW: Sector filter */}
        <TextField
          select
          size="small"
          label="Sector"
          value={filters.sector}
          onChange={(event) => updateFilter("sector", event.target.value)}
          sx={{ flex: "1 1 140px", maxWidth: { sm: 170 }, minWidth: 130 }}
        >
          <MenuItem value="">All</MenuItem>
          {sectorOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: "2 1 200px", minWidth: 0 }}>
          <Input
            placeholder="Applicant email"
            allowClear
            value={filters.applicantEmail}
            onChange={(event) => updateFilter("applicantEmail", event.target.value)}
            onPressEnter={search}
            style={{ width: "100%", height: 40 }}
          />
        </Box>
        {/* Extra filters: always visible on tablet and up, behind "More filters" on phones. */}
        <Box sx={{ display: { xs: moreOpen ? "contents" : "none", sm: "contents" } }}>
          <TextField
            size="small"
            label="Applicant name"
            value={filters.applicantName}
            onChange={(event) => updateFilter("applicantName", event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") search(); }}
            sx={{ flex: "1 1 160px", minWidth: 140 }}
            inputProps={{ maxLength: 150 }}
          />
          <TextField
            size="small"
            label="Phone"
            value={filters.phone}
            onChange={(event) => updateFilter("phone", event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") search(); }}
            sx={{ flex: "1 1 130px", maxWidth: { sm: 170 }, minWidth: 120 }}
            inputProps={{ maxLength: 20 }}
          />
          <TextField
            size="small"
            type="date"
            label="Applied from"
            value={filters.appliedFrom}
            onChange={(event) => updateFilter("appliedFrom", event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: "1 1 140px", maxWidth: { sm: 165 }, minWidth: 135 }}
          />
          <TextField
            size="small"
            type="date"
            label="Applied to"
            value={filters.appliedTo}
            onChange={(event) => updateFilter("appliedTo", event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: "1 1 140px", maxWidth: { sm: 165 }, minWidth: 135 }}
          />
        </Box>
        <Button variant="contained" startIcon={<SearchOutlined />} onClick={search} sx={{ height: 40, textTransform: "none", boxShadow: "none" }}>
          Search
        </Button>
        <Button onClick={clearFilters} disabled={!hasFilters} sx={{ height: 40, textTransform: "none" }}>
          Clear
        </Button>
        <Button
          onClick={() => setMoreOpen((open) => !open)}
          sx={{ display: { xs: "inline-flex", sm: "none" }, height: 40, textTransform: "none", whiteSpace: "nowrap" }}
        >
          {moreOpen ? "Fewer filters" : "More filters"}
        </Button>
        {!isBranch && (
          <Button
            variant="outlined"
            startIcon={<PersonAddAlt1 />}
            onClick={() => navigate("/wayabroadadmin/admin/jobs/applications/add")}
            sx={{ height: 40, textTransform: "none", whiteSpace: "nowrap", ml: { md: "auto" } }}
          >
            Add Inquiry
          </Button>
        )}
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
            pageSizeOptions: ["10", "20", "25", "50"],
            showTotal: (count, range) => `${range[0]}-${range[1]} of ${count}`,
            onChange: (current, size) => loadApplications(current - 1, size, filters, true),
          }}
        />
      </Box>

      <Dialog
        open={detailOpen}
        onClose={closeDetails}
        fullWidth
        maxWidth="sm"
        fullScreen={fullScreen}
        scroll="paper"
      >
        <DialogTitle sx={{ py: 1.25 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            <Typography
              component="span"
              sx={{ fontSize: 17, fontWeight: 700, minWidth: 0, flex: 1, wordBreak: "break-word" }}
            >
              {mode === "status"
                ? "Update status"
                : selected?.applicantName || (selected?.id != null ? `Inquiry #${selected.id}` : "Inquiry")}
            </Typography>
            {mode === "view" && selected && (
              <Tag style={{ marginInlineEnd: 0 }} color={getStatusColor(selected.status || "PENDING")}>
                {getStatusLabel(selected.status || "PENDING")}
              </Tag>
            )}
          </Stack>
        </DialogTitle>
        {detailLoading && <LinearProgress sx={{ height: 2 }} />}
        <DialogContent dividers sx={{ py: 1.5 }}>
          {!selected ? (
            <Typography variant="body2">No inquiry details available.</Typography>
          ) : mode === "status" ? (
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <TextField
                select
                size="small"
                fullWidth
                label="Status"
                value={statusValue}
                onChange={(event) => { setStatusValue(event.target.value); setRemarkError(""); }}
                disabled={updating}
              >
                {STATUSES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </TextField>
              <TextField
                label="Remark"
                value={remark}
                onChange={(event) => {
                  setRemark(event.target.value);
                  if (event.target.value.trim()) setRemarkError("");
                }}
                error={Boolean(remarkError)}
                helperText={remarkError || "Required. Saved with this status update."}
                multiline
                minRows={3}
                fullWidth
                required
                autoFocus
                inputProps={{ maxLength: 1000 }}
                disabled={updating}
              />
            </Stack>
          ) : (
            <Box sx={detailGrid}>
              <Field label="Inquiry ID">{show(selected.id)}</Field>
              <Field label="Job">
                {selected.jobTitle || (selected.jobId != null ? `Job #${selected.jobId}` : "-")}
              </Field>
              {/* NEW */}
              <Field label="Country">{show(getInquiryCountry(selected, jobMeta))}</Field>
              <Field label="Sector">{show(getInquirySector(selected, jobMeta))}</Field>
              <Field label="Applicant">{show(selected.applicantName)}</Field>
              <Field label="Applied">{formatDateTime(selected.appliedAt)}</Field>
              <Field label="Email">{show(selected.email)}</Field>
              <Field label="Phone">{show(selected.phone)}</Field>
              <Field label="Active">{selected.active === false ? "No" : "Yes"}</Field>
              <Field label="Resume">
                {selected.resumeUrl
                  ? <a href={selected.resumeUrl} target="_blank" rel="noreferrer">Open resume</a>
                  : "-"}
              </Field>
              <Field label="Remark" sx={fullRow}>
                <Box component="span" sx={{ whiteSpace: "pre-wrap" }}>{show(selected.remark)}</Box>
              </Field>
              <Field label="Cover Letter" sx={fullRow}>
                <Box component="span" sx={{ whiteSpace: "pre-wrap" }}>{show(selected.coverLetter)}</Box>
              </Field>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          {mode === "status" ? (
            <>
              <Button onClick={cancelStatusUpdate} disabled={updating} sx={{ textTransform: "none" }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={submitStatusChange}
                disabled={updating || !remark.trim() || statusValue === currentStatus}
                sx={{ textTransform: "none", boxShadow: "none" }}
              >
                {updating ? "Updating..." : "Update"}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={closeDetails} sx={{ textTransform: "none" }}>Close</Button>
              {!isBranch && selected && (
                <Button
                  variant="contained"
                  onClick={startStatusUpdate}
                  disabled={detailLoading}
                  sx={{ textTransform: "none", boxShadow: "none" }}
                >
                  Update status
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}