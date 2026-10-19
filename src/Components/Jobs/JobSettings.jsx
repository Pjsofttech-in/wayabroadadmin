import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, MenuItem, Stack, Switch, Tabs, Tab, TextField, Typography,
} from "@mui/material";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Popconfirm, Table, message, Tag } from "antd";
import {
  createJobSetting, deleteJobSetting, getJobSettings, updateJobSetting,
} from "./JobService";

const TYPES = [
  { key: "education", label: "Education", parentLabel: "" },
  { key: "sector", label: "Sector", parentLabel: "Education" },
  { key: "role", label: "Role", parentLabel: "Sector" },
  { key: "currency", label: "Currency", parentLabel: "" },
  { key: "jobType", label: "Job Type", parentLabel: "" },
  { key: "location", label: "Location", parentLabel: "" },
];
const emptyForm = { name: "", active: true, parentId: "" };
const getParentId = (type, record) => type === "sector"
  ? record?.education?.id ?? record?.educationId ?? ""
  : type === "role"
    ? record?.sector?.id ?? record?.sectorId ?? ""
    : "";

export default function JobSettings() {
  const [activeType, setActiveType] = useState("education");
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadType = useCallback(async (type = activeType) => {
    setLoading(true);
    setError("");
    try {
      const parentType = type === "sector" ? "education" : type === "role" ? "sector" : null;
      const [data, parentData] = await Promise.all([
        getJobSettings(type),
        parentType ? getJobSettings(parentType) : Promise.resolve(null),
      ]);
      setRecords((previous) => ({
        ...previous,
        [type]: Array.isArray(data) ? data : [],
        ...(parentType ? { [parentType]: Array.isArray(parentData) ? parentData : [] } : {}),
      }));
    } catch (e) {
      console.error(`Failed to load ${type} settings:`, e);
      setError(e?.response?.data?.message || e.message || `Failed to load ${type} settings.`);
      setRecords((previous) => ({ ...previous, [type]: [] }));
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => { loadType(activeType); }, [activeType, loadType]);

  const educationOptions = records.education || [];
  const sectorOptions = records.sector || [];
  const parentOptions = useMemo(() => {
    if (activeType === "sector") return educationOptions;
    if (activeType === "role") return sectorOptions;
    return [];
  }, [activeType, educationOptions, sectorOptions]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
    if (activeType === "sector" && !records.education) getJobSettings("education").then((data) => setRecords((p) => ({ ...p, education: data || [] }))).catch(() => {});
    if (activeType === "role" && !records.sector) getJobSettings("sector").then((data) => setRecords((p) => ({ ...p, sector: data || [] }))).catch(() => {});
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm({ name: record.name || "", active: record.active !== false, parentId: String(getParentId(activeType, record) || "") });
    setDialogOpen(true);
    if (activeType === "sector" && !records.education) getJobSettings("education").then((data) => setRecords((p) => ({ ...p, education: data || [] }))).catch(() => {});
    if (activeType === "role" && !records.sector) getJobSettings("sector").then((data) => setRecords((p) => ({ ...p, sector: data || [] }))).catch(() => {});
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      message.error("Name is required.");
      return;
    }
    if ((activeType === "sector" || activeType === "role") && !form.parentId) {
      message.error(`${activeType === "sector" ? "Education" : "Sector"} is required.`);
      return;
    }
    const payload = { name: form.name.trim(), active: Boolean(form.active) };
    const extraParams = activeType === "sector"
      ? { educationId: Number(form.parentId) }
      : activeType === "role"
        ? { sectorId: Number(form.parentId) }
        : {};
    setSaving(true);
    try {
      if (editing) await updateJobSetting(activeType, editing.id, payload, extraParams);
      else await createJobSetting(activeType, payload, extraParams);
      message.success(`${TYPES.find((item) => item.key === activeType)?.label} ${editing ? "updated" : "created"} successfully.`);
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await loadType(activeType);
    } catch (e) {
      console.error("Failed to save job setting:", e);
      message.error(e?.response?.data?.message || "Could not save setting.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    try {
      await deleteJobSetting(activeType, record.id);
      message.success("Setting deleted successfully.");
      await loadType(activeType);
    } catch (e) {
      console.error("Failed to delete job setting:", e);
      message.error(e?.response?.data?.message || "Could not delete setting. It may be used by existing jobs.");
    }
  };

  const parentName = (record) => activeType === "sector"
    ? record.education?.name || educationOptions.find((item) => item.id === (record.educationId ?? record.education?.id))?.name || "-"
    : activeType === "role"
      ? record.sector?.name || sectorOptions.find((item) => item.id === (record.sectorId ?? record.sector?.id))?.name || "-"
      : "-";

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Name", dataIndex: "name", key: "name", render: (value) => value || "-" },
    ...(activeType === "sector" || activeType === "role" ? [{ title: activeType === "sector" ? "Education" : "Sector", key: "parent", render: (_, record) => parentName(record) }] : []),
    { title: "Status", dataIndex: "active", key: "active", render: (value) => <Tag color={value ? "green" : "default"}>{value ? "Active" : "Inactive"}</Tag> },
    { title: "Actions", key: "actions", width: 120, render: (_, record) => (
      <Stack direction="row" spacing={0.5}>
        <Button size="small" aria-label={`Edit ${record.name}`} onClick={() => openEdit(record)}><EditOutlined /></Button>
        <Popconfirm title={`Delete ${record.name}?`} description="Existing jobs may depend on this setting." onConfirm={() => remove(record)} okText="Delete" cancelText="Cancel">
          <Button size="small" color="error" aria-label={`Delete ${record.name}`}><DeleteOutlined /></Button>
        </Popconfirm>
      </Stack>
    ) },
  ];

  const currentLabel = TYPES.find((item) => item.key === activeType)?.label || "Job Settings";

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 3 }}>
      <Typography variant="h5" fontWeight={700} color="#183b56" sx={{ mb: 2 }}>Job Settings</Typography>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={activeType} onChange={(_, value) => setActiveType(value)} variant="scrollable" scrollButtons="auto" aria-label="Job setting categories">
          {TYPES.map((type) => <Tab key={type.key} value={type.key} label={type.label} />)}
        </Tabs>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>{currentLabel}</Typography>
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={openCreate}>Add {currentLabel}</Button>
      </Stack>
      <Box sx={{ "& .ant-table": { fontSize: 13 }, "& .ant-table-thead > tr > th": { fontWeight: 600, whiteSpace: "nowrap" } }}>
        <Table rowKey="id" columns={columns} dataSource={records[activeType] || []} loading={loading} size="middle" scroll={{ x: "max-content" }} pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "25", "50"], showTotal: (total) => `${total} ${currentLabel.toLowerCase()} records` }} />
      </Box>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={save}>
          <DialogTitle>{editing ? "Edit" : "Add"} {currentLabel}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField autoFocus fullWidth required label={`${currentLabel} Name`} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} inputProps={{ maxLength: 255 }} />
              {(activeType === "sector" || activeType === "role") && (
                <TextField select fullWidth required label={activeType === "sector" ? "Education" : "Sector"} value={form.parentId} onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}>
                  {parentOptions.map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.name || `#${item.id}`}</MenuItem>)}
                </TextField>
              )}
              <FormControlLabel control={<Switch checked={Boolean(form.active)} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />} label={form.active ? "Active" : "Inactive"} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
