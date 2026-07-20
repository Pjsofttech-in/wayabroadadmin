import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import Loading from '../Common/LoadingOverlay';
import AlertService from '../Common/AlertService';
import {
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory
} from './BlogCategory.js';

const BlogCategory = () => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllCategory();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      AlertService.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setCategoryName("");
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleClickOpen = (record) => {
    setSelectedCategory(record);
    setCategoryName(record.category || "");
    setFormErrors({});
    setOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormErrors({});
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCategory(null);
    setFormErrors({});
  };

  const handleAddCategory = async () => {
    const trimmedName = categoryName?.trim();
    if (!trimmedName) {
      setFormErrors({ categoryName: 'Category name is required' });
      return;
    }
    try {
      await createCategory({ category: trimmedName });
      AlertService.success('Category added successfully');
      await fetchCategories();
      handleDialogClose();
    } catch (error) {
      AlertService.error(error.message || 'Failed to add category');
    }
  };

  const handleSave = async () => {
    const trimmedName = categoryName?.trim();
    if (!selectedCategory || !trimmedName) {
      setFormErrors({ categoryName: 'Category name is required' });
      return;
    }
    setLoading(true);
    try {
      await updateCategory(selectedCategory.id, trimmedName);
      AlertService.success('Category updated successfully');
      await fetchCategories();
      handleClose();
    } catch (error) {
      AlertService.error(error.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    const isConfirmed = await AlertService.confirm(`Are you sure you want to delete "${record.category || 'this category'}"?`);
    if (!isConfirmed) return;
    setLoading(true);
    try {
      await deleteCategory(record.id);
      AlertService.success('Category deleted successfully');
      await fetchCategories();
    } catch (error) {
      AlertService.error(error.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category => {
    const name = category.category || 'Unnamed Category';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      className: "custom-header",
      width: 80,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: "Category Name",
      dataIndex: "category",
      key: "category",
      className: "custom-header",
      render: (text) => text || <span style={{ color: '#999', fontStyle: 'italic' }}>Unnamed Category</span>,
      sorter: (a, b) => {
        const nameA = a.category || '';
        const nameB = b.category || '';
        return nameA.localeCompare(nameB);
      }
    },
    {
      title: "Actions",
      key: "actions",
      className: "custom-header",
      width: 150,
      render: (_, record) => (
        <Box display="flex" gap={1}>
          <Button
            onClick={() => handleClickOpen(record)}
            startIcon={<EditIcon style={{ color: "#1890ff" }} />}
            size="small"
          />
          <Button
            onClick={() => handleDelete(record)}
            startIcon={<DeleteIcon style={{ color: "#ff4d4f" }} />}
            size="small"
          />
        </Box>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      {loading && <Loading />}
      <Typography variant="h5" gutterBottom mb={3}>
        Blog Category Management
      </Typography>

      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Search Categories"
            variant="outlined"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <Typography variant="body1" color="textSecondary">
            Total: {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlusOutlined />}
          onClick={handleDialogOpen}
        >
          Add Category
        </Button>
      </Box>

      {/* Add Category Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            error={!!formErrors.categoryName}
            helperText={formErrors.categoryName}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleAddCategory} color="primary" variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            error={!!formErrors.categoryName}
            helperText={formErrors.categoryName}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Table 
        columns={columns} 
        dataSource={filteredCategories.map(c => ({ ...c, key: c.id }))} 
        rowKey="key" 
        className="category-table"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories`
        }}
        loading={loading}
      />
      <style>
        {`
          .category-table .ant-table-thead > tr > th.custom-header {
            background: #f5f5f5 !important;
            color: #333 !important;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
          }
          .category-table .ant-table-tbody > tr > td {
            padding: 12px 16px;
          }
          .category-table .ant-table-pagination {
            margin: 16px 0;
            padding: 0 24px;
          }
        `}
      </style>
    </div>
  );
};

export default BlogCategory;
