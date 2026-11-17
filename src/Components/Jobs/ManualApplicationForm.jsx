
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
import {
  ArrowBack,
  CloudUpload,
  PersonAddAlt1,
} from "@mui/icons-material";

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

  // =====================================================
  // EXISTING AUTHENTICATION AND JOB LOADING LOGIC
  // =====================================================

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/wayabroadadmin", { replace: true });
      return undefined;
    }

    if (!canCreateApplication) {
      navigate("/wayabroadadmin/admin/jobs/applications", {
        replace: true,
      });
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

        if (mounted) {
          setJobs(list.filter((job) => job?.active !== false));
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            getErrorMessage(loadError).replace(
              "Unable to create the application.",
              "Unable to load active jobs."
            )
          );
        }
      } finally {
        if (mounted) {
          setLoadingJobs(false);
        }
      }
    };

    loadJobs();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, canCreateApplication, navigate]);

  // =====================================================
  // EXISTING JOB OPTIONS
  // =====================================================

  const jobOptions = useMemo(
    () =>
      jobs
        .map((job) => ({
          ...job,
          id: job.id ?? job.jobId,
          jobTitle:
            job.jobTitle ??
            job.title ??
            `Job #${job.id ?? job.jobId}`,
        }))
        .filter(
          (job) => job.id !== null && job.id !== undefined
        ),
    [jobs]
  );

  const setField = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // EXISTING RESUME VALIDATION
  // =====================================================

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
      setResumeError(
        "Only PDF, DOC, and DOCX resumes are allowed."
      );
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

  // =====================================================
  // EXISTING FORM SUBMISSION LOGIC
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/wayabroadadmin", { replace: true });
      return;
    }

    if (!canCreateApplication) {
      navigate("/wayabroadadmin/admin/jobs/applications", {
        replace: true,
      });
      return;
    }

    setError("");
    setResumeError("");

    if (!selectedJob?.id) {
      setError("Please select an active job.");
      return;
    }

    if (
      !form.applicantName.trim() ||
      form.applicantName.trim().length > 150
    ) {
      setError(
        "Applicant name is required and must not exceed 150 characters."
      );
      return;
    }

    if (
      !/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
        form.email.trim()
      ) ||
      form.email.trim().length > 150
    ) {
      setError(
        "Enter a valid email address (maximum 150 characters)."
      );
      return;
    }

    if (
      !form.phone.trim() ||
      form.phone.trim().length > 20
    ) {
      setError(
        "Phone number is required and must not exceed 20 characters."
      );
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

    body.append(
      "application",
      new Blob([JSON.stringify(payload)], {
        type: "application/json",
      })
    );

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

  if (!isAuthenticated || !canCreateApplication) {
    return null;
  }

  // =====================================================
  // COMPACT MINIMAL UI STYLES
  // =====================================================

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      minHeight: 40,
      borderRadius: "6px",
      backgroundColor: "#FFFFFF",

      "& fieldset": {
        borderColor: "#D7DEE8",
      },

      "&:hover fieldset": {
        borderColor: "#94A3B8",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#64748B",
        borderWidth: "1px",
      },
    },

    "& .MuiInputLabel-root": {
      fontSize: "13px",
      color: "#64748B",

      "&.Mui-focused": {
        color: "#475569",
      },
    },

    "& .MuiInputBase-input": {
      fontSize: "13px",
      paddingTop: "9px",
      paddingBottom: "9px",
    },

    "& .MuiInputBase-input::placeholder": {
      fontSize: "12px",
      opacity: 0.8,
    },
  };

  const sectionTitleStyles = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
    mb: 1.5,
  };

  const sectionDividerStyles = {
    borderTop: "1px solid #EEF1F5",
    my: 2,
  };

  // =====================================================
  // REDESIGNED UI
  // =====================================================

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        pb: 3,
      }}
    >
      {/* PAGE HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: "19px", sm: "21px" },
              fontWeight: 600,
              color: "#1E293B",
              letterSpacing: "-0.3px",
            }}
          >
            Add New Application
          </Typography>

          <Typography
            sx={{
              fontSize: "12px",
              color: "#64748B",
              mt: 0.3,
            }}
          >
            Create and manage a new applicant record.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBack />}
          onClick={() =>
            navigate("/wayabroadadmin/admin/jobs/applications")
          }
          sx={{
            textTransform: "none",
            fontSize: "12px",
            fontWeight: 500,
            color: "#475569",
            borderColor: "#D7DEE8",
            borderRadius: "6px",
            px: 1.5,
            py: 0.7,
            whiteSpace: "nowrap",

            "&:hover": {
              borderColor: "#94A3B8",
              backgroundColor: "#F8FAFC",
            },
          }}
        >
          Back to Applications
        </Button>
      </Stack>

      {/* GLOBAL ERROR */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{
            maxWidth: "900px",
            mx: "auto",
            mb: 2,
            borderRadius: "6px",
            fontSize: "12px",
          }}
        >
          {error}
        </Alert>
      )}

      {/* MAIN COMPACT FORM */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: "900px", // CHANGED: Compact form width
          mx: "auto", // CHANGED: Center alignment
          border: "1px solid #E2E8F0",
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* FORM CONTENT */}
        <Box
          sx={{
            p: {
              xs: 1.75,
              sm: 2,
              md: 2.5,
            },
          }}
        >
          {/* SECTION 1: APPLICATION INFORMATION */}
          <Box>
            <Typography sx={sectionTitleStyles}>
              Application Information
            </Typography>

            <Autocomplete
              fullWidth
              size="small"
              options={jobOptions}
              value={selectedJob}
              loading={loadingJobs}
              onChange={(_, value) => {
                setSelectedJob(value);

                setField(
                  "jobId",
                  value?.id ? String(value.id) : ""
                );
              }}
              getOptionLabel={(option) =>
                option?.jobTitle || ""
              }
              isOptionEqualToValue={(option, value) =>
                String(option.id) === String(value.id)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Select Job *"
                  placeholder="Search active jobs"
                  required={!selectedJob}
                  sx={inputStyles}
                  InputProps={{
                    ...params.InputProps,

                    endAdornment: (
                      <>
                        {loadingJobs && (
                          <CircularProgress
                            color="inherit"
                            size={16}
                          />
                        )}

                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={
                loadingJobs
                  ? "Loading jobs..."
                  : "No active jobs found"
              }
            />
          </Box>

          <Box sx={sectionDividerStyles} />

          {/* SECTION 2: APPLICANT DETAILS */}
          <Box>
            <Typography sx={sectionTitleStyles}>
              Applicant Details
            </Typography>

            <Grid container spacing={1.5}>
              {/* APPLICANT NAME */}
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  label="Applicant Name *"
                  placeholder="Enter applicant full name"
                  value={form.applicantName}
                  onChange={(event) =>
                    setField(
                      "applicantName",
                      event.target.value
                    )
                  }
                  fullWidth
                  required
                  inputProps={{ maxLength: 150 }}
                  sx={inputStyles}
                />
              </Grid>

              {/* EMAIL */}
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  label="Email *"
                  placeholder="Enter email address"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setField("email", event.target.value)
                  }
                  fullWidth
                  required
                  inputProps={{ maxLength: 150 }}
                  sx={inputStyles}
                />
              </Grid>

              {/* PHONE */}
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  label="Phone *"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(event) =>
                    setField("phone", event.target.value)
                  }
                  fullWidth
                  required
                  inputProps={{ maxLength: 20 }}
                  sx={inputStyles}
                />
              </Grid>

              {/* RESUME UPLOAD */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    minHeight: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #D7DEE8",
                    borderRadius: "6px",
                    px: 1.25,
                    gap: 1,
                    backgroundColor: "#FFFFFF",
                    transition: "border-color 0.2s ease",

                    "&:hover": {
                      borderColor: "#94A3B8",
                    },
                  }}
                >
                  <CloudUpload
                    sx={{
                      color: "#64748B",
                      fontSize: 19,
                      flexShrink: 0,
                    }}
                  />

                  <Typography
                    title={resume?.name || ""}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: "11px",
                      color: resume ? "#334155" : "#64748B",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {resume
                      ? resume.name
                      : "Upload Resume *"}
                  </Typography>

                  <Button
                    component="label"
                    size="small"
                    variant="outlined"
                    sx={{
                      flexShrink: 0,
                      minWidth: "auto",
                      px: 1,
                      py: 0.35,
                      fontSize: "10px",
                      fontWeight: 500,
                      textTransform: "none",
                      borderColor: "#D7DEE8",
                      color: "#475569",
                      borderRadius: "5px",

                      "&:hover": {
                        borderColor: "#94A3B8",
                        backgroundColor: "#F8FAFC",
                      },
                    }}
                  >
                    {resume ? "Change" : "Choose File"}

                    <input
                      hidden
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeChange}
                    />
                  </Button>
                </Box>

                <Typography
                  sx={{
                    fontSize: "10px",
                    color: resumeError
                      ? "#DC2626"
                      : "#94A3B8",
                    mt: 0.5,
                    lineHeight: 1.3,
                  }}
                >
                  {resumeError ||
                    "PDF, DOC, DOCX · Maximum 5 MB"}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={sectionDividerStyles} />

          {/* SECTION 3: COVER LETTER */}
          <Box>
            <Typography sx={sectionTitleStyles}>
              Cover Letter

              <Typography
                component="span"
                sx={{
                  ml: 0.75,
                  fontSize: "10px",
                  fontWeight: 400,
                  color: "#94A3B8",
                }}
              >
                (Optional)
              </Typography>
            </Typography>

            <TextField
              size="small"
              placeholder="Write a cover letter or additional applicant information..."
              value={form.coverLetter}
              onChange={(event) =>
                setField("coverLetter", event.target.value)
              }
              fullWidth
              multiline
              minRows={2}
              sx={{
                ...inputStyles,

                "& .MuiInputBase-root": {
                  alignItems: "flex-start",
                  py: 0.5,
                },

                "& .MuiInputBase-input": {
                  fontSize: "12px",
                  lineHeight: 1.5,
                },
              }}
            />
          </Box>
        </Box>

        {/* COMPACT FOOTER */}
        <Box
          sx={{
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#FAFBFC",
            px: {
              xs: 1.75,
              sm: 2,
              md: 2.5,
            },
            py: 1.25,
          }}
        >
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-end"
            spacing={1}
          >
            {/* CANCEL */}
            <Button
              variant="outlined"
              size="small"
              onClick={() =>
                navigate(
                  "/wayabroadadmin/admin/jobs/applications"
                )
              }
              disabled={saving}
              sx={{
                minWidth: { xs: "100%", sm: 90 },
                textTransform: "none",
                fontSize: "12px",
                fontWeight: 500,
                color: "#475569",
                borderColor: "#D7DEE8",
                borderRadius: "6px",
                px: 2,

                "&:hover": {
                  borderColor: "#94A3B8",
                  backgroundColor: "#F1F5F9",
                },
              }}
            >
              Cancel
            </Button>

            {/* SUBMIT */}
            <Button
              type="submit"
              variant="contained"
              size="small"
              startIcon={
                saving ? (
                  <CircularProgress
                    size={15}
                    color="inherit"
                  />
                ) : (
                  <PersonAddAlt1 sx={{ fontSize: 17 }} />
                )
              }
              disabled={
                saving ||
                loadingJobs ||
                jobs.length === 0
              }
              sx={{
                minWidth: { xs: "100%", sm: 145 },
                textTransform: "none",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                px: 1.75,
                py: 0.65,
                backgroundColor: "#1976D2",
                boxShadow: "none",

                "&:hover": {
                  backgroundColor: "#1565C0",
                  boxShadow: "none",
                },

                "&.Mui-disabled": {
                  backgroundColor: "#CBD5E1",
                  color: "#FFFFFF",
                },
              }}
            >
              {saving ? "Saving..." : "Add Application"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
