import React, { useState } from "react";
import { Alert, Box, Button, Grid, TextField, Typography } from "@mui/material";
import { message } from "antd";
import { createOrder, loadRazorpayScript, openCheckout, verifyPayment } from "./paymentService";
import { RAZORPAY_KEY_ID } from "./paidPlanConfig";
import { formatINR, getApiError } from "./paidPlanUtils";

// Optional online collection (§3.8): create order -> Razorpay checkout -> verify.
// Calls onPaid({ paymentId, orderId }) after a verified payment.
export default function RazorpayCollect({ amountPayable, paymentMode, email, onPaid }) {
  const [mobileNo, setMobileNo] = useState("");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [paidId, setPaidId] = useState("");

  if (!RAZORPAY_KEY_ID) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Online collection through Razorpay is off because <code>VITE_RAZORPAY_KEY_ID</code> is not configured.
        Record offline payments by entering the transaction ID above.
      </Alert>
    );
  }

  const pay = async () => {
    if (!(amountPayable > 0)) { message.error("Enter an amount greater than 0 first."); return; }
    if (!paymentMode) { message.error("Select a payment mode first."); return; }
    if (!/^\d{10}$/.test(mobileNo)) { message.error("Enter a valid 10-digit mobile number."); return; }

    setBusy(true);
    try {
      if (!(await loadRazorpayScript())) throw new Error("Razorpay checkout could not be loaded.");
      const payload = { amount: amountPayable, mobileNo, paymentStatus: "PENDING", paymentMode };
      if (userId.trim()) payload.userId = Number(userId);
      const order = await createOrder(payload);
      if (!order?.id) throw new Error("The server did not return a Razorpay order.");

      const response = await openCheckout(order, { contact: mobileNo, email, description: "Paid plan subscription" });
      const result = await verifyPayment({
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      });
      if (!/success/i.test(String(result))) throw new Error("Payment verification failed.");

      setPaidId(response.razorpay_payment_id);
      onPaid?.({ paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id });
      message.success("Payment successful");
    } catch (e) {
      console.error("Razorpay payment failed:", e);
      message.error(e?.response ? getApiError(e) : e.message || "Payment failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: "1px dashed #b0bec5", borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Collect payment online (Razorpay)</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField fullWidth size="small" label="Mobile No" value={mobileNo} disabled={busy}
            onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth size="small" type="number" label="User ID (optional)" value={userId} disabled={busy}
            onChange={(e) => setUserId(e.target.value)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button fullWidth variant="contained" color="success" onClick={pay} disabled={busy || Boolean(paidId)}>
            {busy ? "Processing..." : `Pay ${formatINR(amountPayable)}`}
          </Button>
        </Grid>
      </Grid>
      {paidId && <Alert severity="success" sx={{ mt: 1 }}>Payment verified. Payment ID {paidId} was filled in as the Transaction ID.</Alert>}
    </Box>
  );
}
