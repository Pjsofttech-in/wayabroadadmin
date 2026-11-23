import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { Popconfirm, Switch, Table, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { deletePlan, getPlanById } from "./planService";
import { removeFeatureFromPlan, toggleFeatureValue } from "./featureService";
import { PAID_PLAN_BASE } from "./paidPlanConfig";
import { assignmentRowId, formatINR, formatPlain, getApiError } from "./paidPlanUtils";
import { FeatureBadge, PageHeader } from "./PaidPlanUi";
import PlanFeatureAssign from "./PlanFeatureAssign";

function InfoItem({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

export default function PaidPlanDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [busyFeature, setBusyFeature] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPlan(await getPlanById(id));
    } catch (e) {
      console.error("Failed to load plan:", e);
      setError(getApiError(e, { forbidden: "You do not have permission to view this plan." }));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const features = useMemo(
    () => (Array.isArray(plan?.additionalFeatures) ? plan.additionalFeatures : []),
    [plan],
  );

  const toggle = async (feature, enabled) => {
    setBusyFeature(feature.addFeatureId);
    try {
      await toggleFeatureValue(assignmentRowId(feature), { planId: plan.id, featureId: feature.addFeatureId, enabled });
      setPlan((previous) => ({
        ...previous,
        additionalFeatures: previous.additionalFeatures.map((f) =>
          f.addFeatureId === feature.addFeatureId ? { ...f, enabled } : f),
      }));
      message.success(`${feature.addFeatureName} ${enabled ? "enabled" : "disabled"}`);
    } catch (e) {
      console.error("Failed to toggle feature:", e);
      message.error(getApiError(e, { forbidden: "You do not have permission to change plan features." }));
    } finally {
      setBusyFeature(null);
    }
  };

  const removeFeature = async (feature) => {
    setBusyFeature(feature.addFeatureId);
    try {
      await removeFeatureFromPlan(assignmentRowId(feature));
      setPlan((previous) => ({
        ...previous,
        additionalFeatures: previous.additionalFeatures.filter((f) => f.addFeatureId !== feature.addFeatureId),
      }));
      message.success("Feature removed from plan");
    } catch (e) {
      console.error("Failed to remove feature:", e);
      message.error(getApiError(e, { forbidden: "You do not have permission to change plan features." }));
    } finally {
      setBusyFeature(null);
    }
  };

  const removePlan = async () => {
    try {
      await deletePlan(plan.id);
      message.success("Plan deleted successfully");
      navigate(PAID_PLAN_BASE);
    } catch (e) {
      console.error("Failed to delete plan:", e);
      message.error(getApiError(e, { forbidden: "You do not have permission to delete plans." }));
    }
  };

  const columns = [
    { title: "Feature ID", dataIndex: "addFeatureId", key: "addFeatureId", width: 110 },
    { title: "Feature Name", dataIndex: "addFeatureName", key: "addFeatureName" },
    { title: "Status", key: "status", width: 130, render: (_, f) => <FeatureBadge enabled={Boolean(f.enabled)} /> },
    {
      title: "Action", key: "action", width: 180,
      render: (_, f) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Switch
            checked={Boolean(f.enabled)}
            loading={busyFeature === f.addFeatureId}
            checkedChildren="On" unCheckedChildren="Off"
            onChange={(checked) => toggle(f, checked)}
            aria-label={`Toggle ${f.addFeatureName}`}
          />
          <Popconfirm title="Remove this feature from the plan?" onConfirm={() => removeFeature(f)} okText="Remove" cancelText="Cancel">
            <Button size="small" color="error" disabled={busyFeature === f.addFeatureId} aria-label={`Remove ${f.addFeatureName}`}><DeleteOutlined /></Button>
          </Popconfirm>
        </Stack>
      ),
    },
  ];

  if (loading && !plan) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  if (error || !plan) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || "Plan not found."}</Alert>
        <Button variant="outlined" onClick={() => navigate(PAID_PLAN_BASE)}>Back to Plans</Button>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <PageHeader
          title={plan.planName}
          subtitle={`Plan #${plan.id}`}
          actions={(
            <>
              <Button variant="outlined" onClick={() => navigate(PAID_PLAN_BASE)}>Back</Button>
              <Button variant="outlined" onClick={() => navigate(`${PAID_PLAN_BASE}/edit/${plan.id}`)}>Edit Plan</Button>
              <Button variant="contained" onClick={() => setAssignOpen(true)}>Assign Features</Button>
              <Popconfirm title={`Delete ${plan.planName}?`} description="This permanently deletes the plan and its feature assignments." onConfirm={removePlan} okText="Delete" cancelText="Cancel">
                <Button variant="outlined" color="error">Delete Plan</Button>
              </Popconfirm>
            </>
          )}
        />
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}><InfoItem label="MRP" value={formatINR(plan.mrp)} /></Grid>
          <Grid item xs={6} md={3}><InfoItem label="Price" value={formatINR(plan.price)} /></Grid>
          <Grid item xs={6} md={3}><InfoItem label="Discount" value={formatPlain(plan.discount, "%")} /></Grid>
          <Grid item xs={6} md={3}><InfoItem label="Validity" value={plan.validity === null || plan.validity === undefined ? "—" : `${plan.validity} month(s)`} /></Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Assigned Features</Typography>
        <Table
          rowKey="addFeatureId"
          columns={columns}
          dataSource={features}
          locale={{ emptyText: "No features assigned to this plan" }}
          pagination={false}
          size="small"
        />
      </Paper>

      <PlanFeatureAssign
        open={assignOpen}
        plan={plan}
        assigned={features}
        onClose={() => setAssignOpen(false)}
        onSaved={(opts) => { if (!opts?.keepOpen) setAssignOpen(false); load(); }}
      />
    </Stack>
  );
}
