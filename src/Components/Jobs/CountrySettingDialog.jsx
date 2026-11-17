import React, { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Stack, Switch, TextField,
} from "@mui/material";
import { message } from "antd";
import { createJobSetting, getJobSettings, updateJobSetting } from "./JobService";

const EMPTY_FORM = { name: "", active: true };

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

/**
 * Shared Country create/edit dialog used by Job Settings and Job Form.
 * Keeps the Country payload, validation, API calls and feedback in one place.
 */
export default function CountrySettingDialog({
  open,
  editing = null,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: editing?.name ?? editing?.countryName ?? "",
      active: editing?.active !== false,
    });
  }, [open, editing]);

  const handleClose = () => {
    if (!saving) onClose?.();
  };

  const save = async (event) => {
    event.preventDefault();
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      message.error("Country name is required.");
      return;
    }

    const payload = {
      name: trimmedName,
      active: Boolean(form.active),
    };

    setSaving(true);
    try {
      let created = null;
      if (editing) {
        await updateJobSetting("country", editing.id, payload);
      } else {
        created = await createJobSetting("country", payload);
      }

      const refreshedCountries = asArray(await getJobSettings("country"));
      message.success(`Country ${editing ? "updated" : "created"} successfully.`);
      await onSaved?.(refreshedCountries, created);
      onClose?.();
    } catch (error) {
      console.error("Failed to save country setting:", error);
      message.error(
        error?.response?.data?.message ||
        "Could not save country."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={save}>
        <DialogTitle>{editing ? "Edit" : "Add"} Country</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              required
              label="Country Name"
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, name: event.target.value }))
              }
              inputProps={{ maxLength: 255 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.active)}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      active: event.target.checked,
                    }))
                  }
                />
              }
              label={form.active ? "Active" : "Inactive"}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
