import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { message } from "antd";
import { ArrowBack, CloudUpload, PersonAddAlt1 } from "@mui/icons-material";
import { createJobApplication, searchJobs } from "./JobService";
const EMPTY_FORM = {
  jobId: "",
  applicantName: "",
  email: "",
  phone: "",
  coverLetter: "",
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Unable to create the application.";

export default function ManualApplicationForm() {
  const navigate = useNavigate();
  const role = (sessionStorage.getItem("role") || "").toLowerCase();
  const authToken = sessionStorage.getItem("authToken");
  const isAuthenticated = Boolean(authToken);
  const canCreateApplication = isAuthenticated && role !== "branch";
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [resume, setResume] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/wayabroadadmin", { replace: true });
      return undefined;
    }
    if (!canCreateApplication) {
      navigate("/wayabroadadmin/admin/jobs/applications", { replace: true });
      return undefined;
    }

    let mounted = true;
    const loadJobs = async () => {
      setLoadingJobs(true);
      try {
        const response = await searchJobs({
          page: 0,
          size: 100,
          active: true,
          sortBy: "jobTitle",
          sortDir: "ASC",
        });
        const payload = response?.data ?? response;
        const list = asArray(payload?.data ?? payload);
        if (mounted) setJobs(list.filter((job) => job?.active !== false));
      } catch (loadError) {
        if (mounted) setError(getErrorMessage(loadError).replace("Unable to create the application.", "Unable to load active jobs."));
      } finally {
        if (mounted) setLoadingJobs(false);
      }
    };
    loadJobs();
    return () => { mounted = false; };
  }, [isAuthenticated, canCreateApplication, navigate]);

  const jobOptions = useMemo(
    () => jobs.map((job) => ({
      ...job,
      id: job.id ?? job.jobId,
      jobTitle: job.jobTitle ?? job.title ?? `Job #${job.id ?? job.jobId}`,
    })).filter((job) => job.id !== null && job.id !== undefined),
    [jobs]
  );

  const setField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0] || null;
    setResumeError("");
    if (!file) {
      setResume(null);
      return;
    }

    const extension = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "doc", "docx"].includes(extension)) {
      setResume(null);
      setResumeError("Only PDF, DOC, and DOCX resumes are allowed.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResume(null);
      setResumeError("Resume size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }
    setResume(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate("/wayabroadadmin", { replace: true });
      return;
    }
    if (!canCreateApplication) {
      navigate("/wayabroadadmin/admin/jobs/applications", { replace: true });
      return;
    }
    setError("");
    setResumeError("");

    if (!selectedJob?.id) {
      setError("Please select an active job.");
      return;
    }
    if (!form.applicantName.trim() || form.applicantName.trim().length > 150) {
      setError("Applicant name is required and must not exceed 150 characters.");
      return;
    }
    if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email.trim()) || form.email.trim().length > 150) {
      setError("Enter a valid email address (maximum 150 characters).");
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length > 20) {
      setError("Phone number is required and must not exceed 20 characters.");
      return;
    }
    if (!resume) {
      setResumeError("Resume file is required.");
      return;
    }

    const payload = {
      jobId: Number(selectedJob.id),
      applicantName: form.applicantName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      coverLetter: form.coverLetter,
    };
    const body = new FormData();
    body.append("application", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    body.append("resume", resume);

    setSaving(true);
    try {
      await createJobApplication(body);
      message.success("Application added successfully.");
      navigate("/wayabroadadmin/admin/jobs/applications");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !canCreateApplication) return null;

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/wayabroadadmin/admin/jobs/applications")}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" }, textTransform: "none" }}
        >
          Back to Applications
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Paper component="form" onSubmit={handleSubmit} elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={jobOptions}
              value={selectedJob}
              loading={loadingJobs}
              onChange={(_, value) => {
                setSelectedJob(value);
                setField("jobId", value?.id ? String(value.id) : "");
              }}
              getOptionLabel={(option) => option?.jobTitle || ""}
              isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Job *"
                  placeholder="Search active jobs"
                  required={!selectedJob}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingJobs ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={loadingJobs ? "Loading jobs..." : "No active jobs found"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Applicant Name *"
              value={form.applicantName}
              onChange={(event) => setField("applicantName", event.target.value)}
              fullWidth
              required
              inputProps={{ maxLength: 150 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Email *"
              type="email"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              fullWidth
              required
              inputProps={{ maxLength: 150 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Phone *"
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
              fullWidth
              required
              inputProps={{ maxLength: 20 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              fullWidth
              sx={{ height: 56, justifyContent: "flex-start", px: 2, textTransform: "none", overflow: "hidden" }}
            >
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {resume ? resume.name : "Upload Resume (PDF, DOC, DOCX) *"}
              </Box>
              <input hidden type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
            </Button>
            <Typography variant="caption" color={resumeError ? "error" : "text.secondary"}>
              {resumeError || "Maximum file size: 5 MB"}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Cover Letter"
              value={form.coverLetter}
              onChange={(event) => setField("coverLetter", event.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/wayabroadadmin/admin/jobs/applications")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <PersonAddAlt1 />}
            disabled={saving || loadingJobs || jobs.length === 0}
          >
            {saving ? "Saving..." : "Add Application"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
