import axiosInstance from "../Utils/axiosConfig";


export const createStaff = async (staffData, branchEmail) => {
  try {
    const response = await axiosInstance.post(`/createStaff`, staffData, {
      params: { branchEmail }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getStaffById = async (id) => {
  try {
    const response = await axiosInstance.get(`/getStaffById/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllStaff = async (branchCode) => {
  try {
    const response = await axiosInstance.get(`/getAllStaffWithBranchCode`, {
      params: { branchCode }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateStaff = async (id, staffData) => {
  try {
    const response = await axiosInstance.put(`/updateStaff/${id}`, staffData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteStaff = async (id) => {
  try {
    await axiosInstance.delete(`/deleteStaff/${id}`);
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getStaffPermissions = async (email) => {
  try {
    const response = await axiosInstance.get(`/permissionForStaff`, {
      params: { staffEmail: email }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
