import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, TextField,
} from "@mui/material";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Popconfirm, Table, message } from "antd";
import { createFeature, deleteFeature, getAllFeatures, updateFeature } from "./featureService";
import { getApiError, validateFeatureName } from "./paidPlanUtils";
import { PageHeader } from "./PaidPlanUi";

// Feature master: list + create/edit dialog + delete (§3.5).
export default function AdditionalFeatureList() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllFeatures();
      setFeatures(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load features:", e);
      setError(getApiError(e));
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDialog = (feature = null) => {
    setEditing(feature);
    setName(feature?.name ?? "");
    setNameError("");
    setDialogOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    const validation = validateFeatureName(name);
    setNameError(validation);
    if (validation) return;
    setSaving(true);
    try {
      if (editing) await updateFeature(editing.id, name.trim());
      else await createFeature(name.trim());
      message.success(`Feature ${editing ? "updated" : "created"} successfully`);
      setDialogOpen(false);
      await load();
    } catch (e) {
      console.error("Failed to save feature:", e);
      message.error(getApiError(e, { fallback: "Could not save feature." }));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (feature) => {
    try {
      await deleteFeature(feature.id);
      setFeatures((previous) => previous.filter((f) => f.id !== feature.id));
      message.success("Feature deleted successfully");
    } catch (e) {
      console.error("Failed to delete feature:", e);
      message.error(getApiError(e, { fallback: "Could not delete feature. It may be assigned to a plan." }));
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 90 },
    { title: "Feature Name", dataIndex: "name", key: "name" },
    {
      title: "Actions", key: "actions", width: 120,
      render: (_, feature) => (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" aria-label={`Edit ${feature.name}`} onClick={() => openDialog(feature)}><EditOutlined /></Button>
          <Popconfirm title={`Delete ${feature.name}?`} description="Plans using this feature may be affected." onConfirm={() => remove(feature)} okText="Delete" cancelText="Cancel">
            <Button size="small" color="error" aria-label={`Delete ${feature.name}`}><DeleteOutlined /></Button>
          </Popconfirm>
        </Stack>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <PageHeader
        title="Additional Features"
        subtitle="Master list of features that can be assigned to paid plans."
        actions={<Button variant="contained" startIcon={<PlusOutlined />} onClick={() => openDialog()}>Add Feature</Button>}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error}</Alert>}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={features}
        loading={loading}
        locale={{ emptyText: "No features found" }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />
      <Dialog open={dialogOpen} onClose={saving ? undefined : () => setDialogOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={save} noValidate>
          <DialogTitle>{editing ? "Edit Feature" : "Add Feature"}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus fullWidth required size="small" margin="dense" label="Feature Name"
              value={name} onChange={(e) => { setName(e.target.value); setNameError(""); }}
              error={Boolean(nameError)} helperText={nameError} inputProps={{ maxLength: 100 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
}
