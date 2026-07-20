import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  TableContainer,
  Paper,
  CircularProgress,
} from "@mui/material";
import { Table, Image, Space } from "antd";
import { Editor } from '@tinymce/tinymce-react';
import AlertService from "../Common/AlertService.js";
import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from "./BlogService.js";
import { getAllCategory } from '../Settings/BlogCategory.js';


export default function BlogManagement() {
  const [blogs, setBlogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0
  });

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const email = sessionStorage.getItem("email");
  const role = sessionStorage.getItem("role");
  const branchCode = sessionStorage.getItem("branchCode");

  const fetchBlogs = async (page = 1, pageSize = 25) => {
    setLoading(true);
    try {
      const response = await getAllBlogs(branchCode, role, email);
      // If the API supports pagination, use the response directly
      // If not, implement client-side pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = Array.isArray(response) ? response.slice(start, end) : [];
      
      setBlogs(paginatedData);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: Array.isArray(response) ? response.length : 0
      }));
    } catch (err) {
      console.error("Fetch Blogs Failed", err);
      AlertService.error('Failed to load blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategory();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchBlogs(pagination.current, pagination.pageSize);
    fetchCategories();
    
    // Clean up object URLs to avoid memory leaks
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    if (editingBlog) {
      setForm({
        title: editingBlog.title || "",
        category: editingBlog.category || "",
        description: editingBlog.description || "",
        image: null, // don't preload image
      });
      // Set preview if editing and image exists
      if (editingBlog.image) {
        setImagePreview(editingBlog.image);
      } else {
        setImagePreview(null);
      }
    } else {
      setForm({
        title: "",
        category: "",
        description: "",
        image: null,
      });
      setImagePreview(null);
    }
  }, [editingBlog]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, image: file }));
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleEditorChange = (content) => {
    setForm(prev => ({ ...prev, description: content }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editingBlog) {
        // Only include necessary fields for update
        const { title, category, description } = form;
        const blogData = { title, category, description };
        await updateBlog(editingBlog.id, blogData, form.image, role, email);
        AlertService.success('Blog updated successfully!');
      } else {
        // Create blog with only the necessary fields
        const { title, category, description } = form;
        const blogData = { title, category, description };
        await createBlog(blogData, form.image, role, email);
        AlertService.success('Blog created successfully!');
      }
      await fetchBlogs();
      setShowModal(false);
      setEditingBlog(null);
    } catch (error) {
      console.error("Blog Save Error:", error);
      AlertService.error(error.message || 'Something went wrong while saving the blog.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    const blog = blogs.find((b) => b.id === id);
    setEditingBlog(blog);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await AlertService.confirm("Are you sure you want to delete this blog?");
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      await deleteBlog(id, role, email);
      await fetchBlogs();
      AlertService.success('Blog deleted successfully!');
    } catch (error) {
      console.error("Delete Error:", error);
      AlertService.error(error.message || 'Failed to delete blog');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Sr No",
      dataIndex: "serial",
      key: "serial",
      render: (_, __, index) => index + 1,
      width: 80,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image) =>
        image ? (
          <Image
            src={typeof image === "string" ? image : URL.createObjectURL(image)}
            alt="Blog"
            width={64}
            height={48}
            style={{ objectFit: "cover" }}
          />
        ) : (
          "-"
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record.id)}>
            ✏️ Edit
          </Button>
          <Button 
            onClick={() => handleDelete(record.id)}
            sx={{ color: 'error.main' }}
          >
            🗑️ Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
<>
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          setEditingBlog(null);
          setShowModal(true);
        }}
        sx={{ mb: 2 }}
      >
        + CREATE NEW BLOG
      </Button>

      <TableContainer component={Paper}>
        <Table
          columns={columns}
          dataSource={blogs}
          rowKey={(record) => record.id}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100', '500', '1000'],
            showTotal: (total) => `Total ${total} items`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize
              }));
            },
            onShowSizeChange: (current, size) => {
              setPagination(prev => ({
                ...prev,
                current: 1,
                pageSize: size
              }));
            }
          }}
          loading={loading}
          bordered
          scroll={{ x: 900 }}
        />
      </TableContainer>

      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xl" fullWidth>
        <DialogTitle>{editingBlog ? "Edit Blog" : "Create Blog"}</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Title"
            name="title"
            fullWidth
            value={form.title}
            onChange={handleInput}
            margin="normal"
          />
          <TextField
            select
            label="Category"
            name="category"
            fullWidth
            value={form.category}
            onChange={handleInput}
            margin="normal"
          >
            <MenuItem value="">Select Category</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.category}>{cat.category}</MenuItem>
            ))}
          </TextField>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Description</Typography>
            <Editor
              apiKey="4kk710ipyvfsq6vkw2xb192rertkz2jug0nutw35qgxhpy4j"
              value={form.description}
              onEditorChange={handleEditorChange}
              init={{
                height: 300,
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                  'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'paste', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | formatselect | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                setup: (editor) => {
                  editor.on('init', () => {
                    editor.getBody().style.fontSize = '14px';
                  });
                }
              }}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
              Upload Image
              <input hidden type="file" accept="image/*" onChange={handleImage} />
            </Button>
            {imagePreview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>Image Preview</Typography>
                <Box 
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 1,
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {editingBlog ? "Update" : "Publish"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
