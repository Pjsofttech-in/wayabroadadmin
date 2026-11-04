import axiosInstance from "../../Common/axiosConfig";

// The current backend Stream endpoints accept only the Stream JSON part
// plus role/email for create and update. Image, collegeId and branchCode
// are not part of this controller contract.
export const getAllStreams = async () => {
  const res = await axiosInstance.get("/getAllStreams");
  return res.data;
};

export const createStream = async (data, role, email) => {
  const formData = new FormData();
  formData.append("stream", JSON.stringify(data));
  formData.append("role", role);
  formData.append("email", email);
  const res = await axiosInstance.post("/createStream", formData);
  return res.data;
};

export const updateStream = async (id, data, email, role) => {
  const formData = new FormData();
  formData.append("stream", JSON.stringify(data));
  formData.append("role", role);
  formData.append("email", email);
  const res = await axiosInstance.put(`/updateStream/${id}`, formData);
  return res.data;
};

export const deleteStream = async (id, role, email) => {
  await axiosInstance.delete(`/deleteStream/${id}`, { params: { role, email } });
};
