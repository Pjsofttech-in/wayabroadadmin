import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert, Autocomplete, Box, Button, CircularProgress, FormControlLabel, Grid,
  MenuItem, Paper, Stack, Switch, TextField, Typography,
} from "@mui/material";
import { message } from "antd";
import { createJob, getJobById, getJobSettings, updateJob } from "./JobService";

const EMPTY_FORM = {
  jobTitle: "",
  educationId: "",
  sectorId: "",
  jobRoleId: "",
  skills: [],
  openings: "1",
  countryId: "",
  locationId: "",
  workTypeId: "",
  experienceLevel: "",
  salary: "",
  currencyId: "",
  jobTypeId: "",
  description: "",
  active: true,
};

const SETTING_TYPES = [
  "education", "sector", "role", "currency", "jobType",
  "location", "country", "workType",
];

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const idString = (value) =>
  value === null || value === undefined ? "" : String(value);

const getName = (item) =>
  item?.name ??
  item?.educationName ??
  item?.sectorName ??
  item?.jobRoleName ??
  item?.roleName ??
  item?.location ??
  item?.locationName ??
  item?.currencyName ??
  item?.jobTypeName ??
  item?.countryName ??
  item?.workTypeName ??
  "";

const isActive = (item) => item?.active !== false;

const getCountryId = (location) =>
  location?.countryId ?? location?.country?.id ?? location?.country?.countryId ?? "";

const errorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

