// Pure helpers (formatting, calculations, validation, error text) for the Paid Plan module.

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const isBlank = (v) => v === "" || v === null || v === undefined;
export const toNumberOrNull = (v) => (isBlank(v) || !Number.isFinite(Number(v)) ? null : Number(v));

export const formatINR = (value) => {
  const n = toNumberOrNull(value);
  return n === null ? "—" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

export const formatPlain = (value, suffix = "") => (isBlank(value) ? "—" : `${value}${suffix}`);

// DD MMM YYYY HH:mm
export const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// GST Amount = amount x gstPercent / 100; Total = amount + GST (display only, §3.7)
export const calcGstAmount = (amount, gstPercent) => {
  const a = toNumberOrNull(amount);
  const g = toNumberOrNull(gstPercent);
  return a === null || g === null ? 0 : round2((a * g) / 100);
};
export const calcTotalAmount = (amount, gstPercent) => {
  const a = toNumberOrNull(amount);
  return a === null ? 0 : round2(a + calcGstAmount(amount, gstPercent));
};

// Friendly error text; never shows raw status codes (§9.3).
export const getApiError = (error, { forbidden, fallback } = {}) => {
  const status = error?.response?.status;
  if (status === 403) return forbidden || "You do not have permission to perform this action.";
  if (status >= 500) return "Something went wrong. Please try again.";
  if (!error?.response) return "Network error. Please check your connection and try again.";
  const data = error.response.data;
  const serverMessage = typeof data === "string" ? data : data?.message;
  return serverMessage || fallback || "Could not complete the request.";
};

// The per-assignment id used by update/delete AdditionalFeatureValue endpoints.
// The guide's PlanAdditionalFeatureDTO does not list a row id, so prefer one if the
// backend returns it and otherwise fall back to addFeatureId (see implementation notes).
export const assignmentRowId = (feature) =>
  feature?.id ?? feature?.planAdditionalFeatureId ?? feature?.addFeatureId;

// ---------- Validation (each returns { field: message }) ----------
const isInt = (n) => Number.isInteger(n);

export const validatePlan = (v, { extendedFields }) => {
  const e = {};
  const name = (v.planName || "").trim();
  if (!name) e.planName = "Plan Name is required";
  else if (name.length < 3) e.planName = "Plan Name must be at least 3 characters";
  else if (name.length > 100) e.planName = "Plan Name must be at most 100 characters";

  const mrp = toNumberOrNull(v.mrp);
  if (isBlank(v.mrp)) e.mrp = "MRP is required";
  else if (mrp === null || mrp <= 0) e.mrp = "MRP must be greater than 0";

  if (extendedFields) {
    const price = toNumberOrNull(v.price);
    if (!isBlank(v.price)) {
      if (price === null || price < 0) e.price = "Enter a valid price";
      else if (mrp !== null && price > mrp) e.price = "Price must not exceed MRP";
    }
    const discount = toNumberOrNull(v.discount);
    if (!isBlank(v.discount) && (discount === null || discount < 0 || discount > 100)) {
      e.discount = "Discount must be between 0 and 100";
    }
    const validity = toNumberOrNull(v.validity);
    if (!isBlank(v.validity) && (validity === null || !isInt(validity) || validity <= 0)) {
      e.validity = "Validity must be a whole number greater than 0";
    }
  }
  return e;
};

export const validateFeatureName = (name) => {
  const n = (name || "").trim();
  if (!n) return "Feature Name is required";
  if (n.length < 2) return "Feature Name must be at least 2 characters";
  if (n.length > 100) return "Feature Name must be at most 100 characters";
  return "";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateSubscription = (v) => {
  const e = {};
  if (!EMAIL_RE.test((v.instituteEmail || "").trim())) e.instituteEmail = "Enter a valid email";
  if (isBlank(v.planId)) e.planId = "Please select a plan";
  if ((v.transactionId || "").trim().length < 3) e.transactionId = "Transaction ID must be at least 3 characters";
  const amount = toNumberOrNull(v.amount);
  if (amount === null || amount <= 0) e.amount = "Amount must be greater than 0";
  if (!v.paymentMode) e.paymentMode = "Please select a payment mode";
  const validity = toNumberOrNull(v.validity);
  if (validity === null || !isInt(validity) || validity <= 0) e.validity = "Validity must be a whole number greater than 0";
  if (!isBlank(v.gstPercent)) {
    const g = toNumberOrNull(v.gstPercent);
    if (g === null || g < 0) e.gstPercent = "Enter a valid GST percent";
    else if (g > 28) e.gstPercent = "GST cannot exceed 28%";
  }
  if (!isBlank(v.discountPer)) {
    const d = toNumberOrNull(v.discountPer);
    if (d === null || d < 0) e.discountPer = "Enter a valid discount";
    else if (d > 100) e.discountPer = "Discount cannot exceed 100%";
  }
  return e;
};
