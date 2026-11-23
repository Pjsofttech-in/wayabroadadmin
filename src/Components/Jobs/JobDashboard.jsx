import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  AddCircleOutlineRounded,
  CheckCircleOutlineRounded,
  EmojiEventsRounded,
  EventSeatRounded,
  FiberNewRounded,
  FileDownloadOutlined,
  FunctionsRounded,
  Groups2Rounded,
  HowToRegRounded,
  LooksOneRounded,
  LooksTwoRounded,
  PauseCircleOutlineRounded,
  PendingActionsRounded,
  PersonAddAlt1,
  PlaylistAddCheckRounded,
  Print,
  Refresh,
  ReportProblemRounded,
  StarBorderRounded,
  ThumbUpAltRounded,
  WatchLaterRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";
import { ResponsivePie } from "@nivo/pie";
import { getJobApplications, searchJobApplications, searchJobs } from "./JobService";

const JOBS_BASE = "/wayabroadadmin/admin/jobs";
const FULL_PAGE_SIZE = 100;
const DAY = 24 * 60 * 60 * 1000;
const EMPTY = [];

const APPLICATION_STATUSES = [
  { value: "PENDING", label: "Pending", color: "#D49A16" },
  { value: "SHORTLISTED", label: "Shortlisted", color: "#2878C8" },
  { value: "INTERESTED", label: "Interested", color: "#17A2B8" },
  { value: "PROCESS_1", label: "Process 1", color: "#7654B8" },
  { value: "PROCESS_2", label: "Process 2", color: "#9B59B6" },
  { value: "APPLY_LATER", label: "Apply Later", color: "#E67E22" },
  { value: "SELECTED", label: "Selected", color: "#29965A" },
];
const STATUS_META = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s.value, s]));

const RANGE_OPTIONS = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

const JOB_DIMENSIONS = [
  { key: "sector", label: "Sector", field: "sectorName" },
  { key: "country", label: "Country", field: "countryName" },
  { key: "location", label: "Location", field: "locationName" },
  { key: "jobType", label: "Job Type", field: "jobTypeName" },
  { key: "workType", label: "Work Type", field: "workTypeName" },
  { key: "education", label: "Education", field: "educationName" },
  { key: "role", label: "Job Role", field: "jobRoleName" },
];

const pieTheme = {
  fontFamily: "Poppins, sans-serif",
  fontSize: 11,
  textColor: "#475569",
  legends: { text: { fontSize: 10, fill: "#475569" } },
  tooltip: {
    container: {
      background: "#ffffff",
      color: "#1f2937",
      fontSize: 12,
      borderRadius: 8,
      boxShadow: "0 4px 16px rgba(15, 23, 42, 0.14)",
    },
  },
};

/* ----------------------------- data helpers ----------------------------- */

function getPageTotal(response) {
  const payload = response?.data ?? response;
  const page = payload?.data ?? payload;
  const value = page?.totalElements;
  if (value === null || value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

function getPageInfo(response) {
  const payload = response?.data ?? response;
  const page = payload?.data ?? payload;
  const content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : [];
  return {
    content,
    totalElements: Number(page?.totalElements ?? content.length),
    totalPages: Number(page?.totalPages ?? 0),
  };
}

// Fetches every page of a paged endpoint (page 0 first, then the rest in parallel).
async function fetchAllPages(fetchPage) {
  const first = getPageInfo(await fetchPage(0));
  const pageCount = first.totalPages || Math.ceil(first.totalElements / FULL_PAGE_SIZE);
  if (pageCount <= 1) return first.content;
  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => fetchPage(index + 1))
  );
  return [...first.content, ...rest.flatMap((response) => getPageInfo(response).content)];
}

function getErrorText(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to load this dashboard metric."
  );
}

/* ------------------------------ date helpers ------------------------------ */

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};
const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};
const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const parseInputDate = (value) => (value ? new Date(`${value}T00:00:00`) : null);
const fmtDay = (date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtMonth = (date) => date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
const fmtDate = (value) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "-";
};

// The jobs API response shape for dates was not part of the supplied code, so the
// dashboard only uses a job date when one of these common fields is present.
const pickJobDate = (job) =>
  toDate(job?.createdAt ?? job?.createdDate ?? job?.createdOn ?? job?.postedAt ?? job?.postedDate);

function computeRange(preset, customFrom, customTo, earliest) {
  const now = new Date();
  let start = null;
  let end = endOfDay(now);
  let isAll = false;

  if (preset === "all") {
    isAll = true;
    start = earliest ? startOfDay(earliest) : null;
  } else if (preset === "custom") {
    start = parseInputDate(customFrom);
    const to = parseInputDate(customTo);
    if (to) end = endOfDay(to);
    if (!start) {
      isAll = true;
      start = earliest ? startOfDay(earliest) : null;
    }
    if (start && end < start) {
      return { start: null, end: null, isAll: false, previous: null, error: "The From date must be on or before the To date." };
    }
  } else {
    const days = RANGE_OPTIONS.find((option) => option.value === preset)?.days || 30;
    start = startOfDay(now);
    start.setDate(start.getDate() - (days - 1));
  }

  let previous = null;
  if (!isAll && start) {
    const length = end.getTime() - start.getTime() + 1;
    previous = {
      start: new Date(start.getTime() - length),
      end: new Date(start.getTime() - 1),
    };
  }
  return { start, end, isAll, previous, error: "" };
}