export default function JobForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("editId");
  const isEditing = Boolean(editId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [settings, setSettings] = useState({
    education: [], sector: [], role: [], currency: [],
    jobType: [], location: [], country: [], workType: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadForm = async () => {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.all(
          SETTING_TYPES.map((type) => getJobSettings(type))
        );
        if (!mounted) return;

        const loadedSettings = Object.fromEntries(
          SETTING_TYPES.map((type, index) => [type, asArray(results[index])])
        );
        setSettings(loadedSettings);

        if (isEditing) {
          const job = await getJobById(editId);
          if (!mounted) return;

          const selectedLocation = loadedSettings.location.find(
            (location) => String(location.id) === String(job.locationId)
          );
          const skills = Array.isArray(job.skills)
            ? job.skills
            : typeof job.skill === "string"
              ? job.skill.split(",").map((skill) => skill.trim()).filter(Boolean)
              : [];

          setForm({
            ...EMPTY_FORM,
            jobTitle: job.jobTitle ?? "",
            educationId: idString(job.educationId),
            sectorId: idString(job.sectorId),
            jobRoleId: idString(job.jobRoleId),
            skills,
            openings: idString(job.openings ?? 1),
            countryId: idString(job.countryId ?? getCountryId(selectedLocation)),
            locationId: idString(job.locationId),
            workTypeId: idString(job.workTypeId),
            experienceLevel: job.experienceLevel ?? "",
            salary: idString(job.salary),
            currencyId: idString(job.currencyId),
            jobTypeId: idString(job.jobTypeId),
            description: job.description ?? "",
            active: job.active !== false,
          });
        }
      } catch (loadError) {
        console.error("Failed to load Create Job data:", loadError);
        if (mounted) setError(errorMessage(loadError, "Unable to load Job Settings."));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadForm();
    return () => { mounted = false; };
  }, [editId, isEditing]);

  // Education and Sector remain independent in the UI as requested.
  // Job Role is filtered by Sector because the backend validates that relationship.
  const roles = useMemo(
    () => settings.role.filter((role) => {
      const roleSectorId = role?.sectorId ?? role?.sector?.id ?? role?.sector?.sectorId;
      return !form.sectorId || String(roleSectorId ?? "") === String(form.sectorId);
    }),
    [settings.role, form.sectorId]
  );

  const locations = useMemo(
    () => settings.location.filter((location) => {
      const countryId = getCountryId(location);
      return !form.countryId || String(countryId) === String(form.countryId);
    }),
    [settings.location, form.countryId]
  );

  const activeCountries = useMemo(
    () => settings.country.filter(isActive),
    [settings.country]
  );

  const setField = (field, value) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const handleCountryChange = (countryId) => {
    setForm((previous) => ({ ...previous, countryId, locationId: "" }));
  };

  const handleSkillsChange = (_, values) => {
    const skills = [...new Set(
      values
        .map((value) => typeof value === "string" ? value.trim() : getName(value).trim())
        .filter(Boolean)
    )];
    setField("skills", skills);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const requiredFields = [
      "jobTitle", "educationId", "sectorId", "jobRoleId", "openings",
      "countryId", "locationId", "workTypeId", "experienceLevel",
      "salary", "currencyId", "jobTypeId",
    ];

    if (requiredFields.some((field) => String(form[field] ?? "").trim() === "") ||
        form.skills.length === 0) {
      setError("Complete all required fields and add at least one skill.");
      return;
    }

    const numericIds = [
      "educationId", "sectorId", "jobRoleId", "locationId",
      "workTypeId", "currencyId", "jobTypeId",
    ];
    if (numericIds.some((field) => !Number.isInteger(Number(form[field])) || Number(form[field]) <= 0)) {
      setError("One or more selected Job Settings are invalid. Refresh Job Settings and select valid options.");
      return;
    }

    if (form.experienceLevel.trim().length > 100) {
      setError("Experience Level must be 100 characters or fewer.");
      return;
    }

    const openings = Number(form.openings);
    const salary = Number(form.salary);
    if (!Number.isInteger(openings) || openings <= 0) {
      setError("Openings must be a whole number greater than zero.");
      return;
    }
    if (!Number.isFinite(salary) || salary < 0) {
      setError("Salary must be a valid non-negative number.");
      return;
    }

    // Backend DTO accepts locationId (not countryId); Country is derived from Location.
    const payload = {
      jobTitle: form.jobTitle.trim(),
      educationId: Number(form.educationId),
      sectorId: Number(form.sectorId),
      jobRoleId: Number(form.jobRoleId),
      skills: form.skills.map((skill) => skill.trim()).filter(Boolean),
      openings,
      locationId: Number(form.locationId),
      salary,
      currencyId: Number(form.currencyId),
      jobTypeId: Number(form.jobTypeId),
      workTypeId: Number(form.workTypeId),
      experienceLevel: form.experienceLevel.trim(),
      description: form.description.trim(),
      active: Boolean(form.active),
    };

    setSaving(true);
    try {
      if (isEditing) await updateJob(editId, payload);
      else await createJob(payload);
      message.success(isEditing ? "Job updated successfully." : "Job created successfully.");
      navigate("/wayabroadadmin/admin/jobs/list");
    } catch (saveError) {
      console.error("Job save failed:", saveError);
      const messageText = errorMessage(saveError, "Unable to save job.");
      setError(messageText);
      message.error(messageText);
    } finally {
      setSaving(false);
    }
  };

  const renderSettingSelect = (field, label, items, disabled = false) => (
    <TextField
      select fullWidth required label={label} value={form[field]}
      disabled={loading || saving || disabled}
      onChange={(event) => setField(field, event.target.value)}
    >
      <MenuItem value="">Select {label}</MenuItem>
      {items.map((item) => (
        <MenuItem
          key={item.id}
          value={idString(item.id)}
          disabled={!isActive(item) || item.id == null}
        >
          {getName(item) || `#${item.id}`}
          {!isActive(item) ? " (Inactive)" : ""}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: "#183b56" }}>
        {isEditing ? "Edit Job" : "Create Job"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={1}
          sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth required label="Job Title" value={form.jobTitle}
                onChange={(event) => setField("jobTitle", event.target.value)}
                inputProps={{ maxLength: 255 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple freeSolo options={[]} value={form.skills}
                onChange={handleSkillsChange} disabled={saving}
                renderInput={(params) => (
                  <TextField
                    {...params} required label="Skills"
                    placeholder="Type a skill and press Enter"
                    helperText="Add one or more skills. The backend accepts a list of strings."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              {renderSettingSelect("educationId", "Education", settings.education)}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderSettingSelect("sectorId", "Sector", settings.sector)}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderSettingSelect("jobRoleId", "Job Role", roles, !form.sectorId)}
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select fullWidth required label="Country" value={form.countryId}
                disabled={saving || activeCountries.length === 0}
                onChange={(event) => handleCountryChange(event.target.value)}
              >
                <MenuItem value="">Select Country</MenuItem>
                {activeCountries.map((country) => (
                  <MenuItem key={country.id} value={idString(country.id)}>
                    {getName(country) || `#${country.id}`}
                  </MenuItem>
                ))}
              </TextField>
              {activeCountries.length === 0 && (
                <Typography variant="caption" color="error">
                  Add an active Country in Job Settings first.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              {renderSettingSelect("locationId", "Location", locations, !form.countryId)}
              {form.countryId && locations.length === 0 && (
                <Typography variant="caption" color="error">
                  No Location is configured for this Country.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              {renderSettingSelect("workTypeId", "Work Type", settings.workType)}
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth required label="Level of Experience" value={form.experienceLevel}
                onChange={(event) => setField("experienceLevel", event.target.value)}
                inputProps={{ maxLength: 100 }}
                helperText="Maximum 100 characters."
              />
            </Grid>

            <Grid item xs={12} md={4}>
              {renderSettingSelect("jobTypeId", "Job Type", settings.jobType)}
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth required type="number" label="Openings" value={form.openings}
                onChange={(event) => setField("openings", event.target.value)}
                inputProps={{ min: 1, step: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth required type="number" label="Salary" value={form.salary}
                onChange={(event) => setField("salary", event.target.value)}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              {renderSettingSelect("currencyId", "Currency", settings.currency)}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth multiline minRows={4} label="Job Description"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.active)}
                    onChange={(event) => setField("active", event.target.checked)}
                    color="primary"
                  />
                }
                label={form.active ? "Active" : "Inactive"}
              />
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate("/wayabroadadmin/admin/jobs/list")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit" variant="contained" disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {saving ? "Saving..." : isEditing ? "Update Job" : "Create Job"}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
