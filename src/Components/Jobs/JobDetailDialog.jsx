import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, LinearProgress, MenuItem, Stack,
  Switch, TextField, Typography, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { message } from "antd";
import { getJobById, getJobSettings, updateJob } from "./JobService";

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

// getJobById may return the job itself or a { data: job } wrapper.
const unwrapJob = (response) =>
  response && typeof response === "object" && "data" in response && !("jobTitle" in response)
    ? response.data
    : response;

const toSkills = (job) => {
  if (Array.isArray(job?.skills)) return job.skills.filter(Boolean);
  const text = typeof job?.skills === "string" ? job.skills : job?.skill;
  return typeof text === "string"
    ? text.split(",").map((skill) => skill.trim()).filter(Boolean)
    : [];
};

const show = (value) =>
  value === null || value === undefined || value === "" ? "-" : value;

const gridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    sm: "repeat(2, minmax(0, 1fr))",
    md: "repeat(3, minmax(0, 1fr))",
  },
  gap: { xs: 1.25, sm: 1.5 },
};
const fullRow = { gridColumn: "1 / -1" };
const wideCell = { gridColumn: { xs: "auto", sm: "span 2" } };

const requiredStar = {
  "& .MuiInputLabel-asterisk": { color: "#f44336" },
};

function Field({ label, children, sx }) {
  return (
    <Box sx={{ minWidth: 0, ...sx }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-word" }} component="div">
        {children}
      </Typography>
    </Box>
  );
}

/**
 * Popup opened from a Job List row.
 * View mode shows the job; admins with edit rights can switch to edit mode and
 * update the job in place (same fields, validation and payload as the Job Form).
 */
export default function JobDetailDialog({ open, job, canEdit = false, onClose, onUpdated }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("view");
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skillsTried, setSkillsTried] = useState(false);

  const jobId = job?.id;

  // Open: show the row immediately, then load the full record.
  useEffect(() => {
    if (!open || jobId == null) return undefined;
    let mounted = true;
    setMode("view");
    setError("");
    setForm(null);
    setSkillsTried(false);
    setDetails(job);
    setLoading(true);

    getJobById(jobId)
      .then((response) => {
        if (!mounted) return;
        const record = unwrapJob(response);
        if (record && typeof record === "object") setDetails((previous) => ({ ...previous, ...record }));
      })
      .catch((loadError) => {
        console.error("Failed to load job details:", loadError);
        if (mounted) setError(errorMessage(loadError, "Could not load the latest job details."));
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jobId]);

  const buildForm = (record, loadedSettings) => {
    const selectedLocation = loadedSettings.location.find(
      (location) => String(location.id) === String(record.locationId)
    );
    return {
      jobTitle: record.jobTitle ?? "",
      educationId: idString(record.educationId),
      sectorId: idString(record.sectorId),
      jobRoleId: idString(record.jobRoleId),
      skills: toSkills(record),
      openings: idString(record.openings ?? 1),
      countryId: idString(record.countryId ?? getCountryId(selectedLocation)),
      locationId: idString(record.locationId),
      workTypeId: idString(record.workTypeId),
      experienceLevel: record.experienceLevel ?? "",
      salary: idString(record.salary),
      currencyId: idString(record.currencyId),
      jobTypeId: idString(record.jobTypeId),
      description: record.description ?? "",
      active: record.active !== false,
    };
  };

  const startEdit = async () => {
    setError("");
    setSkillsTried(false);
    let loadedSettings = settings;
    if (!loadedSettings) {
      setSettingsLoading(true);
      try {
        const results = await Promise.all(SETTING_TYPES.map((type) => getJobSettings(type)));
        loadedSettings = Object.fromEntries(
          SETTING_TYPES.map((type, index) => [type, asArray(results[index])])
        );
        setSettings(loadedSettings);
      } catch (settingsError) {
        console.error("Failed to load job settings:", settingsError);
        setError(errorMessage(settingsError, "Unable to load Job Settings."));
        setSettingsLoading(false);
        return;
      }
      setSettingsLoading(false);
    }
    setForm(buildForm(details || job, loadedSettings));
    setMode("edit");
  };

  const cancelEdit = () => {
    if (saving) return;
    setMode("view");
    setForm(null);
    setError("");
  };

  const handleClose = () => {
    if (!saving) onClose?.();
  };

  const setField = (field, value) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const roles = useMemo(
    () => (settings?.role || []).filter((role) => {
      const roleSectorId = role?.sectorId ?? role?.sector?.id ?? role?.sector?.sectorId;
      return !form?.sectorId || String(roleSectorId ?? "") === String(form.sectorId);
    }),
    [settings, form?.sectorId]
  );

  const locations = useMemo(
    () => (settings?.location || []).filter((location) =>
      !form?.countryId || String(getCountryId(location)) === String(form.countryId)
    ),
    [settings, form?.countryId]
  );

  const handleSectorChange = (sectorId) =>
    setForm((previous) => ({ ...previous, sectorId, jobRoleId: "" }));

  const handleCountryChange = (countryId) =>
    setForm((previous) => ({ ...previous, countryId, locationId: "" }));

  const handleSkillsChange = (_, values) => {
    const skills = [...new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : getName(value).trim()))
        .filter(Boolean)
    )];
    setField("skills", skills);
    if (skills.length > 0) setSkillsTried(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSkillsTried(true);

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
      setError("One or more selected options are invalid. Reopen the job and select valid options.");
      return;
    }
    if (form.experienceLevel.trim().length > 100) {
      setError("Experience Level must be 100 characters or fewer.");
      return;
    }
    const openings = Number(form.openings);
    if (!Number.isInteger(openings) || openings <= 0) {
      setError("Openings must be a whole number greater than zero.");
      return;
    }

    // Same payload as the Job Form: the backend derives Country from Location.
    const payload = {
      jobTitle: form.jobTitle.trim(),
      educationId: Number(form.educationId),
      sectorId: Number(form.sectorId),
      jobRoleId: Number(form.jobRoleId),
      skills: form.skills.map((skill) => skill.trim()).filter(Boolean),
      openings,
      locationId: Number(form.locationId),
      salary: form.salary,
      currencyId: Number(form.currencyId),
      jobTypeId: Number(form.jobTypeId),
      workTypeId: Number(form.workTypeId),
      experienceLevel: form.experienceLevel.trim(),
      description: form.description.trim(),
      active: Boolean(form.active),
    };

    setSaving(true);
    try {
      await updateJob(jobId, payload);
      message.success("Job updated.");
      await onUpdated?.();
      onClose?.();
    } catch (saveError) {
      console.error("Job update failed:", saveError);
      const text = errorMessage(saveError, "Unable to update job.");
      setError(text);
      message.error(text);
    } finally {
      setSaving(false);
    }
  };

  const renderSelect = (field, label, items, { disabled = false, onChange } = {}) => (
    <TextField
      select size="small" fullWidth required label={label} sx={requiredStar}
      value={form[field]}
      disabled={saving || disabled}
      onChange={(event) => (onChange ? onChange(event.target.value) : setField(field, event.target.value))}
    >
      <MenuItem value="">Select {label}</MenuItem>
      {items.map((item) => (
        <MenuItem
          key={item.id}
          value={idString(item.id)}
          disabled={!isActive(item) || item.id == null}
        >
          {getName(item) || `#${item.id}`}{!isActive(item) ? " (Inactive)" : ""}
        </MenuItem>
      ))}
    </TextField>
  );

  const data = details || job || {};
  const skills = toSkills(data);
  const isEditing = mode === "edit";

  const renderView = () => (
    <Box sx={gridSx}>
      <Field label="Job Type">{show(data.jobTypeName)}</Field>
      <Field label="Sector">{show(data.sectorName)}</Field>
      <Field label="Job Role">{show(data.jobRoleName)}</Field>
      <Field label="Education">{show(data.educationName)}</Field>
      <Field label="Experience">{show(data.experienceLevel)}</Field>
      <Field label="Openings">{show(data.openings)}</Field>
      <Field label="Country">{show(data.countryName)}</Field>
      <Field label="Location">{show(data.locationName)}</Field>
      <Field label="Work Type">{show(data.workTypeName)}</Field>
      <Field label="Salary">
        {`${data.currencyName || ""} ${data.salary ?? "-"}`.trim()}
      </Field>
      <Field label="Skills" sx={fullRow}>
        {skills.length === 0 ? "-" : (
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5} sx={{ mt: 0.25 }}>
            {skills.map((skill) => <Chip key={skill} size="small" label={skill} />)}
          </Stack>
        )}
      </Field>
      <Field label="Description" sx={fullRow}>
        <Box component="span" sx={{ whiteSpace: "pre-wrap" }}>{show(data.description)}</Box>
      </Field>
    </Box>
  );

  const renderEdit = () => (
    <Box component="form" id="job-edit-form" onSubmit={handleSubmit} sx={gridSx}>
      <Box sx={wideCell}>
        <TextField
          size="small" fullWidth required label="Job Title" sx={requiredStar}
          value={form.jobTitle} disabled={saving}
          onChange={(event) => setField("jobTitle", event.target.value)}
          inputProps={{ maxLength: 255 }}
        />
      </Box>
      {renderSelect("jobTypeId", "Job Type", settings.jobType)}
      {renderSelect("sectorId", "Sector", settings.sector, { onChange: handleSectorChange })}
      {renderSelect("jobRoleId", "Job Role", roles, { disabled: !form.sectorId })}
      {renderSelect("educationId", "Education", settings.education)}
      <TextField
        size="small" fullWidth required label="Experience" sx={requiredStar}
        value={form.experienceLevel} disabled={saving}
        onChange={(event) => setField("experienceLevel", event.target.value)}
        inputProps={{ maxLength: 100 }}
        placeholder="e.g. 2–4 years"
      />
      <TextField
        size="small" fullWidth required type="number" label="Openings" sx={requiredStar}
        value={form.openings} disabled={saving}
        onChange={(event) => setField("openings", event.target.value)}
        inputProps={{ min: 1, step: 1 }}
      />
      {renderSelect("countryId", "Country", settings.country, { onChange: handleCountryChange })}
      {renderSelect("locationId", "Location", locations, { disabled: !form.countryId })}
      {renderSelect("workTypeId", "Work Type", settings.workType)}
      <TextField
        size="small" fullWidth required label="Salary" sx={requiredStar}
        value={form.salary} disabled={saving}
        onChange={(event) => setField("salary", event.target.value)}
        placeholder="e.g. 15k - 20k, Negotiable"
      />
      {renderSelect("currencyId", "Currency", settings.currency)}
      <Box sx={fullRow}>
        <Autocomplete
          multiple freeSolo options={[]} value={form.skills}
          onChange={handleSkillsChange} disabled={saving}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Skills"
              placeholder="Type a skill and press Enter"
              error={skillsTried && form.skills.length === 0}
              helperText={skillsTried && form.skills.length === 0 ? "Add at least one skill." : undefined}
              inputProps={{
                ...params.inputProps,
                onKeyDown: (event) => {
                  params.inputProps.onKeyDown?.(event);
                  if (event.key === "Enter" && event.target.value.trim()) event.preventDefault();
                },
              }}
            />
          )}
        />
      </Box>
      <Box sx={fullRow}>
        <TextField
          size="small" fullWidth multiline minRows={2} maxRows={8} label="Description"
          value={form.description} disabled={saving}
          onChange={(event) => setField("description", event.target.value)}
        />
      </Box>
      <Box sx={fullRow}>
        <FormControlLabel
          control={
            <Switch
              size="small" checked={Boolean(form.active)} disabled={saving}
              onChange={(event) => setField("active", event.target.checked)}
            />
          }
          label={form.active ? "Active" : "Inactive"}
        />
      </Box>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      scroll="paper"
    >
      <DialogTitle sx={{ py: 1.25, pr: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          <Typography
            component="span"
            sx={{ fontSize: 17, fontWeight: 700, minWidth: 0, flex: 1, wordBreak: "break-word" }}
          >
            {isEditing ? "Edit job" : show(data.jobTitle)}
          </Typography>
          {!isEditing && (
            <Chip
              size="small"
              label={data.active === false ? "Inactive" : "Active"}
              color={data.active === false ? "default" : "success"}
              variant="outlined"
            />
          )}
        </Stack>
      </DialogTitle>
      {loading && <LinearProgress sx={{ height: 2 }} />}
      <DialogContent dividers sx={{ py: 1.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, py: 0 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {isEditing && form && settings ? renderEdit() : renderView()}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1 }}>
        {isEditing ? (
          <>
            <Button type="button" onClick={cancelEdit} disabled={saving} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="job-edit-form"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ textTransform: "none", boxShadow: "none" }}
            >
              {saving ? "Updating..." : "Update"}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" onClick={handleClose} sx={{ textTransform: "none" }}>Close</Button>
            {canEdit && (
              <Button
                type="button"
                variant="contained"
                onClick={(event) => {
                  event.preventDefault();
                  startEdit();
                }}
                disabled={settingsLoading || loading}
                startIcon={settingsLoading ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{ textTransform: "none", boxShadow: "none" }}
              >
                Edit
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
