import axiosInstance from "../Common/axiosConfig";

const authParams = () => ({
  role: sessionStorage.getItem("role") || "",
  email: sessionStorage.getItem("email") || "",
});

const withAuth = (params = {}) => ({ ...params, ...authParams() });

const unwrap = (response) => response?.data;

export const JOB_SETTING_RESOURCES = {
  education: "/admin/job-settings/education",
  sector: "/admin/job-settings/sector",
  role: "/admin/job-settings/role",
  currency: "/admin/job-settings/currency",
  jobType: "/admin/job-settings/job-type",
  location: "/admin/job-settings/location",
  country: "/admin/job-settings/country",
  workType: "/admin/job-settings/work-type",
};

export async function getJobSettings(type, extraParams = {}) {
  const path = JOB_SETTING_RESOURCES[type];
  if (!path) throw new Error(`Unsupported job setting: ${type}`);
  const response = await axiosInstance.get(path, { params: withAuth(extraParams) });
  return unwrap(response);
}

export async function getJobSettingById(type, id) {
  const path = JOB_SETTING_RESOURCES[type];
  if (!path) throw new Error(`Unsupported job setting: ${type}`);
  const response = await axiosInstance.get(`${path}/${id}`, { params: withAuth() });
  return unwrap(response);
}

export async function createJobSetting(type, data, extraParams = {}) {
  const path = JOB_SETTING_RESOURCES[type];
  if (!path) throw new Error(`Unsupported job setting: ${type}`);
  const response = await axiosInstance.post(path, data, { params: withAuth(extraParams) });
  return unwrap(response);
}

export async function updateJobSetting(type, id, data, extraParams = {}) {
  const path = JOB_SETTING_RESOURCES[type];
  if (!path) throw new Error(`Unsupported job setting: ${type}`);
  const response = await axiosInstance.put(`${path}/${id}`, data, { params: withAuth(extraParams) });
  return unwrap(response);
}

export async function deleteJobSetting(type, id) {
  const path = JOB_SETTING_RESOURCES[type];
  if (!path) throw new Error(`Unsupported job setting: ${type}`);
  const response = await axiosInstance.delete(`${path}/${id}`, { params: withAuth() });
  return unwrap(response);
}

export async function getJobs() {
  const response = await axiosInstance.get("/admin/jobs/getAllJobs");
  return unwrap(response);
}

export async function getJobById(id) {
  const response = await axiosInstance.get(`/admin/jobs/${id}`, { params: withAuth() });
  return unwrap(response);
}

export async function searchJobs(filters = {}) {
  const params = { ...filters, ...authParams() };
  Object.keys(params).forEach((key) => {
    if (params[key] === "" || params[key] === null || params[key] === undefined) delete params[key];
  });
  const response = await axiosInstance.get("/admin/jobs/search", { params });
  return unwrap(response);
}

export async function createJob(data) {
  const response = await axiosInstance.post("/admin/jobs", data, { params: withAuth() });
  return unwrap(response);
}

export async function updateJob(id, data) {
  const response = await axiosInstance.put(`/admin/jobs/${id}`, data, { params: withAuth() });
  return unwrap(response);
}

export async function deleteJob(id) {
  const response = await axiosInstance.delete(`/admin/jobs/${id}`, { params: withAuth() });
  return unwrap(response);
}

export async function getJobApplications({ page = 0, size = 10 } = {}) {
  const response = await axiosInstance.get("/job-applications/admin", {
    params: withAuth({ page, size }),
  });
  return unwrap(response);
}

// The backend search is POST /job-applications/admin/search:
//   body   = JobApplicationFilterDTO (JSON)
//   params = page, size, sort ("property,ASC|DESC"), role, email
// Callers keep passing a flat filter object (jobId, status, page, size, sortBy, sortDir ...).
const APPLICATION_SORT_FIELDS = ["id", "appliedAt", "applicantName", "status", "statusUpdatedAt"];
const DEFAULT_APPLICATION_SORT = "appliedAt,DESC";
const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : undefined);

export async function searchJobApplications(filters = {}) {
  const { page = 0, size = 10, sortBy, sortDir } = filters;

  // Only filters the backend applies reliably are sent. applicantEmail / phone were exact
  // matches on the server and appliedFrom / appliedTo were not usable, so the pages keep
  // matching those in the browser (see matchesClientFilters).
  const body = {};
  const jobId = toNumber(filters.jobId);
  const countryId = toNumber(filters.countryId);
  const sectorId = toNumber(filters.sectorId);
  if (filters.jobId !== "" && jobId !== undefined) body.jobId = jobId;
  if (filters.countryId !== "" && countryId !== undefined) body.countryId = countryId;
  if (filters.sectorId !== "" && sectorId !== undefined) body.sectorId = sectorId;
  if (filters.status) body.status = filters.status;
  if (filters.applicantEmail) body.applicantEmail = filters.applicantEmail;
  if (filters.applicantName) body.applicantName = filters.applicantName;

  const sort = APPLICATION_SORT_FIELDS.includes(sortBy)
    ? `${sortBy},${String(sortDir).toUpperCase() === "DESC" ? "DESC" : "ASC"}`
    : DEFAULT_APPLICATION_SORT;

  const response = await axiosInstance.post("/job-applications/admin/search", body, {
    params: { page, size, sort, ...authParams() },
  });
  return unwrap(response);
}

export async function getJobApplicationById(id) {
  const response = await axiosInstance.get(`/job-applications/admin/${id}`, { params: withAuth() });
  return unwrap(response);
}

export async function updateJobApplicationStatus(id, status, remark) {
  const response = await axiosInstance.put(`/job-applications/admin/${id}/status`, null, {
    params: withAuth({ status, remark }),
  });
  return unwrap(response);
}

export async function deactivateJobApplication(id) {
  const response = await axiosInstance.delete(`/job-applications/admin/${id}`, { params: withAuth() });
  return unwrap(response);
}


export async function createJobApplication(formData) {
  const response = await axiosInstance.post("/job-applications/apply", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(response);
}
