import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert, Box, Button, CircularProgress, FormControlLabel, Grid, MenuItem,
  Paper, Stack, Switch, TextField, Typography,
} from "@mui/material";
import { message } from "antd";
import {
  createJob, getJobById, getJobSettings, updateJob,
} from "./JobService";

const emptyForm = {
  jobTitle: "", educationId: "", sectorId: "", jobRoleId: "", skill: "",
  openings: "1", locationId: "", salary: "", currencyId: "", jobTypeId: "",
  description: "", active: true,
};

const optionName = (item) => item?.name || item?.educationName || item?.sectorName || item?.jobRoleName || item?.locationName || item?.currencyName || item?.jobTypeName || "";

export default function JobForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("editId");
  const isEditing = Boolean(editId);
  const [form, setForm] = useState(emptyForm);
  const [settings, setSettings] = useState({ education: [], sector: [], role: [], currency: [], jobType: [], location: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const types = ["education", "sector", "role", "currency", "jobType", "location"];
        const values = await Promise.all(types.map((type) => getJobSettings(type)));
        if (!alive) return;
        const nextSettings = Object.fromEntries(types.map((type, index) => [type, Array.isArray(values[index]) ? values[index] : []]));
        setSettings(nextSettings);
        if (isEditing) {
          const job = await getJobById(editId);
          if (!alive) return;
          setForm({
            jobTitle: job.jobTitle || "",
            educationId: String(job.educationId ?? ""),
            sectorId: String(job.sectorId ?? ""),
            jobRoleId: String(job.jobRoleId ?? ""),
            skill: job.skill || "",
            openings: String(job.openings ?? 1),
            locationId: String(job.locationId ?? ""),
            salary: String(job.salary ?? ""),
            currencyId: String(job.currencyId ?? ""),
            jobTypeId: String(job.jobTypeId ?? ""),
            description: job.description || "",
            active: job.active !== false,
          });
        }
      } catch (e) {
        console.error("Failed to load job form data:", e);
        if (alive) setError(e?.response?.data?.message || e.message || "Failed to load job form data.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [editId, isEditing]);

  const sectors = useMemo(() => settings.sector.filter((item) =>
    !form.educationId || String(item.education?.id ?? item.educationId ?? "") === String(form.educationId)
  ), [settings.sector, form.educationId]);

  const roles = useMemo(() => settings.role.filter((item) =>
    !form.sectorId || String(item.sector?.id ?? item.sectorId ?? "") === String(form.sectorId)
  ), [settings.role, form.sectorId]);

  const setField = (name, value) => setForm((previous) => ({ ...previous, [name]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const required = ["jobTitle", "educationId", "sectorId", "jobRoleId", "skill", "openings", "locationId", "salary", "currencyId", "jobTypeId"];
    if (required.some((key) => String(form[key] ?? "").trim() === "")) {
      setError("Please complete all required fields.");
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

    const payload = {
      jobTitle: form.jobTitle.trim(),
      educationId: Number(form.educationId),
      sectorId: Number(form.sectorId),
      jobRoleId: Number(form.jobRoleId),
      skill: form.skill.trim(),
      openings,
      locationId: Number(form.locationId),
      salary,
      currencyId: Number(form.currencyId),
      jobTypeId: Number(form.jobTypeId),
      description: form.description.trim(),
      active: Boolean(form.active),
    };

    setSaving(true);
    try {
      if (isEditing) await updateJob(editId, payload);
      else await createJob(payload);
      message.success(isEditing ? "Job updated successfully." : "Job created successfully.");
      navigate("/wayabroadadmin/admin/jobs/list");
    } catch (e) {
      console.error("Job save failed:", e);
      setError(e?.response?.data?.message || e.message || "Unable to save job.");
      message.error("Job could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const selectField = (name, label, items, disabled = false) => (
    <TextField select fullWidth label={label} value={form[name]} required disabled={disabled || loading || saving}
      onChange={(event) => setField(name, event.target.value)}>
      {items.map((item) => (
        <MenuItem key={item.id} value={String(item.id)} disabled={item.active === false}>
          {optionName(item) || `#${item.id}`}
          {item.active === false ? " (Inactive)" : ""}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: "#183b56" }}>
        {isEditing ? "Edit Job" : "Create Job"}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}><CircularProgress /></Box>
      ) : (
        <Paper component="form" onSubmit={handleSubmit} elevation={1} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth required label="Job Title" value={form.jobTitle} onChange={(e) => setField("jobTitle", e.target.value)} inputProps={{ maxLength: 255 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth required label="Skill" value={form.skill} onChange={(e) => setField("skill", e.target.value)} inputProps={{ maxLength: 255 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              {selectField("educationId", "Education", settings.education)}
            </Grid>
            <Grid item xs={12} md={4}>
              {selectField("sectorId", "Sector", sectors, !form.educationId)}
            </Grid>
            <Grid item xs={12} md={4}>
              {selectField("jobRoleId", "Job Role", roles, !form.sectorId)}
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth required type="number" label="Openings" value={form.openings} onChange={(e) => setField("openings", e.target.value)} inputProps={{ min: 1, step: 1 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth required type="number" label="Salary" value={form.salary} onChange={(e) => setField("salary", e.target.value)} inputProps={{ min: 0, step: "0.01" }} />
            </Grid>
            <Grid item xs={12} md={4}>
              {selectField("currencyId", "Currency", settings.currency)}
            </Grid>
            <Grid item xs={12} md={6}>
              {selectField("locationId", "Location", settings.location)}
            </Grid>
            <Grid item xs={12} md={6}>
              {selectField("jobTypeId", "Job Type", settings.jobType)}
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={4} label="Job Description" value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={Boolean(form.active)} onChange={(e) => setField("active", e.target.checked)} color="primary" />} label={form.active ? "Active" : "Inactive"} />
            </Grid>
          </Grid>
          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate("/wayabroadadmin/admin/jobs/list")} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
              {saving ? "Saving..." : isEditing ? "Update Job" : "Create Job"}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
