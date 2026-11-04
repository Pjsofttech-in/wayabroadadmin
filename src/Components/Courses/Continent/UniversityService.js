import axiosInstance from "../../Common/axiosConfig";

export const getAllUniversity = async ({ cityId } = {}) => {
  const params = {};
  if (cityId !== undefined && cityId !== null && cityId !== "") {
    params.cityId = cityId;
  }
  const res = await axiosInstance.get("/getAllUniversities", { params });
  return res.data;
};

export const createUniversity = async (data, image, email, role, cityId) => {
  const formData = new FormData();
  formData.append("university", JSON.stringify(data));
  if (image) formData.append("image", image);
  formData.append("role", role);
  formData.append("email", email);
  formData.append("cityId", String(cityId));
  const res = await axiosInstance.post("/createUniversity", formData);
  return res.data;
};

export const updateUniversity = async (id, data, image, email, role) => {
  const formData = new FormData();
  formData.append("university", JSON.stringify(data));
  if (image) formData.append("image", image);
  formData.append("role", role);
  formData.append("email", email);
  const res = await axiosInstance.put(`/updateUniversity/${id}`, formData);
  return res.data;
};

export const deleteUniversity = async (id, email, role) => {
  await axiosInstance.delete(`/deleteUniversity/${id}`, { params: { role, email } });
};
