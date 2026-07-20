import axiosInstance from "../../Common/axiosConfig";

export const getAllContinents = async (role, email) => {
  const res = await axiosInstance.get("/getAllContinents", { 
    params: { role, email } 
  });
  return res.data;
};

export const getContinentById = async (id, role, email) => {
  const res = await axiosInstance.get(`/getContinentById/${id}`, {
    params: { role, email }
  });
  return res.data;
};

export const createContinent = async (data, role, email) => {
  const formData = new FormData();
  formData.append("continent", JSON.stringify(data.continent));
  if (data.image) {
    formData.append("image", data.image);
  }
  formData.append("role", role);
  formData.append("email", email);
  
  const res = await axiosInstance.post("/createContinent", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const updateContinent = async (id, data, role, email) => {
  const formData = new FormData();
  formData.append("continent", JSON.stringify(data.continent));
  if (data.image) {
    formData.append("image", data.image);
  }
  formData.append("role", role);
  formData.append("email", email);
  
  const res = await axiosInstance.put(`/updateContinent/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const deleteContinent = async (id, role, email) => {
  const res = await axiosInstance.delete(`/deleteContinent/${id}`, {
    params: { role, email }
  });
  return res.data;
};