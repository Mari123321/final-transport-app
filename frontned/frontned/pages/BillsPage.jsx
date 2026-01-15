import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow,
  TableCell, Paper, IconButton, TextField, Button,
  Card, CardContent, Grid, Chip, TableContainer, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, Alert
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  DoneAll as DoneAllIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import axios from "axios";
import AppDatePicker from "../components/common/AppDatePicker";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorBoundary from "../components/ErrorBoundary";

const API_BILLS = "http://localhost:5000/api/bills";
const API_INVOICES = "http://localhost:5000/api/invoices";
const API_CLIENTS = "http://localhost:5000/api/clients";

const BillsPage = () => {
  const [bills, setBills] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedBillForStatus, setSelectedBillForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState("UNPAID");
  const [filters, setFilters] = useState({
    clientId: "",
    status: "",
    startDate: "",
    endDate: ""
  });
  const [newBill, setNewBill] = useState({
    client_id: "",
    invoice_id: "",
    bill_date: new Date().toISOString().split("T")[0],
    total_amount: 0,
    notes: ""
  });
  const [summary, setSummary] = useState({
    totalBills: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });
  const [invoices, setInvoices] = useState([]);
  const [clientInvoices, setClientInvoices] = useState([]);
  const [clientsWithInvoices, setClientsWithInvoices] = useState([]);
  const [invoiceDates, setInvoiceDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchBills(),
        fetchClients(),
        fetchInvoices(),
        fetchSummary(),
        fetchClientsWithInvoices()
      ]);
    } catch (err) {
      setError(err.message || "Failed to load data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      let url = API_BILLS;
      const params = [];
      if (filters.clientId) {
        params.push(`clientId=${filters.clientId}`);
        console.log(`🔍 Fetching bills for client ID: ${filters.clientId}`);
      }
      if (filters.status) params.push(`status=${filters.status}`);
      if (filters.startDate) params.push(`startDate=${filters.startDate}`);
      if (filters.endDate) params.push(`endDate=${filters.endDate}`);
      if (params.length) url += `?${params.join("&")}`;

      const res = await axios.get(url);
      const billsData = res.data?.bills || [];

      const normalized = billsData.map((b) => {
        const vehicleLabel = b.vehicle_numbers?.length
          ? b.vehicle_numbers.join(", ")
          : b.vehicle?.vehicle_number || "-";
        const clientName = b.client?.client_name || b.invoice?.client?.client_name || "Unknown";
        return {
          ...b,
          client_name: clientName,
          vehicle_label: vehicleLabel,
        };
      });

      if (normalized.length > 0) {
        console.log(`✅ Fetched ${normalized.length} bills:`, normalized.map(b => ({
          bill_id: b.bill_id,
          bill_number: b.bill_number,
          client_id: b.client_id,
          bill_date: b.bill_date,
          client_name: b.client_name,
          vehicles: b.vehicle_label,
        })));
      } else {
        console.log("⚠️ No bills found for selected filters");
      }

      setBills(normalized);
    } catch (err) {
      console.error("Error fetching bills:", err);
      setBills([]);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get(API_CLIENTS);
      setClients(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(API_INVOICES);
      setInvoices(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  const fetchClientsWithInvoices = async () => {
    try {
      const res = await axios.get(`${API_INVOICES}/clients-with-invoices`);
      setClientsWithInvoices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching clients with invoices:", err);
      setClientsWithInvoices([]);
    }
  };

  const fetchSummary = async () => {
    try {
      let url = `${API_BILLS}/summary`;
      const params = [];
      if (filters.startDate) params.push(`startDate=${filters.startDate}`);
      if (filters.endDate) params.push(`endDate=${filters.endDate}`);
      if (filters.clientId) params.push(`clientId=${filters.clientId}`);
      if (params.length) url += `?${params.join("&")}`;

      const res = await axios.get(url);
      setSummary(res.data?.kpis || {});
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const handleCreateBill = async () => {
    try {
      if (!newBill.invoice_id) {
        alert("Please select a client, date, and invoice");
        return;
      }

      await axios.post(API_BILLS, {
        invoice_id: newBill.invoice_id,
        bill_date: newBill.bill_date,
        notes: newBill.notes
      });
      alert("✅ Bill created successfully!");
      setOpenCreateDialog(false);
      setNewBill({
        client_id: "",
        invoice_id: "",
        bill_date: new Date().toISOString().split("T")[0],
        total_amount: 0,
        notes: ""
      });
      setClientInvoices([]);
      setInvoiceDates([]);
      setSelectedDate("");
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      alert("❌ Failed to create bill: " + errorMsg);
    }
  };

  const handleClientSelect = async (clientId) => {
    setLoadingDates(true);
    setInvoiceDates([]);
    setSelectedDate("");
    setClientInvoices([]);
    
    // Reset form
    setNewBill(prev => ({
      ...prev,
      client_id: clientId,
      invoice_id: "",
      total_amount: 0
    }));

    try {
      // Fetch invoice dates for this client
      const res = await axios.get(`${API_INVOICES}/dates-by-client/${clientId}`);
      const dates = res.data.dates || [];
      setInvoiceDates(dates);
      
      // If only one date, auto-select it
      if (dates.length === 1) {
        setSelectedDate(dates[0]);
        await handleDateSelect(clientId, dates[0]);
      }
    } catch (err) {
      console.error("Error fetching dates:", err);
      setInvoiceDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  const handleDateSelect = async (clientId, date) => {
    setLoadingInvoices(true);
    setSelectedDate(date);
    setClientInvoices([]);
    
    setNewBill(prev => ({
      ...prev,
      invoice_id: "",
      total_amount: 0
    }));

    try {
      // Fetch invoices for this client and date
      const res = await axios.get(`${API_INVOICES}?clientId=${clientId}&date=${date}`);
      const filteredInvoices = Array.isArray(res.data) ? res.data : [];
      setClientInvoices(filteredInvoices);
      
      // If only one invoice, auto-select it
      if (filteredInvoices.length === 1) {
        handleInvoiceSelect(filteredInvoices[0].invoice_id);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setClientInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleInvoiceSelect = (invoiceId) => {
    // Find selected invoice and populate amount and date
    const selectedInvoice = clientInvoices.find(inv => inv.invoice_id === parseInt(invoiceId));
    if (selectedInvoice) {
      setNewBill(prev => ({
        ...prev,
        invoice_id: invoiceId,
        total_amount: selectedInvoice.total_amount,
        bill_date: selectedInvoice.date || prev.bill_date
      }));
    }
  };

  const handleStatusChange = async () => {
    try {
      await axios.patch(`${API_BILLS}/${selectedBillForStatus.bill_id}/status`, {
        payment_status: newStatus
      });
      setOpenStatusDialog(false);
      fetchData();
    } catch (err) {
      alert("❌ Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const deleteBill = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;
    try {
      await axios.delete(`${API_BILLS}/${id}`);
      fetchData();
    } catch (err) {
      alert("❌ Failed to delete bill: " + (err.response?.data?.message || err.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PARTIAL":
        return "warning";
      case "UNPAID":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return <DoneAllIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case "PARTIAL":
        return <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      default:
        return <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />;
    }
  };

  if (loading) {
    return <LoadingSkeleton type="table" />;
  }

  return (
    <ErrorBoundary>
      <Box sx={{ p: 3, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ReceiptIcon sx={{ fontSize: 32, color: "#1976d2" }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
              Bills Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.5
            }}
          >
            Create Bill
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <FilterListIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Client</InputLabel>
                <Select value={filters.clientId} label="Client" onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}>
                  <MenuItem value="">All Clients</MenuItem>
                  {clientsWithInvoices.map(c => (
                    <MenuItem key={c.client_id} value={c.client_id}>{c.client_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filters.status} label="Status" onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="UNPAID">Unpaid</MenuItem>
                  <MenuItem value="PARTIAL">Partial</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <AppDatePicker label="Start" value={filters.startDate} onChange={(val) => setFilters(prev => ({ ...prev, startDate: val }))} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <AppDatePicker label="End" value={filters.endDate} onChange={(val) => setFilters(prev => ({ ...prev, endDate: val }))} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button fullWidth variant="outlined" onClick={() => setFilters({ clientId: "", status: "", startDate: "", endDate: "" })}>Clear</Button>
            </Grid>
          </Grid>
        </Paper>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Bills</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{summary.totalBills || 0}</Typography>
                  </Box>
                  <ReceiptIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{(summary.totalAmount || 0).toLocaleString()}</Typography>
                  </Box>
                  <AttachMoneyIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Pending</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{(summary.pendingAmount || 0).toLocaleString()}</Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "white" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Paid</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{(summary.paidAmount || 0).toLocaleString()}</Typography>
                  </Box>
                  <DoneAllIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Table */}
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Bill No</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Paid</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Pending</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: "center", py: 4 }}>
                      <Typography color="textSecondary">No bills found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => (
                    <TableRow key={bill.bill_id} sx={{ "&:hover": { backgroundColor: "#f1f5f9" } }}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ReceiptIcon sx={{ fontSize: 18, color: "#6366f1" }} />
                          <Typography sx={{ fontWeight: 600 }}>{bill.bill_number}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{bill.client_name || "-"}</TableCell>
                      <TableCell><Chip label={bill.vehicle_label || "-"} size="small" /></TableCell>
                      <TableCell>
                        {bill.bill_date ? new Date(bill.bill_date).toLocaleDateString('en-CA') : (bill.invoice?.date ? new Date(bill.invoice.date).toLocaleDateString('en-CA') : "Date not available")}
                      </TableCell>
                      <TableCell align="right">₹{(bill.total_amount || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">₹{(bill.paid_amount || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">₹{(bill.pending_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip icon={getStatusIcon(bill.payment_status)} label={bill.payment_status} color={getStatusColor(bill.payment_status)} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary" onClick={() => { setSelectedBillForStatus(bill); setNewStatus(bill.payment_status); setOpenStatusDialog(true); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => deleteBill(bill.bill_id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Create Dialog */}
        <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Bill</DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Client</InputLabel>
                  <Select 
                    value={newBill.client_id} 
                    label="Client" 
                    onChange={(e) => handleClientSelect(e.target.value)}
                  >
                    <MenuItem value="">Select Client</MenuItem>
                    {clientsWithInvoices.map(client => (
                      <MenuItem key={client.client_id} value={client.client_id}>
                        {client.client_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required disabled={!newBill.client_id || loadingDates}>
                  <InputLabel>Invoice Date</InputLabel>
                  <Select 
                    value={selectedDate} 
                    label="Invoice Date" 
                    onChange={(e) => handleDateSelect(newBill.client_id, e.target.value)}
                  >
                    <MenuItem value="">
                      {loadingDates ? "Loading dates..." : "Select Date"}
                    </MenuItem>
                    {invoiceDates.map((date, index) => (
                      <MenuItem key={index} value={date}>
                        {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required disabled={!selectedDate || loadingInvoices}>
                  <InputLabel>Invoice Number</InputLabel>
                  <Select 
                    value={newBill.invoice_id} 
                    label="Invoice Number" 
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                  >
                    <MenuItem value="">
                      {loadingInvoices ? "Loading invoices..." : "Select Invoice"}
                    </MenuItem>
                    {clientInvoices.map(inv => (
                      <MenuItem key={inv.invoice_id} value={inv.invoice_id}>
                        {(inv.invoice_number || `INV-${inv.invoice_id}`)} | {inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "--"} | ₹{inv.total_amount?.toLocaleString() || 0}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Total Amount"
                  value={`₹${newBill.total_amount?.toLocaleString() || 0}`}
                  disabled
                  helperText="Auto-populated from selected invoice"
                />
              </Grid>
              <Grid item xs={12}>
                <AppDatePicker 
                  label="Bill Date" 
                  value={newBill.bill_date} 
                  onChange={(val) => setNewBill(prev => ({ ...prev, bill_date: val }))} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Notes" multiline rows={3} value={newBill.notes} onChange={(e) => setNewBill(prev => ({ ...prev, notes: e.target.value }))} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleCreateBill} 
              disabled={!newBill.invoice_id}
              sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Dialog */}
        <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Status</DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={newStatus} label="Status" onChange={(e) => setNewStatus(e.target.value)}>
                <MenuItem value="UNPAID">Unpaid</MenuItem>
                <MenuItem value="PARTIAL">Partial</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleStatusChange} sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>Update</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ErrorBoundary>
  );
};

export default BillsPage;
