import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Paper } from "@mui/material";
import { Descriptions } from "antd";
import { getPaymentById } from "./paymentService";
import { PAYMENTS_PATH } from "./paidPlanConfig";
import { formatDateTime, formatINR, getApiError } from "./paidPlanUtils";
import { ActiveBadge, PageHeader, PaymentStatusBadge } from "./PaidPlanUi";

const dash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

export default function PaymentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getPaymentById(id);
        if (!cancelled) setPayment(data);
      } catch (e) {
        console.error("Failed to load payment:", e);
        if (!cancelled) setError(getApiError(e, { forbidden: "You do not have permission to view this payment." }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <Paper sx={{ p: 2, borderRadius: 2, maxWidth: 900 }}>
      <PageHeader
        title={`Payment #${id}`}
        actions={<Button variant="outlined" onClick={() => navigate(PAYMENTS_PATH)}>Back to Payments</Button>}
      />
      {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && payment && (
        <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="ID">{dash(payment.id)}</Descriptions.Item>
          <Descriptions.Item label="Amount">{formatINR(payment.amount)}</Descriptions.Item>
          <Descriptions.Item label="Order ID">{dash(payment.orderId)}</Descriptions.Item>
          <Descriptions.Item label="Payment ID">{dash(payment.paymentId)}</Descriptions.Item>
          <Descriptions.Item label="Transaction ID">{dash(payment.transactionId)}</Descriptions.Item>
          <Descriptions.Item label="Mode">{dash(payment.paymentMode)}</Descriptions.Item>
          <Descriptions.Item label="Status"><PaymentStatusBadge status={payment.paymentStatus} /></Descriptions.Item>
          <Descriptions.Item label="Date">{formatDateTime(payment.paymentDate)}</Descriptions.Item>
          <Descriptions.Item label="Active"><ActiveBadge active={payment.active} /></Descriptions.Item>
          <Descriptions.Item label="User ID">{dash(payment.userId)}</Descriptions.Item>
          <Descriptions.Item label="User Name">{dash(payment.userName)}</Descriptions.Item>
        </Descriptions>
      )}
      {!loading && !error && !payment && <Alert severity="warning">Payment not found.</Alert>}
    </Paper>
  );
}
