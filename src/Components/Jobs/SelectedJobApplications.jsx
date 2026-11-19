import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Input, Table, Tag, message } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { ThumbUpAltRounded } from "@mui/icons-material";
import { getJobApplicationById, searchJobApplications, searchJobs } from "./JobService";
import {
  Field,
  OverviewCard,
  digitsOnly,
  formatDate,
  formatDateTime,
  getErrorMessage,
  getInquiryCountry,
  getInquirySector,
  getJobCountry,
  getJobSector,
  getPageData,
  getStatusColor,
  getStatusLabel,
  getTotal,
  normalize,
  show,
} from "./JobApplications";

/*
 * Job Applications = candidates whose Job Inquiry status is SELECTED.
 * Data comes from the existing GET /job-applications/admin/search endpoint with
 * status=SELECTED, so no backend change is needed. Country / sector are looked up
 * from the jobs list exactly like the Job Inquiry page does.
 */
const SELECTED_STATUS = "SELECTED";
const SERVER_PAGE_SIZE = 100; // backend maximum

const EMPTY_FILTERS = {
  jobId: "",
  country: "",
  sector: "",
  applicantName: "",
  applicantEmail: "",
  phone: "",
};

// Backend search understands jobId, status and applicantEmail only; the rest is matched here.
const usesClientFilters = (f) =>
  Boolean(f.applicantName.trim() || digitsOnly(f.phone) || f.country || f.sector);

const matchesClientFilters = (item, f, jobMeta) => {
  const name = normalize(f.applicantName);
  if (name && !normalize(item?.applicantName).includes(name)) return false;
  const phone = digitsOnly(f.phone);
  if (phone && !digitsOnly(item?.phone).includes(phone)) return false;
  if (f.country && normalize(getInquiryCountry(item, jobMeta)) !== normalize(f.country)) return false;
  if (f.sector && normalize(getInquirySector(item, jobMeta)) !== normalize(f.sector)) return false;
  return true;
};