const countInRange = (dates, start, end) =>
  dates.filter((date) => date >= start && date <= end).length;

function getTrend(current, previous) {
  if (current === null || previous === null) return null;
  if (previous === 0) {
    return current === 0
      ? { direction: "flat", text: "No change vs previous period" }
      : { direction: "up", text: "↑ New vs empty previous period" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { direction: "flat", text: "No change vs previous period" };
  return pct > 0
    ? { direction: "up", text: `↑ ${pct}% vs previous period` }
    : { direction: "down", text: `↓ ${Math.abs(pct)}% vs previous period` };
}

function buildSeries(dates, start, end) {
  if (!start || !end || end < start) return { points: [], unit: "day" };
  const spanDays = Math.round((end.getTime() - start.getTime()) / DAY) + 1;
  const unit = spanDays <= 45 ? "day" : spanDays <= 200 ? "week" : "month";
  const buckets = [];
  let cursor = unit === "month" ? new Date(start.getFullYear(), start.getMonth(), 1) : startOfDay(start);

  while (cursor <= end && buckets.length < 400) {
    const next = new Date(cursor);
    if (unit === "day") next.setDate(next.getDate() + 1);
    else if (unit === "week") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    buckets.push({
      from: cursor,
      to: next,
      count: 0,
      label: unit === "month" ? fmtMonth(cursor) : fmtDay(cursor),
    });
    cursor = next;
  }

  dates.forEach((date) => {
    if (date < start || date > end) return;
    const bucket = buckets.find((item) => date >= item.from && date < item.to);
    if (bucket) bucket.count += 1;
  });
  return { points: buckets, unit };
}

function groupCount(items, getLabel, limit = 8) {
  const counts = new Map();
  items.forEach((item) => {
    const label = String(getLabel(item) || "").trim() || "Unspecified";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function downloadCsv(rows, filename) {
  const cell = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = `\uFEFF${rows.map((row) => row.map(cell).join(",")).join("\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ------------------------------ UI components ------------------------------ */

function MetricCard({ title, value, suffix = "", caption, trend, icon, color, loading, onClick }) {
  const theme = useTheme();
  const trendColor =
    trend?.direction === "down" ? "#C0392B" : trend?.direction === "up" ? "#29965A" : theme.palette.text.secondary;
  const hasValue = value !== null && value !== undefined;

  return (
    <Card
      elevation={0}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
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
        height: "100%",
        borderRadius: 3,
        cursor: onClick ? "pointer" : "default",
        border: `1px solid ${alpha(color, 0.2)}`,
        background: `linear-gradient(145deg, ${alpha(color, 0.095)} 0%, #ffffff 78%)`,
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 9px 24px ${alpha(color, 0.13)}`,
        },
      }}
    >
      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              flex: "0 0 46px",
              display: "grid",
              placeItems: "center",
              borderRadius: 2.5,
              color,
              bgcolor: alpha(color, 0.12),
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 25 } })}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
                color: theme.palette.text.secondary,
                fontSize: 10,
                lineHeight: 1.35,
                fontWeight: 700,
                letterSpacing: 0.55,
              }}
            >
              {title}
            </Typography>
            {loading && !hasValue ? (
              <Skeleton variant="text" width={72} sx={{ fontSize: 28 }} />
            ) : (
              <Typography
                variant="h4"
                sx={{ fontSize: { xs: 25, sm: 28 }, fontWeight: 750, lineHeight: 1.25, color: "#17212b" }}
              >
                {hasValue ? `${Number(value).toLocaleString("en-IN")}${suffix}` : "—"}
              </Typography>
            )}
          </Box>
        </Stack>
        {trend || caption ? (
          <Box sx={{ mt: 1.2, minHeight: 18 }}>
            {trend ? (
              <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: trendColor }}>
                {trend.text}
              </Typography>
            ) : null}
            {caption ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {caption}
              </Typography>
            ) : null}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#183b56", mb: 1.25 }}>
      {children}
    </Typography>
  );
}

function ChartPanel({ title, subtitle, action, minHeight = 390, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        minHeight,
        border: "1px solid #e5eaf0",
        borderRadius: 3,
        p: { xs: 1.75, sm: 2.5 },
        bgcolor: "#fff",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700, color: "#17212b" }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        {action || null}
      </Stack>
      {children}
    </Paper>
  );
}

function NoChartData({ children = "No data available yet." }) {
  return (
    <Box
      sx={{
        minHeight: 260,
        height: "calc(100% - 55px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed #d6dee8",
        borderRadius: 2,
        color: "text.secondary",
        px: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

// Shows a skeleton, an error, an empty message, or the rendered content, per widget.
function PanelState({ loading, error, empty, emptyText, render }) {
  if (loading) return <Skeleton variant="rounded" height={260} />;
  if (error) return <NoChartData>{error}</NoChartData>;
  if (empty) return <NoChartData>{emptyText}</NoChartData>;
  return render();
}

function DonutChart({ data, legendPosition }) {
  const isRight = legendPosition === "right";
  return (
    <Box sx={{ height: 320 }}>
      <ResponsivePie
        data={data}
        margin={isRight ? { top: 18, right: 128, bottom: 18, left: 18 } : { top: 18, right: 18, bottom: 68, left: 18 }}
        innerRadius={0.62}
        padAngle={1.5}
        cornerRadius={4}
        activeOuterRadiusOffset={7}
        colors={(slice) => slice.data.color}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        enableArcLabels
        arcLabelsSkipAngle={10}
        arcLabelsTextColor="#ffffff"
        enableArcLinkLabels={false}
        theme={pieTheme}
        legends={[
          isRight
            ? {
                anchor: "right",
                direction: "column",
                justify: false,
                translateX: 116,
                itemsSpacing: 5,
                itemWidth: 104,
                itemHeight: 18,
                itemTextColor: "#64748b",
                itemDirection: "left-to-right",
                symbolSize: 10,
                symbolShape: "circle",
              }
            : {
                anchor: "bottom",
                direction: "row",
                justify: false,
                translateY: 58,
                itemsSpacing: 12,
                itemWidth: 86,
                itemHeight: 18,
                itemTextColor: "#64748b",
                itemDirection: "left-to-right",
                symbolSize: 10,
                symbolShape: "circle",
              },
        ]}
      />
    </Box>
  );
}

// Horizontal bars (used for funnel, breakdowns and top lists) without extra chart libraries.
function BarList({ items, color = "#2878C8" }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <Stack spacing={1.25}>
      {items.map((item) => (
        <Box key={item.label}>
          <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.4 }}>
            <Typography
              variant="body2"
              title={item.label}
              sx={{ fontSize: 12.5, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {item.label}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12.5, fontWeight: 700, color: "#17212b", whiteSpace: "nowrap" }}>
              {item.value.toLocaleString("en-IN")}
              {item.note ? (
                <Box component="span" sx={{ fontWeight: 400, color: "text.secondary", ml: 0.75 }}>
                  {item.note}
                </Box>
              ) : null}
            </Typography>
          </Stack>
          <Box sx={{ height: 9, borderRadius: 5, bgcolor: alpha(item.color || color, 0.12) }}>
            <Box
              sx={{
                height: "100%",
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                borderRadius: 5,
                bgcolor: item.color || color,
                transition: "width 300ms ease",
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function TrendChart({ id, points, color }) {
  const width = 600;
  const height = 230;
  const pad = { top: 14, right: 14, bottom: 30, left: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...points.map((point) => point.count), 1);
  const niceMax = Math.ceil(max / 4) * 4;
  const x = (index) => pad.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const y = (value) => pad.top + innerH - (value / niceMax) * innerH;
  const line = points.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point.count)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${pad.top + innerH} L${x(0)},${pad.top + innerH} Z`;
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <Box sx={{ width: "100%", height: 260 }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" role="img" aria-label="Trend over time">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((tick) => {
          const value = (niceMax / 4) * tick;
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} stroke="#e5eaf0" strokeWidth="1" />
              <text x={pad.left - 6} y={y(value) + 3} textAnchor="end" fontSize="10" fill="#64748b">
                {value}
              </text>
            </g>
          );
        })}
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <g key={point.label + index}>
            <circle cx={x(index)} cy={y(point.count)} r={points.length > 60 ? 1.6 : 3} fill="#fff" stroke={color} strokeWidth="2">
              <title>{`${point.label}: ${point.count}`}</title>
            </circle>
            {index % labelStep === 0 ? (
              <text x={x(index)} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">
                {point.label}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </Box>
  );
}

function StatusChip({ status }) {
  const meta = STATUS_META[status || "PENDING"];
  const color = meta?.color || "#7B8794";
  return (
    <Chip
      size="small"
      label={meta?.label || status}
      sx={{ bgcolor: alpha(color, 0.12), color, fontWeight: 600, height: 22, fontSize: 11 }}
    />
  );
}

function MiniTable({ columns, rows, onRowClick }) {
  return (
    <TableContainer sx={{ maxHeight: 340 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} sx={{ fontWeight: 700, whiteSpace: "nowrap", fontSize: 12 }}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              hover
              key={row.id ?? index}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              sx={{ cursor: onRowClick ? "pointer" : "default" }}
            >
              {columns.map((column) => (
                <TableCell key={column.key} sx={{ fontSize: 12.5 }}>
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/* --------------------------------- page --------------------------------- */

export default function JobDashboard() {
  const navigate = useNavigate();
  const isBranch = (sessionStorage.getItem("role") || "").toLowerCase() === "branch";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobCounts, setJobCounts] = useState({ total: null, active: null, inactive: null });
  const [totalApplications, setTotalApplications] = useState(null);
  const [applicationStatusCounts, setApplicationStatusCounts] = useState({});
  const [statusCountsComplete, setStatusCountsComplete] = useState(false);
  const [errors, setErrors] = useState([]);

  const [fullLoading, setFullLoading] = useState(true);
  const [allJobs, setAllJobs] = useState(null);
  const [allApplications, setAllApplications] = useState(null);
  const [fullErrors, setFullErrors] = useState({ jobs: "", applications: "" });

  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState("0");
  const [rangePreset, setRangePreset] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dimKey, setDimKey] = useState("sector");
  const loadIdRef = useRef(0);

  const loadDashboard = useCallback(async (silent = false) => {
    const loadId = ++loadIdRef.current;
    const isCurrent = () => loadId === loadIdRef.current;
    setRefreshing(true);
    if (!silent) {
      setLoading(true);
      setFullLoading(true);
    }

    const jobParams = { page: 0, size: 1, sortBy: "id", sortDir: "DESC" };
    const countRequests = [
      searchJobs(jobParams),
      searchJobs({ ...jobParams, active: true }),
      searchJobs({ ...jobParams, active: false }),
      // The backend's admin page endpoint counts every application record,
      // including records marked inactive.
      getJobApplications({ page: 0, size: 1 }),
      ...APPLICATION_STATUSES.map(({ value }) =>
        searchJobApplications({ status: value, page: 0, size: 1 })
      ),
    ];

    const applyCounts = (results) => {
      if (!isCurrent()) return;
      const nextErrors = [];

      const jobMetricKeys = ["total", "active", "inactive"];
      const nextJobCounts = { total: null, active: null, inactive: null };
      jobMetricKeys.forEach((key, index) => {
        const result = results[index];
        if (result.status === "fulfilled") {
          nextJobCounts[key] = getPageTotal(result.value);
          if (nextJobCounts[key] === null) {
            nextErrors.push(`Jobs: the ${key} count was not present in the API response.`);
          }
        } else {
          nextErrors.push(`Jobs (${key}): ${getErrorText(result.reason)}`);
        }
      });
      setJobCounts(nextJobCounts);

      const applicationTotalResult = results[3];
      if (applicationTotalResult.status === "fulfilled") {
        const count = getPageTotal(applicationTotalResult.value);
        setTotalApplications(count);
        if (count === null) nextErrors.push("Applications: totalElements was missing from the API response.");
      } else {
        setTotalApplications(null);
        nextErrors.push(`Applications (total): ${getErrorText(applicationTotalResult.reason)}`);
      }

      const nextStatusCounts = {};
      let allStatusRequestsSucceeded = true;
      APPLICATION_STATUSES.forEach(({ value, label }, index) => {
        const result = results[index + 4];
        if (result.status === "fulfilled") {
          const count = getPageTotal(result.value);
          nextStatusCounts[value] = count;
          if (count === null) {
            allStatusRequestsSucceeded = false;
            nextErrors.push(`Applications (${label}): totalElements was missing from the API response.`);
          }
        } else {
          allStatusRequestsSucceeded = false;
          nextStatusCounts[value] = null;
          nextErrors.push(`Applications (${label}): ${getErrorText(result.reason)}`);
        }
      });

      setApplicationStatusCounts(nextStatusCounts);
      setStatusCountsComplete(allStatusRequestsSucceeded);
      setErrors(nextErrors);
      setLoading(false);
    };

    const applyFull = ([jobsResult, applicationsResult]) => {
      if (!isCurrent()) return;
      const nextErrors = { jobs: "", applications: "" };
      if (jobsResult.status === "fulfilled") setAllJobs(jobsResult.value);
      else nextErrors.jobs = getErrorText(jobsResult.reason);
      if (applicationsResult.status === "fulfilled") setAllApplications(applicationsResult.value);
      else nextErrors.applications = getErrorText(applicationsResult.reason);
      setFullErrors(nextErrors);
      setFullLoading(false);
    };

    // Cards render as soon as the count requests finish; list-based widgets follow
    // when the full job and application lists arrive.
    await Promise.all([
      Promise.allSettled(countRequests).then(applyCounts),
      Promise.allSettled([
        fetchAllPages((page) =>
          searchJobs({ page, size: FULL_PAGE_SIZE, sortBy: "id", sortDir: "DESC" })
        ),
        fetchAllPages((page) => searchJobApplications({ page, size: FULL_PAGE_SIZE })),
      ]).then(applyFull),
    ]);

    if (isCurrent()) {
      setLastUpdated(new Date());
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const minutes = Number(autoRefresh);
    if (!minutes) return undefined;
    const timer = setInterval(() => loadDashboard(true), minutes * 60 * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, loadDashboard]);

  /* ---- derived data ---- */

  const jobs = allJobs || EMPTY;
  const applications = allApplications || EMPTY;

  const appDates = useMemo(
    () => applications.map((item) => toDate(item?.appliedAt)).filter(Boolean),
    [applications]
  );
  const jobDates = useMemo(() => jobs.map(pickJobDate).filter(Boolean), [jobs]);
  const hasJobDates = jobDates.length > 0;

  const earliest = useMemo(() => {
    const all = [...appDates, ...jobDates];
    return all.length ? new Date(Math.min(...all.map((date) => date.getTime()))) : null;
  }, [appDates, jobDates]);

  const range = useMemo(
    () => computeRange(rangePreset, customFrom, customTo, earliest),
    [rangePreset, customFrom, customTo, earliest]
  );

  const rangeReady = !range.error && range.start && range.end;
  const rangeLabel = range.error
    ? range.error
    : range.start
      ? `${fmtDay(range.start)} – ${fmtDay(range.end)}`
      : "All time";

  const newApplications =
    allApplications && rangeReady ? countInRange(appDates, range.start, range.end) : null;
  const previousApplications =
    allApplications && range.previous ? countInRange(appDates, range.previous.start, range.previous.end) : null;
  const newJobs = hasJobDates && rangeReady ? countInRange(jobDates, range.start, range.end) : null;
  const previousJobs =
    hasJobDates && range.previous ? countInRange(jobDates, range.previous.start, range.previous.end) : null;

  const applicationSeries = useMemo(
    () => (rangeReady ? buildSeries(appDates, range.start, range.end) : { points: [], unit: "day" }),
    [appDates, range, rangeReady]
  );
  const jobSeries = useMemo(
    () => (rangeReady && hasJobDates ? buildSeries(jobDates, range.start, range.end) : { points: [], unit: "day" }),
    [jobDates, range, rangeReady, hasJobDates]
  );

  const activeJobs = useMemo(() => jobs.filter((job) => job?.active !== false), [jobs]);
  const inactiveJobs = useMemo(() => jobs.filter((job) => job?.active === false), [jobs]);

  const applicationJobIds = useMemo(
    () => new Set(applications.map((item) => String(item?.jobId))),
    [applications]
  );
  const zeroApplicationJobs = useMemo(
    () => (allJobs && allApplications ? activeJobs.filter((job) => !applicationJobIds.has(String(job.id))) : null),
    [allJobs, allApplications, activeJobs, applicationJobIds]
  );

  const totalOpenings = allJobs
    ? activeJobs.reduce((sum, job) => sum + (Number(job?.openings) || 0), 0)
    : null;

  const topJobs = useMemo(() => {
    if (!rangeReady) return [];
    const counts = new Map();
    applications.forEach((item) => {
      const date = toDate(item?.appliedAt);
      if (!date || date < range.start || date > range.end) return;
      const key = String(item?.jobId);
      const entry = counts.get(key) || { label: item?.jobTitle || `Job #${item?.jobId}`, value: 0 };
      entry.value += 1;
      counts.set(key, entry);
    });
    return [...counts.values()].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [applications, range, rangeReady]);

  const dimension = JOB_DIMENSIONS.find((item) => item.key === dimKey) || JOB_DIMENSIONS[0];
  const dimensionItems = useMemo(
    () => groupCount(jobs, (job) => job?.[dimension.field], 8),
    [jobs, dimension]
  );

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => (toDate(b?.appliedAt)?.getTime() || 0) - (toDate(a?.appliedAt)?.getTime() || 0))
        .slice(0, 8),
    [applications]
  );
  const pendingApplications = useMemo(
    () =>
      applications
        .filter((item) => !item?.status || item.status === "PENDING")
        .sort((a, b) => (toDate(a?.appliedAt)?.getTime() || 0) - (toDate(b?.appliedAt)?.getTime() || 0)),
    [applications]
  );
  const recentJobs = useMemo(() => jobs.slice(0, 8), [jobs]);

  const attentionRows = useMemo(() => {
    if (!allJobs) return [];
    const rows = [
      ...(zeroApplicationJobs || []).map((job) => ({ ...job, reason: "No applications" })),
      ...inactiveJobs.map((job) => ({ ...job, reason: "Inactive" })),
    ];
    return rows;
  }, [allJobs, zeroApplicationJobs, inactiveJobs]);

  const activeApplications = statusCountsComplete
    ? APPLICATION_STATUSES.reduce((sum, status) => sum + (applicationStatusCounts[status.value] || 0), 0)
    : null;

  const jobChartData = useMemo(() => {
    const { total, active, inactive } = jobCounts;
    if (total === null || active === null || inactive === null || total <= 0) return [];
    const data = [
      { id: "Active", label: "Active", value: active, color: "#29965A" },
      { id: "Inactive", label: "Inactive", value: inactive, color: "#7B8794" },
    ].filter((item) => item.value > 0);
    const unclassified = Math.max(0, total - active - inactive);
    if (unclassified > 0) {
      data.push({ id: "Unspecified", label: "Unspecified", value: unclassified, color: "#D49A16" });
    }
    return data;
  }, [jobCounts]);

  const applicationChartData = useMemo(() => {
    if (!statusCountsComplete) return [];
    return APPLICATION_STATUSES.map(({ value, label, color }) => ({
      id: label,
      label,
      value: applicationStatusCounts[value] || 0,
      color,
    })).filter((item) => item.value > 0);
  }, [applicationStatusCounts, statusCountsComplete]);

  const funnelItems = useMemo(() => {
    if (!statusCountsComplete) return [];
    return APPLICATION_STATUSES.map(({ value, label, color }) => {
      const count = applicationStatusCounts[value] || 0;
      return {
        label,
        value: count,
        color,
        note: activeApplications ? `${Math.round((count / activeApplications) * 100)}%` : "",
      };
    });
  }, [applicationStatusCounts, statusCountsComplete, activeApplications]);

  /* ---- metric cards ---- */

  const goJobs = () => navigate(`${JOBS_BASE}/list`);
  const goApplications = () => navigate(`${JOBS_BASE}/applications`);
  const statusCount = (value) => applicationStatusCounts[value];
  const round1 = (value) => Math.round(value * 10) / 10;

  const overviewMetrics = [
    { title: "Total Jobs", value: jobCounts.total, icon: <WorkOutlineRounded />, color: "#2878C8", loading, onClick: goJobs },
    { title: "Active Jobs", value: jobCounts.active, icon: <CheckCircleOutlineRounded />, color: "#29965A", loading, onClick: goJobs },
    { title: "Inactive Jobs", value: jobCounts.inactive, icon: <PauseCircleOutlineRounded />, color: "#7B8794", loading, onClick: goJobs },
    { title: "Total Applications", value: totalApplications, icon: <Groups2Rounded />, color: "#7654B8", loading, onClick: goApplications },
    { title: "Pending Applications", value: statusCount("PENDING"), icon: <PendingActionsRounded />, color: "#D49A16", loading, onClick: goApplications },
    { title: "Shortlisted Applications", value: statusCount("SHORTLISTED"), icon: <PlaylistAddCheckRounded />, color: "#17A2B8", loading, onClick: goApplications },
  ];

  const pipelineMetrics = [
    { title: "Interested", value: statusCount("INTERESTED"), icon: <StarBorderRounded />, color: "#17A2B8", loading, onClick: goApplications },
    { title: "Process 1", value: statusCount("PROCESS_1"), icon: <LooksOneRounded />, color: "#7654B8", loading, onClick: goApplications },
    { title: "Process 2", value: statusCount("PROCESS_2"), icon: <LooksTwoRounded />, color: "#9B59B6", loading, onClick: goApplications },
    { title: "Apply Later", value: statusCount("APPLY_LATER"), icon: <WatchLaterRounded />, color: "#E67E22", loading, onClick: goApplications },
    { title: "Selected", value: statusCount("SELECTED"), icon: <ThumbUpAltRounded />, color: "#29965A", loading, onClick: goApplications },
    {
      title: "Selection Rate",
      value: activeApplications ? round1((statusCount("SELECTED") / activeApplications) * 100) : activeApplications === 0 ? 0 : null,
      suffix: "%",
      caption: "Selected ÷ active applications",
      icon: <EmojiEventsRounded />,
      color: "#29965A",
      loading,
    },
  ];

  const insightMetrics = [
    {
      title: "Active Applications",
      value: activeApplications,
      caption: "Excludes deactivated records",
      icon: <HowToRegRounded />,
      color: "#7654B8",
      loading,
      onClick: goApplications,
    },
    {
      title: "Total Openings",
      value: totalOpenings,
      caption: "Across active jobs",
      icon: <EventSeatRounded />,
      color: "#2878C8",
      loading: fullLoading,
      onClick: goJobs,
    },
    {
      title: "Avg Applications / Job",
      value: activeApplications !== null && jobCounts.total ? round1(activeApplications / jobCounts.total) : null,
      caption: "Active applications ÷ total jobs",
      icon: <FunctionsRounded />,
      color: "#17A2B8",
      loading,
    },
    {
      title: "Jobs Without Applications",
      value: zeroApplicationJobs ? zeroApplicationJobs.length : null,
      caption: "Active jobs only",
      icon: <ReportProblemRounded />,
      color: "#E67E22",
      loading: fullLoading,
      onClick: goJobs,
    },
    {
      title: "New Applications",
      value: newApplications,
      trend: getTrend(newApplications, previousApplications),
      caption: rangeLabel,
      icon: <PersonAddAlt1 />,
      color: "#7654B8",
      loading: fullLoading,
      onClick: goApplications,
    },
    {
      title: "New Jobs",
      value: newJobs,
      trend: getTrend(newJobs, previousJobs),
      caption: hasJobDates || fullLoading ? rangeLabel : "Job dates not provided by API",
      icon: <FiberNewRounded />,
      color: "#2878C8",
      loading: fullLoading,
      onClick: goJobs,
    },
  ];

  const exportCsv = () => {
    const rows = [["Section", "Item", "Value"]];
    [...overviewMetrics, ...pipelineMetrics, ...insightMetrics].forEach((metric) =>
      rows.push([
        "Metric",
        metric.title,
        metric.value === null || metric.value === undefined ? "" : `${metric.value}${metric.suffix || ""}`,
      ])
    );
    APPLICATION_STATUSES.forEach((status) =>
      rows.push(["Application status", status.label, applicationStatusCounts[status.value] ?? ""])
    );
    JOB_DIMENSIONS.forEach((item) =>
      groupCount(jobs, (job) => job?.[item.field], 1000).forEach((entry) =>
        rows.push([`Jobs by ${item.label}`, entry.label, entry.value])
      )
    );
    topJobs.forEach((entry) => rows.push([`Top jobs by applications (${rangeLabel})`, entry.label, entry.value]));
    applicationSeries.points.forEach((point) =>
      rows.push([`Applications over time (${rangeLabel})`, point.label, point.count])
    );
    jobSeries.points.forEach((point) => rows.push([`Jobs over time (${rangeLabel})`, point.label, point.count]));
    downloadCsv(rows, `job-dashboard-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  /* ---- widget state helpers ---- */

  const jobsPending = fullLoading && !allJobs;
  const appsPending = fullLoading && !allApplications;
  const jobsError = !allJobs ? fullErrors.jobs : "";
  const appsError = !allApplications ? fullErrors.applications : "";
  const seriesSubtitle = (unit) =>
    `${unit === "day" ? "Daily" : unit === "week" ? "Weekly" : "Monthly"} · ${rangeLabel}`;
  const sumPoints = (points) => points.reduce((sum, point) => sum + point.count, 0);

  const renderMetricGrid = (items) => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {items.map((metric) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={metric.title}>
          <MetricCard {...metric} />
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
      {/* Header: title, quick actions, range, refresh, export */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={1.5}
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#183b56">
            Job Dashboard
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : "Loading latest data…"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap className="no-print" sx={{ "@media print": { display: "none" } }}>
          {!isBranch && (
            <Button variant="contained" startIcon={<AddCircleOutlineRounded />} onClick={() => navigate(`${JOBS_BASE}/create`)} sx={{ textTransform: "none" }}>
              Create Job
            </Button>
          )}
          {!isBranch && (
            <Button variant="outlined" startIcon={<PersonAddAlt1 />} onClick={() => navigate(`${JOBS_BASE}/applications/add`)} sx={{ textTransform: "none" }}>
              Add Inquiry
            </Button>
          )}
          <Button variant="outlined" onClick={goJobs} sx={{ textTransform: "none" }}>
            View Jobs
          </Button>
          <Button variant="outlined" onClick={goApplications} sx={{ textTransform: "none" }}>
            View Applications
          </Button>
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{ border: "1px solid #e5eaf0", borderRadius: 3, p: 1.5, mb: 2.5, "@media print": { display: "none" } }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={rangePreset}
            onChange={(_, value) => value && setRangePreset(value)}
            aria-label="Date range"
          >
            {RANGE_OPTIONS.map((option) => (
              <ToggleButton key={option.value} value={option.value} sx={{ textTransform: "none", px: 1.5 }}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {rangePreset === "custom" && (
            <>
              <TextField
                size="small"
                type="date"
                label="From"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
          <Box sx={{ flex: 1 }} />
          <TextField
            select
            size="small"
            label="Auto refresh"
            value={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.value)}
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="0">Off</MenuItem>
            <MenuItem value="1">Every 1 min</MenuItem>
            <MenuItem value="5">Every 5 min</MenuItem>
            <MenuItem value="10">Every 10 min</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={() => loadDashboard(false)}
            disabled={refreshing}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadOutlined />} onClick={exportCsv} disabled={loading} sx={{ textTransform: "none" }}>
            Export CSV
          </Button>
          <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} sx={{ textTransform: "none" }}>
            Print
          </Button>
        </Stack>
      </Paper>

      {errors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          Some dashboard metrics could not be loaded. Values unavailable from the API are shown as —. {errors.length > 1 ? `${errors.length} data requests reported an issue.` : errors[0]}
        </Alert>
      )}
      {(fullErrors.jobs || fullErrors.applications) && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          {[fullErrors.jobs && `Job list: ${fullErrors.jobs}`, fullErrors.applications && `Application list: ${fullErrors.applications}`]
            .filter(Boolean)
            .join(" · ")}
        </Alert>
      )}

      <SectionTitle>Overview</SectionTitle>
      {renderMetricGrid(overviewMetrics)}

      <SectionTitle>Application pipeline</SectionTitle>
      {renderMetricGrid(pipelineMetrics)}

      <SectionTitle>Insights</SectionTitle>
      {renderMetricGrid(insightMetrics)}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <ChartPanel title="Job Status Distribution" subtitle="Based on active and inactive job records">
            <PanelState
              loading={loading && jobCounts.total === null}
              empty={jobChartData.length === 0}
              emptyText="No job records available for distribution."
              render={() => <DonutChart data={jobChartData} legendPosition="bottom" />}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel title="Application Status Distribution" subtitle="Active applications only · Backend-supported statuses">
            <PanelState
              loading={loading && !statusCountsComplete}
              error={!statusCountsComplete ? "Complete status data could not be loaded. Check your Job Applications read permission." : ""}
              empty={applicationChartData.length === 0}
              emptyText="No active job applications available for distribution."
              render={() => <DonutChart data={applicationChartData} legendPosition="right" />}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel title="Application Pipeline" subtitle="Active applications by status · share of total">
            <PanelState
              loading={loading && !statusCountsComplete}
              error={!statusCountsComplete ? "Complete status data could not be loaded." : ""}
              empty={!activeApplications}
              emptyText="No active applications to show in the pipeline."
              render={() => <BarList items={funnelItems} />}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel
            title="Applications Over Time"
            subtitle={seriesSubtitle(applicationSeries.unit)}
            action={
              rangeReady && allApplications ? (
                <Chip size="small" label={`${sumPoints(applicationSeries.points)} total`} sx={{ fontWeight: 600 }} />
              ) : null
            }
          >
            <PanelState
              loading={appsPending}
              error={appsError || range.error}
              empty={applicationSeries.points.length === 0 || sumPoints(applicationSeries.points) === 0}
              emptyText="No applications received in this date range."
              render={() => <TrendChart id="apps-trend" points={applicationSeries.points} color="#7654B8" />}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel
            title="Jobs Over Time"
            subtitle={hasJobDates ? seriesSubtitle(jobSeries.unit) : "Based on job creation dates"}
            action={
              rangeReady && hasJobDates ? (
                <Chip size="small" label={`${sumPoints(jobSeries.points)} total`} sx={{ fontWeight: 600 }} />
              ) : null
            }
          >
            <PanelState
              loading={jobsPending}
              error={jobsError || range.error}
              empty={!hasJobDates || jobSeries.points.length === 0 || sumPoints(jobSeries.points) === 0}
              emptyText={
                hasJobDates
                  ? "No jobs created in this date range."
                  : "Job creation dates are not returned by the jobs API, so this chart can't be drawn yet."
              }
              render={() => <TrendChart id="jobs-trend" points={jobSeries.points} color="#2878C8" />}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel
            title="Jobs Breakdown"
            subtitle="All job records · top 8"
            action={
              <TextField
                select
                size="small"
                value={dimKey}
                onChange={(event) => setDimKey(event.target.value)}
                sx={{ minWidth: 130 }}
                aria-label="Breakdown by"
              >
                {JOB_DIMENSIONS.map((item) => (
                  <MenuItem key={item.key} value={item.key}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            }
          >
            <PanelState
              loading={jobsPending}
              error={jobsError}
              empty={dimensionItems.length === 0}
              emptyText="No job records available for this breakdown."
              render={() => <BarList items={dimensionItems} color="#2878C8" />}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel title="Top Jobs by Applications" subtitle={`Top 5 · ${rangeLabel}`}>
            <PanelState
              loading={appsPending}
              error={appsError || range.error}
              empty={topJobs.length === 0}
              emptyText="No applications received in this date range."
              render={() => <BarList items={topJobs} color="#7654B8" />}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel
            title="Pending Applications"
            subtitle="Waiting for action · oldest first"
            minHeight={320}
            action={
              allApplications ? (
                <Chip size="small" label={`${pendingApplications.length} pending`} sx={{ fontWeight: 600 }} />
              ) : null
            }
          >
            <PanelState
              loading={appsPending}
              error={appsError}
              empty={pendingApplications.length === 0}
              emptyText="No pending applications. You're all caught up."
              render={() => (
                <MiniTable
                  onRowClick={goApplications}
                  rows={pendingApplications.slice(0, 8)}
                  columns={[
                    { key: "applicant", label: "Applicant", render: (row) => row.applicantName || "-" },
                    { key: "job", label: "Job", render: (row) => row.jobTitle || (row.jobId != null ? `Job #${row.jobId}` : "-") },
                    { key: "applied", label: "Applied", render: (row) => fmtDate(row.appliedAt) },
                  ]}
                />
              )}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel title="Recent Applications" subtitle="Latest 8 applications" minHeight={320}>
            <PanelState
              loading={appsPending}
              error={appsError}
              empty={recentApplications.length === 0}
              emptyText="No applications yet."
              render={() => (
                <MiniTable
                  onRowClick={goApplications}
                  rows={recentApplications}
                  columns={[
                    { key: "applicant", label: "Applicant", render: (row) => row.applicantName || "-" },
                    { key: "job", label: "Job", render: (row) => row.jobTitle || (row.jobId != null ? `Job #${row.jobId}` : "-") },
                    { key: "applied", label: "Applied", render: (row) => fmtDate(row.appliedAt) },
                    { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
                  ]}
                />
              )}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel title="Recent Jobs" subtitle="Latest 8 jobs" minHeight={320}>
            <PanelState
              loading={jobsPending}
              error={jobsError}
              empty={recentJobs.length === 0}
              emptyText="No jobs created yet."
              render={() => (
                <MiniTable
                  onRowClick={goJobs}
                  rows={recentJobs}
                  columns={[
                    { key: "title", label: "Job Title", render: (row) => row.jobTitle || "-" },
                    { key: "country", label: "Country", render: (row) => row.countryName || "-" },
                    { key: "openings", label: "Openings", render: (row) => row.openings ?? "-" },
                    {
                      key: "status",
                      label: "Status",
                      render: (row) => (
                        <Chip
                          size="small"
                          label={row.active === false ? "Inactive" : "Active"}
                          sx={{
                            height: 22,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: alpha(row.active === false ? "#7B8794" : "#29965A", 0.12),
                            color: row.active === false ? "#7B8794" : "#29965A",
                          }}
                        />
                      ),
                    },
                  ]}
                />
              )}
            />
          </ChartPanel>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartPanel
            title="Jobs Needing Attention"
            subtitle="Active jobs with no applications, and inactive jobs"
            minHeight={320}
            action={
              allJobs ? (
                <Chip size="small" label={`${attentionRows.length} jobs`} sx={{ fontWeight: 600 }} />
              ) : null
            }
          >
            <PanelState
              loading={jobsPending || (appsPending && !allJobs)}
              error={jobsError}
              empty={attentionRows.length === 0}
              emptyText="Every active job has applications."
              render={() => (
                <MiniTable
                  onRowClick={goJobs}
                  rows={attentionRows.slice(0, 10)}
                  columns={[
                    { key: "title", label: "Job Title", render: (row) => row.jobTitle || "-" },
                    { key: "country", label: "Country", render: (row) => row.countryName || "-" },
                    {
                      key: "reason",
                      label: "Reason",
                      render: (row) => (
                        <Chip
                          size="small"
                          label={row.reason}
                          sx={{
                            height: 22,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: alpha(row.reason === "Inactive" ? "#7B8794" : "#E67E22", 0.12),
                            color: row.reason === "Inactive" ? "#7B8794" : "#E67E22",
                          }}
                        />
                      ),
                    },
                  ]}
                />
              )}
            />
          </ChartPanel>
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        {activeApplications !== null
          ? `Active application status totals: ${activeApplications.toLocaleString("en-IN")}. The Total Applications card includes inactive/deactivated records as returned by the backend admin endpoint.`
          : "Application status counts are based on the backend search endpoint, which returns active applications only."}
      </Typography>
    </Container>
  );
}
