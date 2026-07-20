import axiosInstance from "../Common/axiosConfig";

// Get all blogs (no parameters needed as per controller)
export const getAllBlogs = async () => {
  const res = await axiosInstance.get("/getAllBlogs");
  return res.data;
};

// Get blog by ID
export const getBlogById = async (id) => {
  const res = await axiosInstance.get(`/getBlogById/${id}`);
  return res.data;
};

// Get blog by title
export const getBlogByTitle = async (title) => {
  const res = await axiosInstance.get("/getBlogByTitle", {
    params: { title }
  });
  return res.data;
};

// Create a new blog
export const createBlog = async (blogData, image, role, email) => {
  const formData = new FormData();
  
  // Create a clean blog object without the image field
  const { image: _, ...blogWithoutImage } = blogData;
  
  // Add blog data as JSON string
  formData.append("blog", JSON.stringify(blogWithoutImage));
  
  // Add image (required for create)
  if (image) {
    formData.append("image", image);
  } else {
    // If no image is provided but required, you might want to handle this case
    throw new Error("Image is required for creating a blog");
  }
  
  // Add role and email as form data
  formData.append("role", role);
  formData.append("email", email);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json'
    }
  };

  try {
    const res = await axiosInstance.post("/createBlog", formData, config);
    return res.data;
  } catch (error) {
    console.error("Error creating blog:", error);
    throw error;
  }
};

// Update an existing blog
export const updateBlog = async (id, blogData, image, role, email) => {
  const formData = new FormData();
  
  // Create a clean blog object without the image field
  const { image: _, ...blogWithoutImage } = blogData;
  
  // Add blog data as JSON string
  formData.append("blog", JSON.stringify(blogWithoutImage));
  
  // Add image if provided (optional for update)
  if (image) {
    formData.append("image", image);
  }
  
  // Add role and email as form data
  formData.append("role", role);
  formData.append("email", email);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json'
    }
  };

  try {
    const res = await axiosInstance.put(`/updateBlog/${id}`, formData, config);
    return res.data;
  } catch (error) {
    console.error("Error updating blog:", error);
    throw error;
  }
};

// Delete a blog
export const deleteBlog = async (id, role, email) => {
  const res = await axiosInstance.delete(`/deleteBlog/${id}`, {
    params: { role, email }
  });
  return res.data;
};
