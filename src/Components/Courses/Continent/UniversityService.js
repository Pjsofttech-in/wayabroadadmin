import axiosInstance from "../../Common/axiosConfig";

export const getAllUniversity = async ({ search = "", email, role, branchCode, countryId, cityId }) => {
  const params = { role, email, branchCode };
  if (search) params.search = search;
  if (countryId) params.countryId = countryId;
  if (cityId) params.cityId = cityId;
  const res = await axiosInstance.get("/getAllUniversities", { params });
  return res.data;
};

export const createUniversity = async (data, image, countryId, email, role, cityId) => {
  const formData = new FormData();
  formData.append("university", JSON.stringify(data));
  if (countryId) formData.append("countryId", countryId);
  if (cityId) formData.append("cityId", cityId);
  if (image) formData.append("image", image);
  formData.append("role", role);
  formData.append("email", email);
  const res = await axiosInstance.post("/createUniversity", formData);
  return res.data;
};

export const updateUniversity = async (id, data, image, countryId, email, role, branchCode, cityId) => {
  const formData = new FormData();
  formData.append("university", JSON.stringify(data));
  if (countryId) formData.append("countryId", countryId);
  if (cityId) formData.append("cityId", cityId);
  if (image) formData.append("image", image);
  formData.append("role", role);
  formData.append("email", email);
  formData.append("branchCode", branchCode);
  const res = await axiosInstance.put(`/updateUniversity/${id}`, formData);
  return res.data;
};

export const deleteUniversity = async (id, email, role, branchCode) => {
  await axiosInstance.delete(`/deleteUniversity/${id}`, { params: { role, email, branchCode } });
};
