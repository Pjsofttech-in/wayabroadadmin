import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Checkbox, FormControlLabel, Grid, MenuItem, Paper, TextField, Typography,
} from "@mui/material";
import { message } from "antd";
import { getAllPlans } from "./planService";
import { recordSubscription } from "./subscriptionService";
import { PAID_PLAN_BASE, PAYMENT_MODES } from "./paidPlanConfig";
import {
  calcGstAmount, calcTotalAmount, formatINR, getApiError, isBlank, toNumberOrNull, validateSubscription,
} from "./paidPlanUtils";
import { PageHeader } from "./PaidPlanUi";
import RazorpayCollect from "./RazorpayCollect";

const INITIAL = {
  instituteEmail: "", planId: "", transactionId: "", amount: "", paymentMode: "",
  validity: "", gstPercent: "", discountPer: "", isCreatedByAdmin: true,
};

export default function RecordSubscription() {
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllPlans()
      .then((data) => { if (!cancelled) setPlans(Array.isArray(data) ? data : []); })
      .catch((e) => {
        console.error("Failed to load plans:", e);
        if (!cancelled) setPlansError(getApiError(e, { forbidden: "You do not have permission to view plans." }));
      });
    return () => { cancelled = true; };
  }, []);

  const gstAmount = useMemo(() => calcGstAmount(values.amount, values.gstPercent), [values.amount, values.gstPercent]);
  const totalAmount = useMemo(() => calcTotalAmount(values.amount, values.gstPercent), [values.amount, values.gstPercent]);

  const setField = (field) => (event) => {
    const value = event.target.value;
    setValues((previous) => {
      const next = { ...previous, [field]: value };
      // Validity "overrides plan default": prefill from the plan when it has one.
      if (field === "planId") {
        const plan = plans.find((p) => String(p.id) === String(value));
        if (plan && !isBlank(plan.validity) && isBlank(previous.validity)) next.validity = plan.validity;
      }
      return next;
    });
    if (errors[field]) setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validateSubscription(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      instituteEmail: values.instituteEmail.trim(),
      planId: Number(values.planId),
      transactionId: values.transactionId.trim(),
      amount: Number(values.amount),
      paymentMode: values.paymentMode,
      validity: Number(values.validity),
      gstPercent: toNumberOrNull(values.gstPercent) ?? 0,
      gstAmount,
      discountPer: toNumberOrNull(values.discountPer) ?? 0,
      isCreatedByAdmin: Boolean(values.isCreatedByAdmin),
    };

    setSaving(true);
    try {
      await recordSubscription(payload);
      message.success("Subscription recorded successfully");
      setValues(INITIAL);
      setErrors({});
    } catch (e) {
      console.error("Failed to record subscription:", e);
      message.error(getApiError(e, { forbidden: "You do not have permission to record subscriptions.", fallback: "Could not record the subscription." }));
    } finally {
      setSaving(false);
    }
  };

  const text = (field, label, props = {}, children = null) => (
    <TextField
      fullWidth size="small" label={label} value={values[field]} onChange={setField(field)}
      disabled={saving} error={Boolean(errors[field])} helperText={errors[field]} {...props}
    >
      {children}
    </TextField>
  );

  return (
    <Paper sx={{ p: 2, borderRadius: 2, maxWidth: 900 }}>
      <PageHeader title="Record Subscription" subtitle="Record a paid-plan subscription for an institute." />
      <Alert severity="warning" sx={{ mb: 2 }}>
        Known backend issue: the saved <b>Total Amount</b> is currently stored as empty by the server. The total shown below is a preview only.
      </Alert>
      {plansError && <Alert severity="error" sx={{ mb: 2 }}>{plansError}</Alert>}
      <form onSubmit={submit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>{text("instituteEmail", "Institute Email", { type: "email", required: true })}</Grid>
          <Grid item xs={12} md={6}>
            {text("planId", "Plan", { select: true, required: true, disabled: saving || plans.length === 0 },
              plans.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.planName}</MenuItem>))}
          </Grid>
          <Grid item xs={12} md={6}>{text("transactionId", "Transaction ID", { required: true })}</Grid>
          <Grid item xs={12} md={6}>{text("paymentMode", "Payment Mode", { select: true, required: true },
            PAYMENT_MODES.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>))}</Grid>
          <Grid item xs={12} md={4}>{text("amount", "Amount (₹)", { type: "number", required: true, inputProps: { min: 0, step: "any" } })}</Grid>
          <Grid item xs={12} md={4}>{text("validity", "Validity (Months)", { type: "number", required: true, inputProps: { min: 1, step: 1 } })}</Grid>
          <Grid item xs={12} md={4}>{text("discountPer", "Discount (%)", { type: "number", inputProps: { min: 0, max: 100, step: "any" } })}</Grid>
          <Grid item xs={12} md={4}>{text("gstPercent", "GST (%)", { type: "number", inputProps: { min: 0, max: 28, step: "any" } })}</Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="GST Amount (₹)" value={gstAmount} InputProps={{ readOnly: true }} helperText="Auto-calculated" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="Total Amount (₹) — preview" value={totalAmount} InputProps={{ readOnly: true }} helperText="Amount + GST" />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Checkbox checked={values.isCreatedByAdmin} disabled={saving} onChange={(e) => setValues((p) => ({ ...p, isCreatedByAdmin: e.target.checked }))} />}
              label="Created by Admin"
            />
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary">Total payable: {formatINR(totalAmount)}</Typography>

        <RazorpayCollect
          amountPayable={totalAmount}
          paymentMode={values.paymentMode}
          email={values.instituteEmail.trim()}
          onPaid={({ paymentId }) => setValues((p) => ({ ...p, transactionId: paymentId }))}
        />

        <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? "Saving..." : "Record Subscription"}</Button>
          <Button variant="outlined" disabled={saving} onClick={() => navigate(PAID_PLAN_BASE)}>Cancel</Button>
        </Box>
      </form>
    </Paper>
  );
}
