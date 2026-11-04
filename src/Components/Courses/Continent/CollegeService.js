import axiosInstance from "../../Common/axiosConfig";

export const getAllColleges = async ({ universityId } = {}) => {
  const params = {};
  if (universityId !== undefined && universityId !== null && universityId !== "") {
    params.universityId = universityId;
  }
  const res = await axiosInstance.get("/getAllColleges", { params });
  return res.data;
};

export const createCollege = async (formData, email, role, universityId) => {
  const resolvedEmail = email || sessionStorage.getItem("email");
  const resolvedRole = role || sessionStorage.getItem("role");
  const resolvedUniversityId = universityId ?? formData.get("universityId");

  if (!resolvedEmail || !resolvedRole) {
    throw new Error("Authentication required. Please log in again.");
  }

  if (!resolvedUniversityId) {
    throw new Error("University information is missing. Please select a university.");
  }

  // The backend expects email, role and universityId as request parameters;
  // the college JSON and optional image remain multipart form-data parts.
  const requestFormData = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key !== "universityId") requestFormData.append(key, value);
  }

  const response = await axiosInstance.post("/createCollege", requestFormData, {
    params: {
      email: resolvedEmail,
      role: resolvedRole,
      universityId: resolvedUniversityId,
    },
    // Do not set Content-Type manually: the browser must add the multipart
    // boundary. The backend CORS config has allowCredentials=false, so this
    // JWT-authenticated API request must not use cookie credentials.
  });

  return response.data;
};

export const updateCollege = async (id, formData, email, role) => {
  const resolvedEmail = email || sessionStorage.getItem("email");
  const resolvedRole = role || sessionStorage.getItem("role");

  if (!resolvedEmail || !resolvedRole) {
    throw new Error("Authentication required. Please log in again.");
  }

  const requestFormData = new FormData();
  for (const [key, value] of formData.entries()) {
    // The update endpoint does not accept universityId.
    if (key !== "universityId") requestFormData.append(key, value);
  }

  const response = await axiosInstance.put(`/updateCollege/${id}`, requestFormData, {
    params: {
      email: resolvedEmail,
      role: resolvedRole,
    },
    // Let the browser set the multipart boundary. Do not enable cookie
    // credentials; backend CORS is configured with allowCredentials=false.
  });

  return response.data;
};

export const deleteCollege = async (id, email, role) => {
  await axiosInstance.delete(`/deleteCollege/${id}`, { params: { role, email } });
};
