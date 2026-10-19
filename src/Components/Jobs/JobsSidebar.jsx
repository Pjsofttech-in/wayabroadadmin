import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Box, Button, Paper, Stack } from "@mui/material";

const items = [
  { label: "Create Job", to: "/wayabroadadmin/admin/jobs/create" },
  { label: "Job List", to: "/wayabroadadmin/admin/jobs/list" },
  { label: "Job Applications", to: "/wayabroadadmin/admin/jobs/applications" },
  { label: "Job Settings", to: "/wayabroadadmin/admin/jobs/settings" },
];

export default function JobsSidebar() {
  const { pathname } = useLocation();

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
        <Stack direction="row" spacing={1} sx={{ width: "100%", minWidth: 560 }}>
          {items.map((item) => {
            const active = pathname === item.to ||
              (item.to.endsWith("/create") && pathname === "/wayabroadadmin/admin/jobs");
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
