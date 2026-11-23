import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, List, ListItem, Switch, Typography,
} from "@mui/material";
import { message } from "antd";
import { assignFeaturesToPlan, getAllFeatures, removeFeatureFromPlan } from "./featureService";
import { assignmentRowId, getApiError } from "./paidPlanUtils";

// Assign / manage features on a plan (§3.6). `assigned` is the plan's
// additionalFeatures array (PlanAdditionalFeatureDTO[]).
export default function PlanFeatureAssign({ open, plan, assigned, onClose, onSaved }) {
  const [features, setFeatures] = useState([]);
  const [selection, setSelection] = useState({}); // featureId -> { checked, enabled }
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const assignedById = useMemo(() => {
    const map = {};
    (assigned || []).forEach((f) => { map[String(f.addFeatureId)] = f; });
    return map;
  }, [assigned]);

  // Read through a ref so the dialog loads once per open, not on every parent render.
  const assignedRef = useRef(assignedById);
  assignedRef.current = assignedById;

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getAllFeatures();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setFeatures(list);
        const initial = {};
        list.forEach((f) => {
          const existing = assignedRef.current[String(f.id)];
          initial[String(f.id)] = { checked: Boolean(existing), enabled: existing ? Boolean(existing.enabled) : true };
        });
        setSelection(initial);
      } catch (e) {
        console.error("Failed to load features:", e);
        if (!cancelled) setLoadError(getApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const update = (featureId, patch) =>
    setSelection((previous) => ({ ...previous, [featureId]: { ...previous[featureId], ...patch } }));

  const save = async () => {
    const featureEnableMap = {};
    const toRemove = [];
    Object.entries(selection).forEach(([featureId, state]) => {
      if (state.checked) featureEnableMap[featureId] = state.enabled;
      else if (assignedById[featureId]) toRemove.push(assignedById[featureId]);
    });

    setSaving(true);
    try {
      if (Object.keys(featureEnableMap).length) await assignFeaturesToPlan(plan.id, featureEnableMap);
      for (const row of toRemove) await removeFeatureFromPlan(assignmentRowId(row));
      message.success("Plan features updated successfully");
      onSaved?.();
    } catch (e) {
      console.error("Failed to save plan features:", e);
      message.error(getApiError(e, { forbidden: "You do not have permission to change plan features." }));
      // Part of the change may have been applied; refresh so the screen shows the truth.
      onSaved?.({ keepOpen: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign Features{plan?.planName ? ` — ${plan.planName}` : ""}</DialogTitle>
      <DialogContent dividers>
        {loadError && <Alert severity="error" sx={{ mb: 1 }}>{loadError}</Alert>}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
        ) : features.length === 0 && !loadError ? (
          <Typography color="text.secondary">No features available. Create features in Additional Features first.</Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tick a feature to include it in this plan, then choose whether it is enabled. Unticking an assigned feature removes it from the plan.
            </Typography>
            <List dense disablePadding>
              {features.map((f) => {
                const state = selection[String(f.id)] || { checked: false, enabled: true };
                return (
                  <ListItem key={f.id} disableGutters sx={{ display: "flex", justifyContent: "space-between" }}>
                    <FormControlLabel
                      control={<Checkbox checked={state.checked} onChange={(e) => update(String(f.id), { checked: e.target.checked })} />}
                      label={f.name}
                    />
                    <FormControlLabel
                      labelPlacement="start"
                      disabled={!state.checked}
                      control={<Switch size="small" checked={state.enabled} onChange={(e) => update(String(f.id), { enabled: e.target.checked })} />}
                      label={state.enabled ? "Enabled" : "Disabled"}
                    />
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving || loading || Boolean(loadError)}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
