import axiosInstance from "../Utils/axiosConfig";

// Get all branches
export const getAllBranches = async () => {
  const res = await axiosInstance.get(`/getAllBranches`);
  return res.data;
};

// Create branch
export const createBranch = async (branchData, superAdminEmail) => {
  const res = await axiosInstance.post(
    `/createBranch?superAdminEmail=${encodeURIComponent(superAdminEmail)}`,
    branchData,
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};

// Update branch
export const updateBranch = async (id, branchData) => {
  const res = await axiosInstance.put(
    `/updateBranch/${id}`,
    branchData,
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};

// Delete branch
export const deleteBranch = async (id) => {
  const res = await axiosInstance.delete(`/deleteBranch/${id}`);
  return res.data;
};
