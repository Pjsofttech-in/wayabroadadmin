import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Paper } from "@mui/material";
import { EyeOutlined } from "@ant-design/icons";
import { Table, Tag } from "antd";
import { getAllPayments } from "./paymentService";
import { PAYMENTS_PATH } from "./paidPlanConfig";
import { formatDateTime, formatINR, getApiError } from "./paidPlanUtils";
import { ActiveBadge, PageHeader, PaymentStatusBadge } from "./PaidPlanUi";

const dash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

export default function PaymentList() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load payments:", e);
      setError(getApiError(e, { forbidden: "You do not have permission to view payments." }));
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    { title: "Amount", dataIndex: "amount", key: "amount", render: formatINR },
    { title: "Order ID", dataIndex: "orderId", key: "orderId", render: dash },
    { title: "Payment ID", dataIndex: "paymentId", key: "paymentId", render: dash },
    { title: "Transaction ID", dataIndex: "transactionId", key: "transactionId", render: dash },
    { title: "Mode", dataIndex: "paymentMode", key: "paymentMode", render: (v) => (v ? <Tag>{v}</Tag> : "—") },
    { title: "Status", dataIndex: "paymentStatus", key: "paymentStatus", render: (v) => <PaymentStatusBadge status={v} /> },
    { title: "Date", dataIndex: "paymentDate", key: "paymentDate", render: formatDateTime },
    { title: "Active", dataIndex: "active", key: "active", render: (v) => <ActiveBadge active={v} /> },
    { title: "User ID", dataIndex: "userId", key: "userId", render: dash },
    { title: "User Name", dataIndex: "userName", key: "userName", render: dash },
    {
      title: "Actions", key: "actions", width: 80,
      render: (_, payment) => (
        <Button size="small" aria-label={`View payment ${payment.id}`} onClick={() => navigate(`${PAYMENTS_PATH}/${payment.id}`)}><EyeOutlined /></Button>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <PageHeader title="Payments" subtitle="Payment records for paid plans." />
      {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error}</Alert>}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={payments}
        loading={loading}
        locale={{ emptyText: "No payments found" }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 1200 }}
      />
    </Paper>
  );
}
