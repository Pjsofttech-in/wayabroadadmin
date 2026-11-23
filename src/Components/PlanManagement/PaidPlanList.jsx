import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Paper, Stack } from "@mui/material";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { Popconfirm, Table, message } from "antd";
import { deletePlan, getAllPlans } from "./planService";
import { PAID_PLAN_BASE, SUBSCRIPTION_CREATE_PATH } from "./paidPlanConfig";
import { formatINR, formatPlain, getApiError } from "./paidPlanUtils";
import { PageHeader } from "./PaidPlanUi";

export default function PaidPlanList() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load plans:", e);
      setError(getApiError(e, { forbidden: "You do not have permission to view plans." }));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (plan) => {
    try {
      await deletePlan(plan.id);
      setPlans((previous) => previous.filter((p) => p.id !== plan.id));
      message.success("Plan deleted successfully");
    } catch (e) {
      console.error("Failed to delete plan:", e);
      message.error(getApiError(e, { forbidden: "You do not have permission to delete plans." }));
    }
  };

  const columns = [
    { title: "Plan ID", dataIndex: "id", key: "id", width: 90 },
    { title: "Plan Name", dataIndex: "planName", key: "planName" },
    { title: "MRP (₹)", dataIndex: "mrp", key: "mrp", render: formatINR },
    { title: "Price (₹)", dataIndex: "price", key: "price", render: formatINR },
    { title: "Discount (%)", dataIndex: "discount", key: "discount", render: (v) => formatPlain(v, "%") },
    { title: "Validity (Months)", dataIndex: "validity", key: "validity", render: (v) => formatPlain(v) },
    {
      title: "Features", key: "features", width: 100,
      render: (_, plan) => (Array.isArray(plan.additionalFeatures) ? plan.additionalFeatures.length : 0),
    },
    {
      title: "Actions", key: "actions", width: 150,
      render: (_, plan) => (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" aria-label={`View ${plan.planName}`} title="View Details" onClick={() => navigate(`${PAID_PLAN_BASE}/${plan.id}`)}><EyeOutlined /></Button>
          <Button size="small" aria-label={`Edit ${plan.planName}`} title="Edit" onClick={() => navigate(`${PAID_PLAN_BASE}/edit/${plan.id}`)}><EditOutlined /></Button>
          <Popconfirm title={`Delete ${plan.planName}?`} description="This permanently deletes the plan and its feature assignments." onConfirm={() => remove(plan)} okText="Delete" cancelText="Cancel">
            <Button size="small" color="error" aria-label={`Delete ${plan.planName}`} title="Delete"><DeleteOutlined /></Button>
          </Popconfirm>
        </Stack>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <PageHeader
        title="Paid Plans"
        subtitle="Plans that control job-posting limits and features for subscribers."
        actions={(
          <>
            <Button variant="outlined" onClick={() => navigate(SUBSCRIPTION_CREATE_PATH)}>Record Subscription</Button>
            <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => navigate(`${PAID_PLAN_BASE}/create`)}>Create New Plan</Button>
          </>
        )}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error}</Alert>}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={plans}
        loading={loading}
        locale={{ emptyText: "No plans found" }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 900 }}
      />
    </Paper>
  );
}