export default function SelectedJobApplications() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTotal, setSelectedTotal] = useState(null);
  const [totalLoading, setTotalLoading] = useState(true);
  const [jobMeta, setJobMeta] = useState({});
  const [moreOpen, setMoreOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const requestIdRef = useRef(0);
  const clientCacheRef = useRef(null);
  const detailRequestRef = useRef(0);
  const totalRequestRef = useRef(0);
  const jobMetaRef = useRef({});

  const loadApplications = useCallback(async (nextPage, nextSize, nextFilters, reuse = false) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const serverParams = {
        jobId: nextFilters.jobId,
        status: SELECTED_STATUS,
        applicantEmail: nextFilters.applicantEmail.trim(),
      };

      if (usesClientFilters(nextFilters)) {
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
          matches = combined.filter((item) => matchesClientFilters(item, nextFilters, jobMetaRef.current));
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
      console.error("Failed to fetch selected candidates:", e);
      setRows([]);
      setTotal(0);
      setError(getErrorMessage(e, "Failed to fetch selected candidates."));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Card count describes every selected candidate, regardless of the current filters.
  const loadSelectedTotal = useCallback(() => {
    const requestId = ++totalRequestRef.current;
    setTotalLoading(true);
    searchJobApplications({ status: SELECTED_STATUS, page: 0, size: 1 })
      .then((response) => {
        if (requestId === totalRequestRef.current) setSelectedTotal(getTotal(response));
      })
      .catch((e) => {
        console.error("Failed to load selected count:", e);
        if (requestId === totalRequestRef.current) setSelectedTotal(null);
      })
      .finally(() => {
        if (requestId === totalRequestRef.current) setTotalLoading(false);
      });
  }, []);

  // jobId -> { country, sector }, same lookup the Job Inquiry page uses.
  const loadJobMeta = useCallback(async () => {
    try {
      const response = await searchJobs({ page: 0, size: 100, sortBy: "jobTitle", sortDir: "ASC" });
      const next = {};
      getPageData(response).content.forEach((job) => {
        const id = job?.id ?? job?.jobId;
        if (id === null || id === undefined) return;
        next[String(id)] = { country: getJobCountry(job), sector: getJobSector(job) };
      });
      jobMetaRef.current = next;
      setJobMeta(next);
    } catch (e) {
      console.error("Failed to load job country/sector:", e);
    }
  }, []);

  useEffect(() => {
    loadApplications(0, 10, EMPTY_FILTERS);
    loadSelectedTotal();
    loadJobMeta();
  }, [loadApplications, loadSelectedTotal, loadJobMeta]);

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

  const updateFilter = (name, value) => setFilters((previous) => ({ ...previous, [name]: value }));
  const search = () => loadApplications(0, pageSize, filters);
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadApplications(0, pageSize, EMPTY_FILTERS);
  };
  const refresh = () => {
    clientCacheRef.current = null;
    loadApplications(page, pageSize, filters);
    loadSelectedTotal();
    loadJobMeta();
  };

  const hasFilters = Boolean(filters.jobId || filters.applicantEmail.trim() || usesClientFilters(filters));

  const openDetails = async (record) => {
    const requestId = ++detailRequestRef.current;
    setSelected(record);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await getJobApplicationById(record.id);
      if (requestId === detailRequestRef.current) setSelected(response?.data ?? response ?? record);
    } catch (e) {
      console.error("Failed to load candidate details:", e);
      if (requestId === detailRequestRef.current) {
        message.error(getErrorMessage(e, "Could not load candidate details."));
      }
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  };

  const text = (value) => value || "-";
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 56, responsive: ["md"] },
    { title: "Candidate", dataIndex: "applicantName", key: "applicantName", ellipsis: true, render: text },
    { title: "Email", dataIndex: "email", key: "email", ellipsis: true, responsive: ["md"], render: text },
    { title: "Phone", dataIndex: "phone", key: "phone", width: 125, ellipsis: true, responsive: ["lg"], render: text },
    {
      title: "Job", dataIndex: "jobTitle", key: "jobTitle", ellipsis: true,
      render: (value, record) => value || (record.jobId != null ? `Job #${record.jobId}` : "-"),
    },
    {
      title: "Country", key: "country", width: 110, ellipsis: true, responsive: ["lg"],
      render: (_, record) => text(getInquiryCountry(record, jobMeta)),
    },
    {
      title: "Sector", key: "sector", width: 120, ellipsis: true, responsive: ["lg"],
      render: (_, record) => text(getInquirySector(record, jobMeta)),
    },
    { title: "Applied", dataIndex: "appliedAt", key: "appliedAt", width: 110, responsive: ["lg"], render: formatDate },
    {
      title: "Resume", dataIndex: "resumeUrl", key: "resumeUrl", width: 80, responsive: ["xl"],
      render: (url) => url
        ? <a href={url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>View</a>
        : "-",
    },
    {
      title: "Status", dataIndex: "status", key: "status", width: 95,
      render: (status) => (
        <Tag style={{ marginInlineEnd: 0 }} color={getStatusColor(status || SELECTED_STATUS)}>
          {getStatusLabel(status || SELECTED_STATUS)}
        </Tag>
      ),
    },
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(4, minmax(0, 1fr))", xl: "repeat(8, minmax(0, 1fr))" },
          gap: 1,
          mb: 1.25,
        }}
      >
        <OverviewCard
          title="Selected Candidates"
          value={selectedTotal}
          loading={totalLoading}
          color="#29965A"
          icon={<ThumbUpAltRounded />}
        />
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
          label="Country"
          value={filters.country}
          onChange={(event) => updateFilter("country", event.target.value)}
          sx={{ flex: "1 1 140px", maxWidth: { sm: 170 }, minWidth: 130 }}
        >
          <MenuItem value="">All</MenuItem>
          {countryOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
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
            placeholder="Candidate email"
            allowClear
            value={filters.applicantEmail}
            onChange={(event) => updateFilter("applicantEmail", event.target.value)}
            onPressEnter={search}
            style={{ width: "100%", height: 40 }}
          />
        </Box>
        <Box sx={{ display: { xs: moreOpen ? "contents" : "none", sm: "contents" } }}>
          <TextField
            size="small"
            label="Candidate name"
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
        <Button
          variant="outlined"
          startIcon={<ReloadOutlined />}
          onClick={refresh}
          disabled={loading}
          sx={{ height: 40, textTransform: "none", whiteSpace: "nowrap", ml: { md: "auto" } }}
        >
          Refresh
        </Button>
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
          locale={{ emptyText: "No selected candidates found." }}
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
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={fullScreen}
        scroll="paper"
      >
        <DialogTitle sx={{ py: 1.25 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            <Typography component="span" sx={{ fontSize: 17, fontWeight: 700, minWidth: 0, flex: 1, wordBreak: "break-word" }}>
              {selected?.applicantName || (selected?.id != null ? `Candidate #${selected.id}` : "Candidate")}
            </Typography>
            {selected && (
              <Tag style={{ marginInlineEnd: 0 }} color={getStatusColor(selected.status || SELECTED_STATUS)}>
                {getStatusLabel(selected.status || SELECTED_STATUS)}
              </Tag>
            )}
          </Stack>
        </DialogTitle>
        {detailLoading && <LinearProgress sx={{ height: 2 }} />}
        <DialogContent dividers sx={{ py: 1.5 }}>
          {!selected ? (
            <Typography variant="body2">No candidate details available.</Typography>
          ) : (
            <Box sx={detailGrid}>
              <Field label="Inquiry ID">{show(selected.id)}</Field>
              <Field label="Job">
                {selected.jobTitle || (selected.jobId != null ? `Job #${selected.jobId}` : "-")}
              </Field>
              <Field label="Country">{show(getInquiryCountry(selected, jobMeta))}</Field>
              <Field label="Sector">{show(getInquirySector(selected, jobMeta))}</Field>
              <Field label="Candidate">{show(selected.applicantName)}</Field>
              <Field label="Applied">{formatDateTime(selected.appliedAt)}</Field>
              <Field label="Email">{show(selected.email)}</Field>
              <Field label="Phone">{show(selected.phone)}</Field>
              <Field label="Resume">
                {selected.resumeUrl
                  ? <a href={selected.resumeUrl} target="_blank" rel="noreferrer">Open resume</a>
                  : "-"}
              </Field>
              <Field label="Active">{selected.active === false ? "No" : "Yes"}</Field>
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
          <Button onClick={() => setDetailOpen(false)} sx={{ textTransform: "none" }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
