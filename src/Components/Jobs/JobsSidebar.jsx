import React from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { Box, Button, Paper, Stack } from "@mui/material";

const JOBS_BASE = "/wayabroadadmin/admin/jobs";
const allItems = [
  { label: "Create Job", to: `${JOBS_BASE}/create`, roles: ["superAdmin"] },
  { label: "Job List", to: `${JOBS_BASE}/list`, roles: ["superAdmin", "branch"] },
  { label: "Job Applications", to: `${JOBS_BASE}/applications`, roles: ["superAdmin", "branch"] },
  { label: "Job Settings", to: `${JOBS_BASE}/settings`, roles: ["superAdmin"] },
];

export default function JobsSidebar() {
  const { pathname } = useLocation();
  const userRole = sessionStorage.getItem("role") || "";
  const isBranch = userRole === "branch";
  const items = allItems.filter((item) => item.roles.includes(userRole));

  // Prevent Branch users from opening restricted Job Management routes directly.
  if (isBranch && (pathname === JOBS_BASE || pathname === `${JOBS_BASE}/create` || pathname === `${JOBS_BASE}/settings`)) {
    return <Navigate to={`${JOBS_BASE}/list`} replace />;
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Paper
        elevation={2}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          p: 1,
          borderRadius: "28px",
          backgroundColor: "#2980B9",
          border: "1px solid #1f5f89",
          overflowX: "auto",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ width: "100%", minWidth: isBranch ? 320 : 560 }}>
          {items.map((item) => {
            const active = pathname === item.to || (item.to.endsWith("/create") && pathname === JOBS_BASE);
            return (
              <NavLink key={item.to} to={item.to} style={{ textDecoration: "none", flex: 1 }}>
                <Button
                  fullWidth
                  sx={{
                    minHeight: 36,
                    px: 1.5,
                    color: active ? "#17212b" : "#fff",
                    backgroundColor: active ? "#fff" : "transparent",
                    border: active ? "1px solid #1f2937" : "1px solid transparent",
                    borderRadius: "24px",
                    textTransform: "none",
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    whiteSpace: "nowrap",
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
