import React from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { Box, Button, Paper, Stack } from "@mui/material";
import {
  FEATURES_PATH, PAID_PLAN_BASE, PAYMENTS_PATH,
  SUBSCRIPTION_CREATE_PATH, SUBSCRIPTION_HISTORY_PATH,
} from "./paidPlanConfig";

// Tab bar + outlet for the Plan Management section (same look as the other section sidebars).
// `match` decides when a tab is highlighted; Plan List also covers plan detail/edit routes.
const ITEMS = [
  {
    label: "Plan List", to: PAID_PLAN_BASE,
    match: (p) => p === PAID_PLAN_BASE || (p.startsWith(`${PAID_PLAN_BASE}/`) && p !== `${PAID_PLAN_BASE}/create`),
  },
  { label: "Create Plan", to: `${PAID_PLAN_BASE}/create`, match: (p) => p === `${PAID_PLAN_BASE}/create` },
  { label: "Subscription Management", to: SUBSCRIPTION_CREATE_PATH, match: (p) => p === SUBSCRIPTION_CREATE_PATH },
  { label: "Subscription History", to: SUBSCRIPTION_HISTORY_PATH, match: (p) => p === SUBSCRIPTION_HISTORY_PATH },
  { label: "Additional Features", to: FEATURES_PATH, match: (p) => p === FEATURES_PATH },
  { label: "Payments", to: PAYMENTS_PATH, match: (p) => p === PAYMENTS_PATH || p.startsWith(`${PAYMENTS_PATH}/`) },
];

export default function PlanSidebar() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "");
  const userRole = sessionStorage.getItem("role") || "";

  // Plan Management is superAdmin-only (same as the sidebar entry); block direct URL access.
  if (userRole !== "superAdmin") {
    return <Navigate to="/wayabroadadmin/admin/dashboard" replace />;
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Paper
        elevation={2}
        sx={{
          display: "flex", justifyContent: "space-between", mb: 2, p: 1, borderRadius: "28px",
          backgroundColor: "#2980B9", border: "1px solid #1f5f89", overflowX: "auto",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ width: "100%", minWidth: ITEMS.length * 150 }}>
          {ITEMS.map((item) => {
            const active = item.match(path);
            return (
              <NavLink key={item.to} to={item.to} style={{ textDecoration: "none", flex: 1 }}>
                <Button
                  fullWidth
                  sx={{
                    minHeight: 36, px: 1.5,
                    color: active ? "#17212b" : "#fff",
                    backgroundColor: active ? "#fff" : "transparent",
                    border: active ? "1px solid #1f2937" : "1px solid transparent",
                    borderRadius: "24px", textTransform: "none", fontSize: 12,
                    fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                    "&:hover": { backgroundColor: active ? "#f5f5f5" : "#1f618d" },
                  }}
                >
                  {item.label}
                </Button>
              </NavLink>
            );
          })}
        </Stack>
      </Paper>
      <Outlet />
    </Box>
  );
}
