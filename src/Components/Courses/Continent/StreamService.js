import axiosInstance from "../../Common/axiosConfig";

export const getAllStreams = async ({ search = "", email, role, branchCode, collegeId }) => {
  const params = { role, email };
  if (branchCode) params.branchCode = branchCode;
  if (search) params.search = search;
  if (collegeId) params.collegeId = collegeId;
  const res = await axiosInstance.get("/getAllStreams", { params });
  return res.data;
};

export const createStream = async (data, image, role, email, collegeId, branchCode) => {
  const formData = new FormData();
  formData.append("stream", JSON.stringify(data));
  if (image) formData.append("image", image);
  formData.append("role", role);
  formData.append("email", email);
  if (collegeId) formData.append("collegeId", collegeId);
  if (branchCode) formData.append("branchCode", branchCode);
  const res = await axiosInstance.post("/createStream", formData);
  return res.data;
};

export const updateStream = async (id, data, image, email, role, branchCode) => {
  const formData = new FormData();
  formData.append("stream", JSON.stringify(data));
  if (image) formData.append("image", image);
  formData.append("role", role);
  formData.append("email", email);
  if (branchCode) formData.append("branchCode", branchCode);
  const res = await axiosInstance.put(`/updateStream/${id}`, formData);
  return res.data;
};

export const deleteStream = async (id, role, email, branchCode) => {
  const params = { role, email };
  if (branchCode) params.branchCode = branchCode;
  await axiosInstance.delete(`/deleteStream/${id}`, { params });
};
