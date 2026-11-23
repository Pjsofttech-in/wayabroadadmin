import React from "react";
import { Alert, Paper, Typography } from "@mui/material";
import { PageHeader } from "./PaidPlanUi";

// The backend has no API for listing subscription history yet (guide §1.3 and §8.2),
// so this page reports that instead of showing made-up data. Build the table here
// once one of the endpoints below exists.
const REQUIRED_APIS = [
  "GET /getSubscriptionHistoryByUser?email= — subscriptions of one institute",
  "GET /getAllSubscriptions (paginated) — all subscriptions",
  "GET /getSubscriptionsByPlanId/{planId} — institutes subscribed to a plan",
  "GET /getActiveSubscriptions and /getExpiredSubscriptions — status filters",
  "GET /getSubscriptionById/{id} — one subscription record",
];

export default function SubscriptionHistory() {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <PageHeader title="Subscription History" subtitle="Past and current subscriptions of institutes." />
      <Alert severity="info" sx={{ mb: 2 }}>
        Subscription history is not available yet because the backend does not provide an API to list it.
        Subscriptions you record under Subscription Management are saved, but cannot be viewed here until the backend adds one of the APIs below.
      </Alert>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Backend APIs required</Typography>
      <ul style={{ marginTop: 0 }}>
        {REQUIRED_APIS.map((api) => <li key={api}><Typography variant="body2">{api}</Typography></li>)}
      </ul>
    </Paper>
  );
}
