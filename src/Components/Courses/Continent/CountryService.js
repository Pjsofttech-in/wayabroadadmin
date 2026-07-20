import axiosInstance from "../../Common/axiosConfig";

export const getAllCountries = async ({ search = "", email, role, branchCode, continentId }) => {
  const params = { role, email, branchCode };
  if (search) params.search = search;
  if (continentId) params.continentId = continentId;
  const res = await axiosInstance.get("/getAllCountries", { params });
  return res.data;
};

export const createCountry = async (data, image, continentId, email, role) => {
  const formData = new FormData();
  // Only pass the country object, not nested
  formData.append("country", JSON.stringify(data));
  formData.append("continentId", continentId);
  if (image) formData.append("image", image);
  formData.append("role", role);
  formData.append("email", email);
  const res = await axiosInstance.post("/createCountry", formData);
  return res.data;
};

export const updateCountry = async (id, data, image, continentId, email, role, branchCode) => {
  const formData = new FormData();
  // Only pass the country object, not nested
  formData.append("country", JSON.stringify(data));
  if (continentId) formData.append("continentId", continentId);
  if (image) formData.append("image", image);
  formData.append("role", role);
  formData.append("email", email);
  formData.append("branchCode", branchCode);
  const res = await axiosInstance.put(`/updateCountry/${id}`, formData);
  return res.data;
};

export const deleteCountry = async (id, email, role, branchCode) => {
  await axiosInstance.delete(`/deleteCountry/${id}`, { params: { role, email, branchCode } });
};
