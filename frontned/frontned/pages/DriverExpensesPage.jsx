import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  TableContainer,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalGasStation as FuelIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import api from '../api/axios';
import AppDatePicker from '../components/common/AppDatePicker';
import dayjs from 'dayjs';

const DriverExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableDates, setAvailableDates] = useState([]); // For driver-based date dropdown
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total_expenses: 0, total_litres: 0, count: 0 });

  const [formData, setFormData] = useState({
    driver_id: '',
    vehicle_id: '',
    date: dayjs().format('YYYY-MM-DD'),
    litres: '',
    price_per_litre: '',
    total_amount: 0,
    remarks: '',
  });

  const [filters, setFilters] = useState({
    driver_id: '',
    date: '', // Single date selection like Smart Payments
  });

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
    fetchExpenses();
  }, []);

  useEffect(() => {
    // Auto-calculate total amount
    const litres = parseFloat(formData.litres) || 0;
    const pricePerLitre = parseFloat(formData.price_per_litre) || 0;
    const totalAmount = (litres * pricePerLitre).toFixed(2);
    setFormData(prev => ({ ...prev, total_amount: parseFloat(totalAmount) }));
  }, [formData.litres, formData.price_per_litre]);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/api/drivers');
      setDrivers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      showSnackbar('Failed to load drivers', 'error');
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/api/vehicles');
      setVehicles(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showSnackbar('Failed to load vehicles', 'error');
    }
  };

  // Fetch available dates for selected driver - matches Smart Payments pattern
  const fetchDatesForDriver = async (driverId) => {
    if (!driverId) {
      setAvailableDates([]);
      return;
    }

    try {
      const res = await api.get(`/api/driver-expenses/dates?driver_id=${driverId}`);
      setAvailableDates(res.data.data || []);
    } catch (error) {
      console.error('Error fetching dates for driver:', error);
      showSnackbar('Failed to load expense dates', 'error');
      setAvailableDates([]);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.driver_id) params.append('driver_id', filters.driver_id);
      if (filters.date) {
        // Use date as both start and end for exact match
        params.append('start_date', filters.date);
        params.append('end_date', filters.date);
      }

      const res = await api.get(`/api/driver-expenses?${params.toString()}`);
      setExpenses(res.data.data || []);
      setSummary(res.data.summary || { total_expenses: 0, total_litres: 0, count: 0 });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showSnackbar('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.driver_id || !formData.date || !formData.litres || !formData.price_per_litre) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    if (formData.litres <= 0 || formData.price_per_litre <= 0) {
      showSnackbar('Litres and price must be greater than 0', 'error');
      return;
    }

    try {
      setLoading(true);
      if (editId) {
        await api.put(`/api/driver-expenses/${editId}`, formData);
        showSnackbar('Expense updated successfully', 'success');
      } else {
        await api.post('/api/driver-expenses', formData);
        showSnackbar('Expense added successfully', 'success');
      }
      handleClose();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      driver_id: expense.driver_id,
      vehicle_id: expense.vehicle_id || '',
      date: expense.date,
      litres: expense.litres,
      price_per_litre: expense.price_per_litre,
      total_amount: expense.total_amount,
      remarks: expense.remarks || '',
    });
    setEditId(expense.expense_id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.delete(`/api/driver-expenses/${id}`);
      showSnackbar('Expense deleted successfully', 'success');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      showSnackbar('Failed to delete expense', 'error');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setFormData({
      driver_id: '',
      vehicle_id: '',
      date: dayjs().format('YYYY-MM-DD'),
      litres: '',
      price_per_litre: '',
      total_amount: 0,
      remarks: '',
    });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle driver selection - matches Smart Payments pattern
  const handleDriverChange = (e) => {
    const driverId = e.target.value;
    setFilters({
      driver_id: driverId,
      date: '', // Reset date when driver changes
    });
    
    // Fetch dates for the selected driver
    if (driverId) {
      fetchDatesForDriver(driverId);
    } else {
      setAvailableDates([]);
    }
  };

  // Handle date selection
  const handleDateChange = (e) => {
    setFilters(prev => ({ ...prev, date: e.target.value }));
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'N/A';
  };

  const getVehicleNumber = (vehicleId) => {
    const vehicle = vehicles.find(v => v.vehicle_id === vehicleId);
    return vehicle ? vehicle.vehicle_number : 'N/A';
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FuelIcon sx={{ fontSize: 40, color: '#1976d2' }} />
        Driver Diesel Expenses
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Total Expenses</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ₹{summary.total_expenses.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                {summary.count} records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Total Litres</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {summary.total_litres.toLocaleString()} L
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Diesel consumed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Avg Price/Litre</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ₹{summary.total_litres > 0 ? (summary.total_expenses / summary.total_litres).toFixed(2) : '0.00'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Average rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions - Smart Payments Pattern */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Driver *</InputLabel>
              <Select
                value={filters.driver_id}
                label="Select Driver *"
                onChange={handleDriverChange}
              >
                <MenuItem value="">-- Select Driver --</MenuItem>
                {drivers.map(driver => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small" disabled={!filters.driver_id}>
              <InputLabel>Select Date</InputLabel>
              <Select
                value={filters.date}
                label="Select Date"
                onChange={handleDateChange}
              >
                <MenuItem value="">-- Select Date --</MenuItem>
                {availableDates.map(date => (
                  <MenuItem key={date} value={date}>
                    {new Date(date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                onClick={fetchExpenses} 
                fullWidth
                disabled={!filters.driver_id}
              >
                Apply Filter
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilters({ driver_id: '', date: '' });
                  setAvailableDates([]);
                  fetchExpenses();
                }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Add Diesel Expense
          </Button>
        </Box>
      </Paper>

      {/* Expenses Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Driver</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Litres</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Price/Litre</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Total Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No expenses found. Click "Add Diesel Expense" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.expense_id} hover>
                  <TableCell>{dayjs(expense.date).format('DD MMM YYYY')}</TableCell>
                  <TableCell>
                    <Chip
                      label={expense.driver?.name || getDriverName(expense.driver_id)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {expense.vehicle?.vehicle_number || getVehicleNumber(expense.vehicle_id) || '-'}
                  </TableCell>
                  <TableCell>{expense.litres} L</TableCell>
                  <TableCell>₹{expense.price_per_litre}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>
                    ₹{expense.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{expense.remarks || '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(expense)} size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(expense.expense_id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FuelIcon color="primary" />
          {editId ? 'Edit Diesel Expense' : 'Add Diesel Expense'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Driver *</InputLabel>
                <Select
                  value={formData.driver_id}
                  label="Driver *"
                  onChange={(e) => setFormData(prev => ({ ...prev, driver_id: e.target.value }))}
                >
                  <MenuItem value="">Select Driver</MenuItem>
                  {drivers.map(driver => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Vehicle</InputLabel>
                <Select
                  value={formData.vehicle_id}
                  label="Vehicle"
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_id: e.target.value }))}
                >
                  <MenuItem value="">Select Vehicle</MenuItem>
                  {vehicles.map(vehicle => (
                    <MenuItem key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.vehicle_number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <AppDatePicker
                label="Date *"
                value={formData.date}
                onChange={(val) => setFormData(prev => ({ ...prev, date: val ? val.format('YYYY-MM-DD') : '' }))}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Diesel Litres *"
                type="number"
                value={formData.litres}
                onChange={(e) => setFormData(prev => ({ ...prev, litres: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Price per Litre *"
                type="number"
                value={formData.price_per_litre}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_litre: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#e3f2fd',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  height: '100%'
                }}
              >
                <CalculateIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    ₹{formData.total_amount.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Remarks"
                multiline
                rows={3}
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !formData.driver_id || !formData.date || !formData.litres || !formData.price_per_litre}
          >
            {editId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DriverExpensesPage;
