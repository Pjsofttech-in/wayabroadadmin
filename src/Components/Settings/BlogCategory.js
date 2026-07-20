import axiosInstance from "../Common/axiosConfig";

// Create a new blog category
export const createCategory = async (categoryData) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';

  try {
    // Validate categoryData
    if (!categoryData || !categoryData.category || !categoryData.category.trim()) {
      throw new Error('Category name is required');
    }

    // Ensure the payload matches exactly what the backend expects
    const payload = {
      category: categoryData.category.trim()
    };

    const response = await axiosInstance.post('/addCategory', payload, {
      params: { role, email },
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Reject only if status is outside 2xx
      }
    });

    // Verify the response contains the expected data
    if (!response.data || response.data.category === null || response.data.category === undefined) {
      console.error('Invalid response from server:', response.data);
      throw new Error('Failed to create category: Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('Error creating category:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Get all categories
export const getAllCategory = async () => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  try {
    const res = await axiosInstance.get("/getAllCategory", {
      params: { role, email },
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get category by ID
export const getCategoryById = async (id) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  try {
    const res = await axiosInstance.get(`/getCategoryById/${id}`, {
      params: { role, email },
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

// Update category
export const updateCategory = async (id, categoryName) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  if (!categoryName || !categoryName.trim()) {
    throw new Error('Category name is required');
  }
  try {
    const res = await axiosInstance.put(
      `/updateCategory/${id}`,
      { category: categoryName.trim() },
      { params: { role, email } }
    );
    return res.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id) => {
  const role = sessionStorage.getItem('role') || 'staff';
  const email = sessionStorage.getItem('email') || '';
  try {
    const res = await axiosInstance.delete(`/deleteCategory/${id}`, {
      params: { role, email },
    });
    return res.data;
  } catch (error) {
    if (error.response?.data?.message?.includes('foreign key constraint fails')) {
      throw new Error('Cannot delete category because it has associated records. Please remove or reassign them first.');
    }
    const errorMessage = error.response?.data?.message ||
                         error.response?.data?.error ||
                         error.message ||
                         'Failed to delete category';
    throw new Error(errorMessage);
  }
};
