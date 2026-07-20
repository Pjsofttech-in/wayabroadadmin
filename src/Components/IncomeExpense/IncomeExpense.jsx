import React, { useEffect, useState } from 'react';
import {
  Button,
  Container,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AttachMoney as MoneyIcon } from '@mui/icons-material';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { v4 as uuidv4 } from 'uuid';
// Removed date picker imports as we're using TextField for date input

// Storage helpers
const getTransactions = async () => {
  return JSON.parse(localStorage.getItem('transactions') || '[]');
};
const saveTransactions = async (data) => {
  localStorage.setItem('transactions', JSON.stringify(data));
};

const categories = [
  { value: 'food', label: 'Food' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'salary', label: 'Salary' },
  { value: 'investment', label: 'Investment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'entertainment', label: 'Entertainment' },
];

export default function IncomeExpense() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    type: 'income',
    date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD for input type="date"
  });
  const [filter, setFilter] = useState({
    type: 'all',
    category: 'all',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    getTransactions().then((data) => {
      setTransactions(Array.isArray(data) ? data : []);
    });
  }, []);

  const handleSave = async () => {
    const updated = editing
      ? transactions.map((t) =>
          t.id === editing.id ? { ...formData, id: editing.id } : t
        )
      : [...transactions, { ...formData, id: uuidv4() }];

    await saveTransactions(updated);
    setTransactions(updated);
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    const updated = transactions.filter((t) => t.id !== id);
    await saveTransactions(updated);
    setTransactions(updated);
  };

  const filteredTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    const matchesType = filter.type === 'all' || t.type === filter.type;
    const matchesCategory = filter.category === 'all' || t.category === filter.category;
    const matchesMonth = transactionDate.getMonth() + 1 === parseInt(filter.month);
    const matchesYear = transactionDate.getFullYear() === filter.year;
    return matchesType && matchesCategory && matchesMonth && matchesYear;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const ChartCard = ({ title, type, transactions }) => {
    if (!transactions || !Array.isArray(transactions)) {
      return null; // or return a loading/empty state
    }
    const categoryData = [...new Set(transactions.map(t => t.category))]
      .map(cat => {
        const total = transactions
          .filter(t => t.category === cat)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return { id: cat, label: cat, value: total };
      })
      .filter(item => item.value > 0);

    const barData = categoryData.map(item => ({
      category: item.label,
      amount: item.value,
    }));

    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
    ];

    return (
      <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <CardHeader
          title={title}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          sx={{ 
            backgroundColor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 1.5
          }}
        />
        <CardContent sx={{ p: 0, height: isMobile ? 250 : 300 }}>
          {type === 'bar' ? (
            <ResponsiveBar
              data={barData}
              keys={['amount']}
              indexBy="category"
              margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
              padding={0.3}
              colors={({ index }) => colors[index % colors.length]}
              axisBottom={{ tickRotation: 25, tickSize: 5, tickPadding: 5 }}
              axisLeft={{
                legend: 'Amount',
                legendPosition: 'middle',
                legendOffset: -50,
              }}
              enableLabel={false}
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fill: theme.palette.text.secondary,
                      fontSize: 12,
                    },
                  },
                  legend: {
                    text: {
                      fill: theme.palette.text.secondary,
                      fontSize: 12,
                    },
                  },
                },
                grid: {
                  line: {
                    stroke: theme.palette.divider,
                    strokeWidth: 1,
                  },
                },
              }}
            />
          ) : (
            <ResponsivePie
              data={categoryData}
              margin={{ top: 20, right: 30, bottom: 40, left: 30 }}
              colors={({ index }) => colors[index % colors.length]}
              innerRadius={0.5}
              padAngle={1}
              cornerRadius={4}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor={theme.palette.text.secondary}
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="white"
              theme={{
                labels: {
                  text: {
                    fill: theme.palette.text.primary,
                  },
                },
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <Typography variant="h4" fontWeight="bold" color="primary">
            Income & Expense Tracker
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setEditing(null);
              setFormData({
                title: '',
                amount: '',
                category: '',
                type: 'Income',
                date: new Date().toISOString().slice(0, 10),
              });
              setShowModal(true);
            }}
          >
            + Add Transaction
          </Button>
        </div>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Overall by Category"
              type="bar"
              transactions={transactions}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartCard
              title="Expenses Breakdown"
              type="pie"
              transactions={transactions.filter((t) => t.type === 'Expense')}
            />
          </Grid>
        </Grid>

        {/* Transactions List */}
        <Card elevation={3}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filter.type}
                    label="Type"
                    onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filter.category}
                    label="Category"
                    onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={filter.month}
                    label="Month"
                    onChange={(e) => setFilter({ ...filter, month: e.target.value })}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date(2023, i, 1);
                      return (
                        <MenuItem key={i} value={i + 1}>
                          {date.toLocaleString('default', { month: 'long' })}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={filter.year}
                    label="Year"
                    onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                  >
                    {[2023, 2024, 2025].map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card elevation={0} sx={{ border: `1px solid #ddd`, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderBottom: `1px solid #ddd`,
            backgroundColor: 'background.paper'
          }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Recent Transactions
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null);
                setFormData({
                  title: '',
                  amount: '',
                  category: '',
                  type: 'income',
                  date: new Date().toISOString().slice(0, 10),
                });
                setShowModal(true);
              }}
              sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}
            >
              Add Transaction
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => (
                    <TableRow 
                      key={t.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: t.type === 'income' ? 'success.main' : 'error.main' 
                          }} />
                          {t.title}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: t.type === 'income' ? 'success.light' : 'error.light',
                          color: t.type === 'income' ? 'success.dark' : 'error.dark',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}>
                          {categories.find(c => c.value === t.category)?.label || t.category}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(t.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{
                          fontWeight: 600,
                          color: t.type === 'income' ? 'success.main' : 'error.main',
                        }}
                      >
                        {t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setEditing(t);
                              setFormData(t);
                              setShowModal(true);
                            }}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(t.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon color="action" fontSize="large" />
                        <Typography color="textSecondary">No transactions found</Typography>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => setShowModal(true)}
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          Add your first transaction
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Add/Edit Transaction Dialog */}
        <Dialog 
          open={showModal} 
          onClose={() => setShowModal(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: `1px solid #ddd`, 
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            {editing ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  size="small"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <Typography color="text.secondary" mr={1}>
                        $
                      </Typography>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Type"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid #ddd` }}>
            <Button 
              onClick={() => setShowModal(false)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
              disabled={!formData.title || !formData.amount || !formData.category}
            >
              {editing ? 'Update' : 'Add'} Transaction
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
  );
}
