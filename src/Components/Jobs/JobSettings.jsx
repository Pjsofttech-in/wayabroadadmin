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
  { key: "education", label: "Education" },
  { key: "sector", label: "Sector", parentLabel: "Education" },
  { key: "role", label: "Role", parentLabel: "Sector" },
  { key: "currency", label: "Currency" },
  { key: "jobType", label: "Job Type" },
  { key: "country", label: "Country" },
  { key: "location", label: "Location", parentLabel: "Country" },
  { key: "workType", label: "Work Type" },
];

const emptyForm = { name: "", active: true, parentId: "" };
const recordName = (type, record) => type === "location"
  ? record?.location ?? record?.name ?? ""
  : record?.name ?? record?.location ?? "";
const recordCountryId = (record) => record?.countryId ?? record?.country?.id ?? "";
const getParentId = (type, record) => {
  if (type === "sector") return record?.education?.id ?? record?.educationId ?? "";
  if (type === "role") return record?.sector?.id ?? record?.sectorId ?? "";
  if (type === "location") return recordCountryId(record);
  return "";
};

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
      const parentType = type === "sector" ? "education"
        : type === "role" ? "sector"
          : type === "location" ? "country" : null;
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

  const parentOptions = useMemo(() => {
    if (activeType === "sector") return records.education || [];
    if (activeType === "role") return records.sector || [];
    if (activeType === "location") return records.country || [];
    return [];
  }, [activeType, records.education, records.sector, records.country]);

  const ensureParentOptions = (type) => {
    const parentType = type === "sector" ? "education"
      : type === "role" ? "sector"
        : type === "location" ? "country" : null;
    if (parentType && !records[parentType]) {
      getJobSettings(parentType)
        .then((data) => setRecords((previous) => ({ ...previous, [parentType]: Array.isArray(data) ? data : [] })))
        .catch((e) => console.error(`Failed to load ${parentType} options:`, e));
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
    ensureParentOptions(activeType);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm({
      name: recordName(activeType, record),
      active: record.active !== false,
      parentId: String(getParentId(activeType, record) || ""),
    });
    setDialogOpen(true);
    ensureParentOptions(activeType);
  };

  const save = async (event) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      message.error(`${currentLabel} name is required.`);
      return;
    }
    const needsParent = ["sector", "role", "location"].includes(activeType);
    if (needsParent && !form.parentId) {
      message.error(`${activeType === "sector" ? "Education" : activeType === "role" ? "Sector" : "Country"} is required.`);
      return;
    }
    const payload = activeType === "location"
      ? {
          // Backend entity maps AbroadJobLocation.name to JSON property "location".
          location: trimmedName,
          countryId: Number(form.parentId),
          active: Boolean(form.active),
        }
      : { name: trimmedName, active: Boolean(form.active) };
    const extraParams = activeType === "sector"
      ? { educationId: Number(form.parentId) }
      : activeType === "role"
        ? { sectorId: Number(form.parentId) }
        : {};

    setSaving(true);
    try {
      if (editing) await updateJobSetting(activeType, editing.id, payload, extraParams);
      else await createJobSetting(activeType, payload, extraParams);
      message.success(`${currentLabel} ${editing ? "updated" : "created"} successfully.`);
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await loadType(activeType);
    } catch (e) {
      console.error(`Failed to save ${activeType} setting:`, e);
      message.error(e?.response?.data?.message || `Could not save ${currentLabel.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    try {
      await deleteJobSetting(activeType, record.id);
      message.success(`${currentLabel} deleted successfully.`);
      await loadType(activeType);
    } catch (e) {
      console.error(`Failed to delete ${activeType} setting:`, e);
      message.error(e?.response?.data?.message || "Could not delete setting. It may be used by existing jobs.");
    }
  };

  const parentName = (record) => {
    if (activeType === "sector") {
      const id = record.educationId ?? record.education?.id;
      return record.education?.name || (records.education || []).find((item) => String(item.id) === String(id))?.name || "-";
    }
    if (activeType === "role") {
      const id = record.sectorId ?? record.sector?.id;
      return record.sector?.name || (records.sector || []).find((item) => String(item.id) === String(id))?.name || "-";
    }
    if (activeType === "location") {
      const id = recordCountryId(record);
      return record.countryName || record.country?.name || (records.country || []).find((item) => String(item.id) === String(id))?.name || "-";
    }
    return "-";
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    {
      title: "Name", key: "name",
      render: (_, record) => recordName(activeType, record) || "-",
    },
    ...(["sector", "role", "location"].includes(activeType)
      ? [{ title: activeType === "sector" ? "Education" : activeType === "role" ? "Sector" : "Country", key: "parent", render: (_, record) => parentName(record) }]
      : []),
    {
      title: "Status", dataIndex: "active", key: "active",
      render: (value) => <Tag color={value ? "green" : "default"}>{value ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Actions", key: "actions", width: 120,
      render: (_, record) => (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" aria-label={`Edit ${recordName(activeType, record)}`} onClick={() => openEdit(record)}><EditOutlined /></Button>
          <Popconfirm title={`Delete ${recordName(activeType, record)}?`} description="Existing jobs may depend on this setting." onConfirm={() => remove(record)} okText="Delete" cancelText="Cancel">
            <Button size="small" color="error" aria-label={`Delete ${recordName(activeType, record)}`}><DeleteOutlined /></Button>
          </Popconfirm>
        </Stack>
      ),
    },
  ];

  const currentLabel = TYPES.find((item) => item.key === activeType)?.label || "Job Settings";
  const parentLabel = activeType === "sector" ? "Education" : activeType === "role" ? "Sector" : "Country";

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
              <TextField
                autoFocus fullWidth required label={`${currentLabel} Name`}
                value={form.name}
                onChange={(e) => setForm((previous) => ({ ...previous, name: e.target.value }))}
                inputProps={{ maxLength: 255 }}
              />
              {["sector", "role", "location"].includes(activeType) && (
                <TextField
                  select fullWidth required label={parentLabel}
                  value={form.parentId}
                  onChange={(e) => setForm((previous) => ({ ...previous, parentId: e.target.value }))}
                >
                  <MenuItem value="" disabled>Select {parentLabel}</MenuItem>
                  {parentOptions.map((item) => (
                    <MenuItem key={item.id} value={String(item.id)}>
                      {item.name ?? item.location ?? item.countryName ?? `#${item.id}`}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <FormControlLabel
                control={<Switch checked={Boolean(form.active)} onChange={(e) => setForm((previous) => ({ ...previous, active: e.target.checked }))} />}
                label={form.active ? "Active" : "Inactive"}
              />
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
