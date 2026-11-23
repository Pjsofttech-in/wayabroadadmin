import React from "react";
import { Box, Typography } from "@mui/material";
import { Tag } from "antd";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#17212b" }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {actions && <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{actions}</Box>}
    </Box>
  );
}

// Green = enabled, grey = disabled (§3.4)
export function FeatureBadge({ enabled }) {
  return <Tag color={enabled ? "green" : "default"}>{enabled ? "Enabled" : "Disabled"}</Tag>;
}

// SUCCESS = green, FAILED = red, PENDING = orange (Appendix B)
const STATUS_COLORS = { SUCCESS: "green", FAILED: "red", PENDING: "orange" };
export function PaymentStatusBadge({ status }) {
  if (!status) return <span>—</span>;
  return <Tag color={STATUS_COLORS[String(status).toUpperCase()] || "default"}>{status}</Tag>;
}

export function ActiveBadge({ active }) {
  if (active === null || active === undefined) return <span>—</span>;
  return <Tag color={active ? "green" : "default"}>{active ? "Active" : "Inactive"}</Tag>;
}
