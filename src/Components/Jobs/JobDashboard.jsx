import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import { ResponsivePie } from "@nivo/pie";
import { getJobApplications, searchJobApplications, searchJobs } from "./JobService";

const APPLICATION_STATUSES = [
  { value: "PENDING", label: "Pending", color: "#D49A16" },
  { value: "SHORTLISTED", label: "Shortlisted", color: "#2878C8" },
  { value: "INTERESTED", label: "Interested", color: "#17A2B8" },
  { value: "PROCESS_1", label: "Process 1", color: "#7654B8" },
  { value: "PROCESS_2", label: "Process 2", color: "#9B59B6" },
  { value: "APPLY_LATER", label: "Apply Later", color: "#E67E22" },
  { value: "SELECTED", label: "Selected", color: "#29965A" },
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

function getPageTotal(response) {
  const payload = response?.data ?? response;
  const page = payload?.data ?? payload;
  const value = page?.totalElements;
  if (value === null || value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

function getErrorText(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to load this dashboard metric."
  );
}

function MetricCard({ title, value, caption, icon, color }) {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
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
            <Typography
              variant="h4"
              sx={{ fontSize: { xs: 25, sm: 28 }, fontWeight: 750, lineHeight: 1.25, color: "#17212b" }}
            >
              {value === null || value === undefined ? "—" : Number(value).toLocaleString("en-IN")}
            </Typography>
          </Box>
        </Stack>
        {caption ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.2, minHeight: 18 }}>
            {caption}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        minHeight: 390,
        border: "1px solid #e5eaf0",
        borderRadius: 3,
        p: { xs: 1.75, sm: 2.5 },
        bgcolor: "#fff",
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700, color: "#17212b" }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}

function NoChartData({ children = "No data available yet." }) {
  return (
    <Box
      sx={{
        minHeight: 300,
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

export default function JobDashboard() {
  const [loading, setLoading] = useState(true);
  const [jobCounts, setJobCounts] = useState({ total: null, active: null, inactive: null });
  const [totalApplications, setTotalApplications] = useState(null);
  const [applicationStatusCounts, setApplicationStatusCounts] = useState({});
  const [statusCountsComplete, setStatusCountsComplete] = useState(false);
  const [errors, setErrors] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    const jobParams = { page: 0, size: 1, sortBy: "id", sortDir: "DESC" };
    const requests = [
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

    const results = await Promise.allSettled(requests);
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
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  const activeApplications = statusCountsComplete
    ? APPLICATION_STATUSES.reduce((sum, status) => sum + (applicationStatusCounts[status.value] || 0), 0)
    : null;

  const metrics = [
    {
      title: "Total Jobs",
      value: jobCounts.total,
      icon: <WorkOutlineRoundedIcon />,
      color: "#2878C8",
    },
    {
      title: "Active Jobs",
      value: jobCounts.active,
      icon: <CheckCircleOutlineRoundedIcon />,
      color: "#29965A",
    },
    {
      title: "Inactive Jobs",
      value: jobCounts.inactive,
      icon: <PauseCircleOutlineRoundedIcon />,
      color: "#7B8794",
    },
    {
      title: "Total Applications",
      value: totalApplications,
      icon: <Groups2RoundedIcon />,
      color: "#7654B8",
    },
    {
      title: "Pending Applications",
      value: applicationStatusCounts.PENDING,
      icon: <PendingActionsRoundedIcon />,
      color: "#D49A16",
    },
    {
      title: "Shortlisted Applications",
      value: applicationStatusCounts.SHORTLISTED,
      icon: <PlaylistAddCheckRoundedIcon />,
      color: "#17A2B8",
    },
  ];

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
      
      {errors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          Some dashboard metrics could not be loaded. Values unavailable from the API are shown as —. {errors.length > 1 ? `${errors.length} data requests reported an issue.` : errors[0]}
        </Alert>
      )}

      {loading && jobCounts.total === null && totalApplications === null ? (
        <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Loading job dashboard...</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {metrics.map((metric) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={metric.title}>
                <MetricCard {...metric} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <ChartPanel title="Job Status Distribution" subtitle="Based on active and inactive job records">
                {loading && jobCounts.total === null ? (
                  <NoChartData>Loading job status...</NoChartData>
                ) : jobChartData.length > 0 ? (
                  <Box sx={{ height: 320 }}>
                    <ResponsivePie
                      data={jobChartData}
                      margin={{ top: 18, right: 18, bottom: 68, left: 18 }}
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
                      legends={[{
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
                      }]}
                    />
                  </Box>
                ) : (
                  <NoChartData>No job records available for distribution.</NoChartData>
                )}
              </ChartPanel>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartPanel title="Application Status Distribution" subtitle="Active applications only · Backend-supported statuses">
                {loading && !statusCountsComplete ? (
                  <NoChartData>Loading application status distribution...</NoChartData>
                ) : !statusCountsComplete ? (
                  <NoChartData>Complete status data could not be loaded. Check your Job Applications read permission.</NoChartData>
                ) : applicationChartData.length > 0 ? (
                  <Box sx={{ height: 320 }}>
                    <ResponsivePie
                      data={applicationChartData}
                      margin={{ top: 18, right: 128, bottom: 18, left: 18 }}
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
                      legends={[{
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
                      }]}
                    />
                  </Box>
                ) : (
                  <NoChartData>No active job applications available for distribution.</NoChartData>
                )}
              </ChartPanel>
            </Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            {activeApplications !== null
              ? `Active application status totals: ${activeApplications.toLocaleString("en-IN")}. The Total Applications card includes inactive/deactivated records as returned by the backend admin endpoint.`
              : "Application status counts are based on the backend search endpoint, which returns active applications only."}
          </Typography>
        </>
      )}
    </Container>
  );
}
