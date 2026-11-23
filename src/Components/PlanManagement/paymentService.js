import client, { PAYMENTS_API, unwrap } from "./paidPlanClient";
import { RAZORPAY_KEY_ID } from "./paidPlanConfig";

export const getAllPayments = async () => unwrap(await client.get(PAYMENTS_API));
export const getPaymentById = async (id) => unwrap(await client.get(`${PAYMENTS_API}/${id}`));

// Razorpay flow (§3.8). Step 1-2: create order.
export const createOrder = async (payload) => {
  const data = unwrap(await client.post(`${PAYMENTS_API}/create-order`, payload));
  // The backend returns the Razorpay order JSON; accept it as an object or a JSON string.
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return { id: data }; }
  }
  return data;
};

// Step 5: verify signature. Resolves to the backend text ("Payment Successful" / "Payment Failed").
export const verifyPayment = async ({ orderId, paymentId, signature }) =>
  unwrap(await client.post(`${PAYMENTS_API}/verify`, { orderId, paymentId, signature }));

let scriptPromise;
export const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => { scriptPromise = undefined; resolve(false); };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
};

// Step 3-4: open checkout for an order and resolve with Razorpay's response
// ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }).
export const openCheckout = (order, { name, description, contact, email } = {}) =>
  new Promise((resolve, reject) => {
    if (!window.Razorpay) { reject(new Error("Razorpay checkout could not be loaded.")); return; }
    const checkout = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency || "INR",
      name: name || "Wayabroad",
      description,
      prefill: { contact, email },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
    });
    checkout.on?.("payment.failed", (event) =>
      reject(new Error(event?.error?.description || "Payment failed.")));
    checkout.open();
  });
