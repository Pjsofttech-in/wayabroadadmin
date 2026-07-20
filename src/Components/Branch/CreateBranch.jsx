import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Box,
  Select,
  MenuItem,
  Typography,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  Tooltip,
  InputLabel,
  FormControl,
} from "@mui/material";
import { Edit, Delete, PersonAdd, Business, Add } from "@mui/icons-material";
import { Table as AntTable, Tag, Space, Popconfirm } from "antd";
import StaffForm from "./StaffForm";
import AlertService from "../Common/AlertService";
import { getAllStaff, deleteStaff } from "./StaffService";
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "./CreateBranch";

const { Column } = AntTable;

const initialBranchState = {
  branchName: "",
  branchEmail: "",
  contact: "",
  branchHeadName: "",
  address: "",
  city: "",
  district: "",
  state: "",
  country: "",
  pincode: "",
  status: "",
  password: "",
  candGet: false,
  candPut: false,
  candPost: false,
  candDelete: false,
};

function CreateBranch() {
  const [branches, setBranches] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [branchData, setBranchData] = useState(initialBranchState);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const superAdminEmail = sessionStorage.getItem("email");

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const data = await getAllBranches();
      setBranches(data || []);
    } catch (err) {
      AlertService.error("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    setBranchData({ ...branchData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setBranchData({ ...branchData, [e.target.name]: e.target.checked });
  };

  const handleOpenDialog = (branch = null) => {
    if (branch) {
      setBranchData({
        ...initialBranchState,
        ...branch,
        candGet: !!branch.candGet,
        candPut: !!branch.candPut,
        candPost: !!branch.candPost,
        candDelete: !!branch.candDelete,
      });
      setEditId(branch.id || branch.bid);
    } else {
      setBranchData(initialBranchState);
      setEditId(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setBranchData(initialBranchState);
    setEditId(null);
  };

  const handleStaffDialogClose = () => {
    setStaffDialogOpen(false);
    setSelectedBranch(null);
    setShowStaffForm(false);
  };

  const [showStaffForm, setShowStaffForm] = useState(false);

  const handleManageStaff = async (branch) => {
    setSelectedBranch(branch);
    setShowStaffForm(false);
    try {
      setLoading(true);
      const response = await getAllStaff(branch.branchCode);
      console.log('Staff API Response:', response);
      
      // The response should already be filtered by branchCode from the API
      const staffData = Array.isArray(response) ? response : [];
      
      console.log('Processed Staff Data:', staffData);
      
      setStaffList(staffData);
      setStaffDialogOpen(true);
    } catch (error) {
      console.error('Error in handleManageStaff:', error);
      AlertService.error(`Failed to fetch staff: ${error.message || 'Unknown error'}`);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSuccess = () => {
    if (selectedBranch) {
      setShowStaffForm(false);
      handleManageStaff(selectedBranch);
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      const confirmed = await AlertService.confirm('Are you sure you want to delete this staff member?');
      if (!confirmed) return;
      
      await deleteStaff(id);
      AlertService.success('Staff deleted successfully');
      handleStaffSuccess();
    } catch (error) {
      AlertService.error('Failed to delete staff');
    }
  };

  const handleSave = async () => {
    const requiredFields = ["branchName", "branchEmail", "contact", "pincode"];
    if (!editId) requiredFields.push("password");

    for (let field of requiredFields) {
      if (!branchData[field]) {
        AlertService.error(`Please fill ${field}`);
        return;
      }
    }

    const dataToSave = {
      ...branchData,
      status: branchData.status || "Active",
    };

    setLoading(true);
    try {
      if (editId) {
        await updateBranch(editId, dataToSave);
        AlertService.success("Branch updated successfully");
      } else {
        await createBranch(dataToSave, superAdminEmail);
        AlertService.success("Branch created successfully");
      }
      fetchBranches();
      handleCloseDialog();
    } catch (err) {
      const errorMsg =
        (err && err.message) ||
        (err && err.response && err.response.data && err.response.data.message) ||
        "Operation failed";
      AlertService.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      AlertService.error("Invalid branch ID");
      return;
    }
    const confirmed = await AlertService.confirm('Are you sure you want to delete this branch? This action cannot be undone.');
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteBranch(id);
      AlertService.success("Branch deleted successfully");
      fetchBranches();
    } catch (err) {
      AlertService.error("Failed to delete branch");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? 'success' : 'error';
  };

  return (
    <>
      {/* Header Section */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Business sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
                  Branch Management
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                px: 3,
                py: 1.5,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }
              }}
            >
              Create Branch
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Branch Creation/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white', 
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Business />
          {editId ? "Update Branch" : "Create New Branch"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                label="Branch Name" 
                name="branchName" 
                value={branchData.branchName} 
                onChange={handleChange} 
                fullWidth 
                required 
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                label="Branch Email" 
                name="branchEmail" 
                value={branchData.branchEmail} 
                onChange={handleChange} 
                fullWidth 
                required 
                type="email"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                label="Contact Number" 
                name="contact" 
                value={branchData.contact} 
                onChange={handleChange} 
                fullWidth 
                required 
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                label="Branch Head Name" 
                name="branchHeadName" 
                value={branchData.branchHeadName} 
                onChange={handleChange} 
                fullWidth 
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2, mt: 2 }}>
                Address Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                label="Address" 
                name="address" 
                value={branchData.address} 
                onChange={handleChange} 
                fullWidth 
                multiline
                rows={2}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                label="City" 
                name="city" 
                value={branchData.city} 
                onChange={handleChange} 
                fullWidth 
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                label="District" 
                name="district" 
                value={branchData.district} 
                onChange={handleChange} 
                fullWidth 
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField 
                label="State" 
                name="state" 
                value={branchData.state} 
                onChange={handleChange} 
                fullWidth 
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField 
                label="Country" 
                name="country" 
                value={branchData.country} 
                onChange={handleChange} 
                fullWidth 
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField 
                label="Pincode" 
                name="pincode" 
                value={branchData.pincode} 
                onChange={handleChange} 
                fullWidth 
                required 
                type="number" 
                inputProps={{ min: 100000, max: 999999 }}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Configuration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2, mt: 2 }}>
                Configuration
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={branchData.status}
                  onChange={handleChange}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Select Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Nonactive">Nonactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                label="Password" 
                name="password" 
                value={branchData.password} 
                onChange={handleChange} 
                fullWidth 
                required 
                type="password" 
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  Permissions
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!branchData.candGet}
                        onChange={handleCheckboxChange}
                        name="candGet"
                        sx={{ '&.Mui-checked': { color: 'success.main' } }}
                      />
                    }
                    label="Can Get"
                    sx={{ mr: 3 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!branchData.candPut}
                        onChange={handleCheckboxChange}
                        name="candPut"
                        sx={{ '&.Mui-checked': { color: 'warning.main' } }}
                      />
                    }
                    label="Can Put"
                    sx={{ mr: 3 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!branchData.candPost}
                        onChange={handleCheckboxChange}
                        name="candPost"
                        sx={{ '&.Mui-checked': { color: 'primary.main' } }}
                      />
                    }
                    label="Can Post"
                    sx={{ mr: 3 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!branchData.candDelete}
                        onChange={handleCheckboxChange}
                        name="candDelete"
                        sx={{ '&.Mui-checked': { color: 'error.main' } }}
                      />
                    }
                    label="Can Delete"
                  />
                </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              px: 3,
              '&:hover': {
                boxShadow: 4,
              }
            }}
          >
            {editId ? "Update Branch" : "Create Branch"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Branches Table */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, backgroundColor: '#3291d1', color: 'white' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              All Branches ({branches.length})
            </Typography>
          </Box>
          
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Branch Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>City</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Pincode</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Branch Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.map((branch, index) => (
                  <TableRow 
                    key={branch.id || branch.bid} 
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                      '&:hover': { backgroundColor: '#e3f2fd', transition: 'background-color 0.2s' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {branch.bid}
                    </TableCell>
                    <TableCell sx={{ fontWeight: '500' }}>
                      {branch.branchName}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {branch.branchEmail}
                    </TableCell>
                    <TableCell>{branch.contact}</TableCell>
                    <TableCell>{branch.city}</TableCell>
                    <TableCell>{branch.pincode}</TableCell>
                    <TableCell>
                      <Chip 
                        label={branch.status || 'Inactive'} 
                        color={getStatusColor(branch.status)}
                        size="small"
                        sx={{ fontWeight: 'bold', minWidth: 70 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={branch.branchCode || 'N/A'} 
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Edit Branch">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={async () => {
                              try {
                                const latest = await getAllBranches();
                                const found = (latest || []).find(
                                  b => (b.id || b.bid) === (branch.id || branch.bid)
                                );
                                if (found) {
                                  handleOpenDialog(found);
                                } else {
                                  AlertService.error("Branch not found");
                                }
                              } catch {
                                AlertService.error("Failed to fetch branch details");
                              }
                            }}
                            sx={{ 
                              backgroundColor: 'primary.light',
                              color: 'white',
                              '&:hover': { 
                                backgroundColor: 'primary.main',
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s'
                              }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Branch">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              handleDelete(branch.id || branch.bid);
                            }}
                            sx={{ 
                              backgroundColor: 'error.light',
                              color: 'white',
                              '&:hover': { 
                                backgroundColor: 'error.main',
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s'
                              }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Manage Staff">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleManageStaff(branch)}
                            sx={{ 
                              backgroundColor: 'success.light',
                              color: 'white',
                              '&:hover': { 
                                backgroundColor: 'success.main',
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s'
                              }
                            }}
                          >
                            <PersonAdd fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {branches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No branches found
                        </Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                          Create your first branch to get started
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => handleOpenDialog()}
                          sx={{ textTransform: 'none' }}
                        >
                          Create Branch
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Staff Management Dialog */}
      <Dialog 
        open={staffDialogOpen} 
        onClose={handleStaffDialogClose} 
        maxWidth="lg" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#3291d1', 
          color: 'white', 
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <PersonAdd />
          {selectedBranch ? `Staff Management - ${selectedBranch.branchName}` : 'Staff Management'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            backgroundColor: '#f8f9fa',
            borderRadius: 2
          }}>
            <Button
              variant="outlined"
              onClick={() => setStaffDialogOpen(false)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              ← Back to Branches
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => {
                setShowStaffForm(true);
                setSelectedBranch(prev => ({
                  ...prev,
                  staffData: null
                }));
              }}
              sx={{
                backgroundColor: '#3291d1',
                '&:hover': {
                  backgroundColor: '#2472a8',
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                px: 3,
                boxShadow: 2
              }}
            >
              Add New Staff
            </Button>
          </Box>

          <AntTable 
            dataSource={staffList}
            loading={loading}
            rowKey="id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} staff members`
            }}
            scroll={{ x: 'max-content' }}
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Column title="Name" dataIndex="staffName" key="staffName" />
            <Column title="Email" dataIndex="staffEmail" key="staffEmail" />
            <Column title="Contact" dataIndex="contact" key="contact" />
            <Column 
              title="Status" 
              dataIndex="status" 
              key="status"
              render={(status) => (
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  backgroundColor: status === 'Active' ? '#e8f5e8' : '#ffeaa7',
                  color: status === 'Active' ? '#2d5f2d' : '#d63031',
                  border: `1px solid ${status === 'Active' ? '#4caf50' : '#fdcb6e'}`
                }}>
                  {status || 'Inactive'}
                </span>
              )}
            />
            <Column
              title="Actions"
              key="actions"
              fixed="right"
              render={(_, record) => (
                <Space size="small">
                  <Tooltip title="Edit Staff">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => {
                        setSelectedBranch(prev => ({
                          ...prev,
                          staffData: record
                        }));
                      }}
                      sx={{ 
                        backgroundColor: 'primary.light',
                        color: 'white',
                        '&:hover': { 
                          backgroundColor: 'primary.main',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete Staff">
                    <IconButton 
                      color="error" 
                      size="small"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleDeleteStaff(record.id);
                      }}
                      sx={{ 
                        backgroundColor: 'error.light',
                        color: 'white',
                        '&:hover': { 
                          backgroundColor: 'error.main',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Space>
              )}
            />
          </AntTable>
        </DialogContent>
      </Dialog>

      {/* Staff Form Dialog */}
      {selectedBranch && (
        <StaffForm
          open={showStaffForm || !!selectedBranch?.staffData}
          onClose={() => {
            setShowStaffForm(false);
            setSelectedBranch(prev => ({
              ...prev,
              staffData: null
            }));
          }}
          branchEmail={selectedBranch?.branchEmail}
          staffData={selectedBranch?.staffData}
          onSuccess={handleStaffSuccess}
        />
      )}
    </>
  );
}

export default CreateBranch;