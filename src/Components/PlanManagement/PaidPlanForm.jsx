import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Grid, Paper, TextField, Tooltip } from "@mui/material";
import { message } from "antd";
import { createPlan, getPlanById, updatePlan } from "./planService";
import { BACKEND_PERSISTS_EXTENDED_PLAN_FIELDS, PAID_PLAN_BASE } from "./paidPlanConfig";
import { getApiError, isBlank, toNumberOrNull, validatePlan } from "./paidPlanUtils";
import { PageHeader } from "./PaidPlanUi";

const EMPTY = { planName: "", mrp: "", price: "", discount: "", validity: "" };
const PENDING_TIP = "This field will be active after a backend update.";

// Shared by Create (mode="create") and Edit (mode="edit", route :id).
export default function PaidPlanForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const extended = BACKEND_PERSISTS_EXTENDED_PLAN_FIELDS;

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const plan = await getPlanById(id);
        if (cancelled) return;
        setValues({
          planName: plan?.planName ?? "",
          mrp: plan?.mrp ?? "",
          price: plan?.price ?? "",
          discount: plan?.discount ?? "",
          validity: plan?.validity ?? "",
        });
      } catch (e) {
        console.error("Failed to load plan:", e);
        if (!cancelled) setLoadError(getApiError(e, { forbidden: "You do not have permission to view this plan." }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const setField = (field) => (event) => {
    setValues((previous) => ({ ...previous, [field]: event.target.value }));
    if (errors[field]) setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validatePlan(values, { extendedFields: extended });
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = { planName: values.planName.trim(), mrp: Number(values.mrp) };
    if (extended) {
      if (!isBlank(values.price)) payload.price = toNumberOrNull(values.price);
      if (!isBlank(values.discount)) payload.discount = toNumberOrNull(values.discount);
      if (!isBlank(values.validity)) payload.validity = toNumberOrNull(values.validity);
    }

    setSaving(true);
    try {
      if (isEdit) await updatePlan(id, payload);
      else await createPlan(payload);
      message.success(isEdit ? "Plan updated successfully" : "Plan created successfully");
      navigate(PAID_PLAN_BASE);
    } catch (e) {
      console.error("Failed to save plan:", e);
      message.error(getApiError(e, {
        forbidden: isEdit ? "You do not have permission to update plans." : "You do not have permission to create plans.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const pendingField = (field, label, props = {}) => (
    <Tooltip title={extended ? "" : PENDING_TIP} arrow>
      {/* span lets the tooltip show on a disabled input */}
      <span>
        <TextField
          fullWidth size="small" type="number" label={label}
          value={values[field]} onChange={setField(field)}
          disabled={!extended || saving}
          error={Boolean(errors[field])} helperText={errors[field]}
          {...props}
        />
      </span>
    </Tooltip>
  );

  return (
    <Paper sx={{ p: 2, borderRadius: 2, maxWidth: 800 }}>
      <PageHeader title={isEdit ? "Edit Paid Plan" : "Create Paid Plan"} />
      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <form onSubmit={submit} noValidate>
          {!extended && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Price, Discount and Validity are not saved by the backend yet. Only Plan Name and MRP are persisted.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth size="small" required label="Plan Name" value={values.planName}
                onChange={setField("planName")} disabled={saving || Boolean(loadError)}
                error={Boolean(errors.planName)} helperText={errors.planName}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth size="small" required type="number" label="MRP (₹)" value={values.mrp}
                onChange={setField("mrp")} disabled={saving || Boolean(loadError)}
                error={Boolean(errors.mrp)} helperText={errors.mrp}
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid item xs={12} md={4}>{pendingField("price", "Price (₹)", { inputProps: { min: 0, step: "any" } })}</Grid>
            <Grid item xs={12} md={4}>{pendingField("discount", "Discount (%)", { inputProps: { min: 0, max: 100, step: "any" } })}</Grid>
            <Grid item xs={12} md={4}>{pendingField("validity", "Validity (Months)", { inputProps: { min: 1, step: 1 } })}</Grid>
          </Grid>
          <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
            <Button type="submit" variant="contained" disabled={saving || Boolean(loadError)}>
              {saving ? "Saving..." : "Save Plan"}
            </Button>
            <Button variant="outlined" disabled={saving} onClick={() => navigate(PAID_PLAN_BASE)}>Cancel</Button>
          </Box>
        </form>
      )}
    </Paper>
  );
}
