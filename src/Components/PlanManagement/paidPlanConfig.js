// Shared constants for the Plan Management module.

export const PLAN_MGMT_BASE = "/wayabroadadmin/admin/plan-management";
export const PAID_PLAN_BASE = `${PLAN_MGMT_BASE}/plans`;
export const FEATURES_PATH = `${PLAN_MGMT_BASE}/features`;
export const SUBSCRIPTION_CREATE_PATH = `${PLAN_MGMT_BASE}/subscriptions`;
export const SUBSCRIPTION_HISTORY_PATH = `${PLAN_MGMT_BASE}/subscription-history`;
export const PAYMENTS_PATH = `${PLAN_MGMT_BASE}/payments`;

// Backend currently persists only planName and mrp (guide §1.4). While this is
// false, price / discount / validity are shown disabled and are NOT sent.
// Flip to true once PlanServiceImpl.createPlan()/updatePlan() are fixed.
export const BACKEND_PERSISTS_EXTENDED_PLAN_FIELDS = false;

export const PAYMENT_MODES = ["UPI", "Card", "NetBanking", "Cash", "Cheque"];

// Razorpay public key id (never a secret). Online collection is disabled when empty.
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
