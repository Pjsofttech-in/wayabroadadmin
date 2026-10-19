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
  const response = await axiosInstance.get("/admin/jobs", { params: withAuth() });
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

export async function searchJobApplications(filters = {}) {
  const params = { ...filters, ...authParams() };
  Object.keys(params).forEach((key) => {
    if (params[key] === "" || params[key] === null || params[key] === undefined) delete params[key];
  });
  const response = await axiosInstance.get("/job-applications/admin/search", { params });
  return unwrap(response);
}

export async function getJobApplicationById(id) {
  const response = await axiosInstance.get(`/job-applications/admin/${id}`, { params: withAuth() });
  return unwrap(response);
}

export async function updateJobApplicationStatus(id, status) {
  const response = await axiosInstance.put(`/job-applications/admin/${id}/status`, null, {
    params: withAuth({ status }),
  });
  return unwrap(response);
}

export async function deactivateJobApplication(id) {
  const response = await axiosInstance.delete(`/job-applications/admin/${id}`, { params: withAuth() });
  return unwrap(response);
}
