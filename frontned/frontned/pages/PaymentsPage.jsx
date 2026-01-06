import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { getPayments, getPaymentSummary, getAvailableDates as fetchAvailableDates } from "../api/payments";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  TableContainer,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  TablePagination,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  AddCircle as AddPartialIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";

const normalizeISODate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const PaymentsPage = () => {
  // State
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPartialDialog, setOpenPartialDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [currentPayment, setCurrentPayment] = useState({
    paymentId: null,
    clientId: "",
    invoiceId: "",
    totalAmount: "",
    paidAmount: "",
    billDate: "",
    dueDate: "",
    paymentMode: "Cash",
    referenceNo: "",
    remarks: "",
  });
  const [partialPayment, setPartialPayment] = useState({
    amount: "",
    paymentMode: "Cash",
    referenceNo: "",
    remarks: "",
  });
  
  // Filters - All server-side
  const [filters, setFilters] = useState({
    clientId: "",
    billDate: "",
    status: "",
    paymentMode: "",
    startDate: "",
    endDate: "",
    isOverdue: "",
  });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Summary - From backend
  const [summary, setSummary] = useState({
    count: 0,
    totalBilled: 0,
    totalReceived: 0,
    totalPending: 0,
    collectionRate: 0,
    overdueCount: 0,
    overdueAmount: 0,
  });
  
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [filterDates, setFilterDates] = useState([]);
  const [filterDatesLoading, setFilterDatesLoading] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch payments when filters or pagination changes
  useEffect(() => {
    fetchPaymentsData();
    fetchSummaryData();
  }, [filters, page, rowsPerPage]);

  // Fetch available dates when client filter changes
  useEffect(() => {
    if (filters.clientId) {
      fetchBillDates(filters.clientId);
    } else {
      setFilterDates([]);
    }
  }, [filters.clientId]);

  const fetchBillDates = async (clientId) => {
    if (!clientId) {
      setFilterDates([]);
      return;
    }
    setFilterDatesLoading(true);
    try {
      const res = await fetchAvailableDates(clientId);
      setFilterDates(res?.data || []);
    } catch (e) {
      console.error("Failed to fetch available dates", e);
      setFilterDates([]);
    } finally {
      setFilterDatesLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get("/api/clients");
      setClients(res.data);
    } catch (e) {
      console.error("Failed to fetch clients", e);
      showNotification("Failed to load clients", "error");
    }
  };

  const fetchPaymentsData = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...filters,
        page: page + 1,
        limit: rowsPerPage,
      };
      // Remove empty filters
      Object.keys(filterParams).forEach(key => {
        if (!filterParams[key]) delete filterParams[key];
      });
      
      const response = await getPayments(filterParams);
      const list = Array.isArray(response?.data) ? response.data : [];
      setPayments(list);
      setTotalCount(response?.pagination?.total || list.length);
    } catch (e) {
      console.error("Failed to fetch payments", e);
      showNotification(e.response?.data?.error || "Failed to fetch payments", "error");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryData = async () => {
    try {
      const filterParams = { ...filters };
      Object.keys(filterParams).forEach(key => {
        if (!filterParams[key]) delete filterParams[key];
      });
      
      const response = await getPaymentSummary(filterParams);
      if (response?.success && response?.data) {
        setSummary({
          count: response.data.count || 0,
          totalBilled: response.data.totalBilled || 0,
          totalReceived: response.data.totalReceived || 0,
          totalPending: response.data.totalPending || 0,
          collectionRate: response.data.collectionRate || 0,
          overdueCount: response.data.overdueCount || 0,
          overdueAmount: response.data.overdueAmount || 0,
        });
      }
    } catch (e) {
      console.error("Failed to fetch summary", e);
      // Calculate from local data as fallback
      const totalBilled = payments.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
      const totalReceived = payments.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
      const totalPending = payments.reduce((sum, p) => sum + (Number(p.balanceAmount) || 0), 0);
      setSummary({
        count: payments.length,
        totalBilled,
        totalReceived,
        totalPending,
        collectionRate: totalBilled > 0 ? ((totalReceived / totalBilled) * 100).toFixed(1) : 0,
        overdueCount: 0,
        overdueAmount: 0,
      });
    }
  };

  const showNotification = (message, severity = "info") => {
    setNotification({ open: true, message, severity });
  };

  const handleOpenDialog = (payment = null) => {
    if (payment) {
      setEditMode(true);
      setCurrentPayment({
        paymentId: payment.paymentId,
        clientId: payment.clientId,
        invoiceId: payment.invoiceId || "",
        totalAmount: payment.totalAmount,
        paidAmount: payment.paidAmount,
        billDate: normalizeISODate(payment.billDate),
        dueDate: normalizeISODate(payment.dueDate),
        paymentMode: payment.paymentMode || "Cash",
        referenceNo: payment.referenceNo || "",
        remarks: payment.remarks || "",
      });
    } else {
      setEditMode(false);
      setCurrentPayment({
        paymentId: null,
        clientId: "",
        invoiceId: "",
        totalAmount: "",
        paidAmount: "",
        billDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        paymentMode: "Cash",
        referenceNo: "",
        remarks: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentPayment({
      paymentId: null,
      clientId: "",
      invoiceId: "",
      totalAmount: "",
      paidAmount: "",
      billDate: "",
      dueDate: "",
      paymentMode: "Cash",
      referenceNo: "",
      remarks: "",
    });
  };

  const handleSavePayment = async () => {
    try {
      if (!currentPayment.clientId || !currentPayment.totalAmount || !currentPayment.billDate) {
        showNotification("Please fill in required fields (Client, Bill Date, Total Amount)", "error");
        return;
      }

      const paymentData = {
        clientId: Number(currentPayment.clientId),
        invoiceId: currentPayment.invoiceId ? Number(currentPayment.invoiceId) : null,
        totalAmount: Number(currentPayment.totalAmount),
        paidAmount: Number(currentPayment.paidAmount || 0),
        billDate: currentPayment.billDate,
        dueDate: currentPayment.dueDate || null,
        paymentMode: currentPayment.paymentMode,
        referenceNo: currentPayment.referenceNo,
        remarks: currentPayment.remarks,
      };

      if (editMode) {
        await api.put(`/api/payments/${currentPayment.paymentId}`, paymentData);
        showNotification("Payment updated successfully", "success");
      } else {
        await api.post("/api/payments", paymentData);
        showNotification("Payment created successfully", "success");
      }

      handleCloseDialog();
      fetchPaymentsData();
      fetchSummaryData();
    } catch (e) {
      console.error("Failed to save payment", e);
      showNotification(e.response?.data?.error || "Failed to save payment", "error");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/payments/${paymentId}`);
      showNotification("Payment deleted successfully", "success");
      fetchPaymentsData();
      fetchSummaryData();
    } catch (e) {
      console.error("Failed to delete payment", e);
      showNotification(e.response?.data?.error || "Failed to delete payment", "error");
    }
  };

  const handleOpenPartialDialog = (payment) => {
    setSelectedPayment(payment);
    setPartialPayment({
      amount: "",
      paymentMode: payment.paymentMode || "Cash",
      referenceNo: "",
      remarks: "",
    });
    setOpenPartialDialog(true);
  };

  const handleAddPartialPayment = async () => {
    if (!partialPayment.amount || Number(partialPayment.amount) <= 0) {
      showNotification("Please enter a valid payment amount", "error");
      return;
    }
    
    if (Number(partialPayment.amount) > selectedPayment.balanceAmount) {
      showNotification(`Amount cannot exceed balance of ₹${selectedPayment.balanceAmount.toLocaleString()}`, "error");
      return;
    }

    try {
      await api.post(`/api/payments/${selectedPayment.paymentId}/partial`, partialPayment);
      showNotification("Partial payment recorded successfully", "success");
      setOpenPartialDialog(false);
      fetchPaymentsData();
      fetchSummaryData();
    } catch (e) {
      console.error("Failed to add partial payment", e);
      showNotification(e.response?.data?.error || "Failed to add partial payment", "error");
    }
  };

  const handleViewPayment = async (payment) => {
    try {
      const response = await api.get(`/api/payments/${payment.paymentId}`);
      setSelectedPayment(response.data?.data || payment);
      setOpenViewDialog(true);
    } catch (e) {
      setSelectedPayment(payment);
      setOpenViewDialog(true);
    }
  };

  const clearFilters = () => {
    setFilters({
      clientId: "",
      billDate: "",
      status: "",
      paymentMode: "",
      startDate: "",
      endDate: "",
      isOverdue: "",
    });
    setFilterDates([]);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (payment) => {
    if (payment.paymentStatus) return payment.paymentStatus;
    if (payment.balanceAmount <= 0) return 'Paid';
    if (payment.paidAmount > 0) return 'Partial';
    return 'Pending';
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" }, 
        justifyContent: "space-between", 
        mb: 3,
        gap: 2
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <PaymentIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: "#1976d2" }} />
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            color: "#1e293b",
            fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" }
          }}>
            Payments Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            textTransform: "none",
            fontWeight: 600,
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 1.5 },
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            width: { xs: "100%", sm: "auto" }
          }}
        >
          Add Payment
        </Button>
      </Box>

      {/* Filters Section */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <FilterListIcon sx={{ color: "#64748b" }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
            Filters
          </Typography>
          {loading && <CircularProgress size={20} />}
        </Box>
        <Grid container spacing={2}>
          {/* Client Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Client</InputLabel>
              <Select
                value={filters.clientId}
                label="Client"
                onChange={(e) => {
                  const clientId = e.target.value;
                  setFilters(prev => ({ ...prev, clientId, billDate: "" }));
                  setPage(0);
                }}
              >
                <MenuItem value="">All Clients</MenuItem>
                {clients.map(c => (
                  <MenuItem key={c.client_id || c.clientId} value={c.client_id || c.clientId}>
                    {c.client_name || c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Payment Status Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setPage(0);
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Partial">Partial</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Payment Mode Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Mode</InputLabel>
              <Select
                value={filters.paymentMode}
                label="Mode"
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, paymentMode: e.target.value }));
                  setPage(0);
                }}
              >
                <MenuItem value="">All Modes</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank">Bank</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Online">Online</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Bill Date Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!filters.clientId || filterDatesLoading}>
              <InputLabel>Bill Date</InputLabel>
              <Select
                value={filters.billDate}
                label="Bill Date"
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, billDate: e.target.value }));
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>
                    {!filters.clientId
                      ? "Select client first"
                      : filterDatesLoading
                        ? "Loading dates..."
                        : "All Dates"}
                  </em>
                </MenuItem>
                {filterDates.map((dateObj) => (
                  <MenuItem key={dateObj.iso} value={dateObj.iso}>
                    {dateObj.display || new Date(dateObj.iso).toLocaleDateString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Clear Button */}
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              sx={{ height: "40px", textTransform: "none" }}
            >
              Clear Filters
            </Button>
          </Grid>

          {/* Date Range - Row 2 */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, startDate: e.target.value }));
                setPage(0);
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, endDate: e.target.value }));
                setPage(0);
              }}
            />
          </Grid>

          {/* Overdue Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Overdue</InputLabel>
              <Select
                value={filters.isOverdue}
                label="Overdue"
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, isOverdue: e.target.value }));
                  setPage(0);
                }}
              >
                <MenuItem value="">All Payments</MenuItem>
                <MenuItem value="true">Overdue Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Billed */}
        <Grid item xs={6} sm={6} md={2.4}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                    Total Billed
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                    ₹{summary.totalBilled.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: "block", fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>
                    {summary.count} payments
                  </Typography>
                </Box>
                <AccountBalanceIcon sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Received */}
        <Grid item xs={6} sm={6} md={2.4}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(56, 239, 125, 0.4)",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                    Total Received
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                    ₹{summary.totalReceived.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: "block", fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>
                    Collected
                  </Typography>
                </Box>
                <PaymentIcon sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Pending */}
        <Grid item xs={6} sm={6} md={2.4}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(240, 147, 251, 0.4)",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                    Total Pending
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                    ₹{summary.totalPending.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: "block", fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>
                    Outstanding
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Collection Rate */}
        <Grid item xs={6} sm={6} md={2.4}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(79, 172, 254, 0.4)",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                    Collection Rate
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                    {summary.collectionRate}%
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: "block", fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>
                    Efficiency
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Amount */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              background: summary.overdueAmount > 0 
                ? "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)"
                : "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
              color: summary.overdueAmount > 0 ? "white" : "#334155",
              boxShadow: "0 4px 20px rgba(255, 65, 108, 0.3)",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                    Overdue Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                    ₹{summary.overdueAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: "block", fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>
                    {summary.overdueCount} overdue
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payments Table - Desktop */}
      <Paper sx={{ 
        borderRadius: 2, 
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)", 
        overflow: "hidden",
        display: { xs: "none", md: "block" }
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Bill Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569", textAlign: "right" }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569", textAlign: "right" }}>Paid Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569", textAlign: "right" }}>Balance</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569", textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: "center", py: 4 }}>
                    <CircularProgress size={32} />
                    <Typography sx={{ mt: 1, color: "#64748b" }}>Loading payments...</Typography>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: "center", py: 4, color: "#64748b" }}>
                    No payments found. Add a new payment to get started.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow
                    key={payment.paymentId}
                    sx={{
                      "&:hover": { backgroundColor: "#f1f5f9" },
                      transition: "all 0.2s ease",
                      backgroundColor: payment.isOverdue ? "#fef2f2" : "inherit"
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography sx={{ fontWeight: 500 }}>{payment.clientName || "-"}</Typography>
                        {payment.receiptNumber && (
                          <Typography variant="caption" color="text.secondary">
                            {payment.receiptNumber}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{payment.invoiceNumber || "-"}</TableCell>
                    <TableCell>
                      {payment.billDate ? new Date(payment.billDate).toLocaleDateString('en-IN') : "-"}
                      {payment.isOverdue && (
                        <Chip 
                          label={`${payment.overdueDays}d overdue`} 
                          size="small" 
                          color="error" 
                          sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} 
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      ₹{Number(payment.totalAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Typography sx={{ fontWeight: 600, color: "#059669" }}>
                        ₹{Number(payment.paidAmount || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Typography sx={{ fontWeight: 600, color: payment.balanceAmount > 0 ? "#dc2626" : "#059669" }}>
                        ₹{Number(payment.balanceAmount || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.paymentMode || "Cash"}
                        size="small"
                        sx={{
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(payment)}
                        size="small"
                        color={getStatusColor(getStatusLabel(payment))}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {payment.balanceAmount > 0 && (
                          <Tooltip title="Add Payment">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenPartialDialog(payment)}
                            >
                              <AddPartialIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(payment)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePayment(payment.paymentId)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      {/* Payments Cards - Mobile */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {loading ? (
          <Paper sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
            <CircularProgress size={32} />
            <Typography sx={{ mt: 1 }}>Loading...</Typography>
          </Paper>
        ) : payments.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
            <Typography color="text.secondary">
              No payments found. Add a new payment to get started.
            </Typography>
          </Paper>
        ) : (
          payments.map((payment) => (
            <Card 
              key={payment.paymentId} 
              sx={{ 
                mb: 2, 
                borderRadius: 2, 
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: payment.isOverdue ? "4px solid #dc2626" : "none"
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1e293b" }}>
                      {payment.clientName || "Unknown Client"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {payment.invoiceNumber || "No Invoice"} • {payment.billDate ? new Date(payment.billDate).toLocaleDateString('en-IN') : "No date"}
                    </Typography>
                    {payment.isOverdue && (
                      <Chip 
                        label={`${payment.overdueDays}d overdue`} 
                        size="small" 
                        color="error" 
                        sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} 
                      />
                    )}
                  </Box>
                  <Chip
                    label={getStatusLabel(payment)}
                    size="small"
                    color={getStatusColor(getStatusLabel(payment))}
                  />
                </Box>
                
                <Grid container spacing={1} sx={{ mb: 1.5 }}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Total</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{Number(payment.totalAmount || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Paid</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#059669" }}>
                      ₹{Number(payment.paidAmount || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Balance</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: payment.balanceAmount > 0 ? "#dc2626" : "#059669" }}>
                      ₹{Number(payment.balanceAmount || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Chip
                    label={payment.paymentMode || "Cash"}
                    size="small"
                    sx={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}
                  />
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton size="small" color="info" onClick={() => handleViewPayment(payment)}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    {payment.balanceAmount > 0 && (
                      <IconButton size="small" color="success" onClick={() => handleOpenPartialDialog(payment)}>
                        <AddPartialIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(payment)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeletePayment(payment.paymentId)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
        
        {/* Mobile Pagination */}
        {payments.length > 0 && (
          <Paper sx={{ mt: 2, p: 1 }}>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage=""
            />
          </Paper>
        )}
      </Box>

      {/* Create/Edit Payment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? "Edit Payment" : "Add New Payment"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Client</InputLabel>
                <Select
                  value={currentPayment.clientId}
                  label="Client"
                  onChange={(e) => {
                    setCurrentPayment(prev => ({ ...prev, clientId: e.target.value }));
                  }}
                >
                  {clients.map(c => (
                    <MenuItem key={c.client_id || c.clientId} value={c.client_id || c.clientId}>
                      {c.client_name || c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Bill Date"
                InputLabelProps={{ shrink: true }}
                value={currentPayment.billDate}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, billDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Total Amount"
                type="number"
                value={currentPayment.totalAmount}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, totalAmount: e.target.value }))}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Paid Amount"
                type="number"
                value={currentPayment.paidAmount}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, paidAmount: e.target.value }))}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                InputLabelProps={{ shrink: true }}
                value={currentPayment.dueDate}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={currentPayment.paymentMode}
                  label="Payment Mode"
                  onChange={(e) => setCurrentPayment(prev => ({ ...prev, paymentMode: e.target.value }))}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Bank">Bank Transfer</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                  <MenuItem value="Online">Online</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference Number"
                value={currentPayment.referenceNo}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, referenceNo: e.target.value }))}
                placeholder="Transaction ID, Cheque No., etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={2}
                value={currentPayment.remarks}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, remarks: e.target.value }))}
              />
            </Grid>
            
            {/* Balance Preview */}
            {currentPayment.totalAmount && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: "#f8fafc" }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Total</Typography>
                      <Typography variant="h6">₹{Number(currentPayment.totalAmount || 0).toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Paid</Typography>
                      <Typography variant="h6" sx={{ color: "#059669" }}>₹{Number(currentPayment.paidAmount || 0).toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Balance</Typography>
                      <Typography variant="h6" sx={{ color: (Number(currentPayment.totalAmount) - Number(currentPayment.paidAmount || 0)) > 0 ? "#dc2626" : "#059669" }}>
                        ₹{(Number(currentPayment.totalAmount || 0) - Number(currentPayment.paidAmount || 0)).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePayment}
            startIcon={<SaveIcon />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {editMode ? "Update" : "Create"} Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Partial Payment Dialog */}
      <Dialog open={openPartialDialog} onClose={() => setOpenPartialDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AddPartialIcon color="success" />
            Add Partial Payment
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ mt: 2 }}>
              <Paper sx={{ p: 2, backgroundColor: "#f0fdf4", mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Payment for</Typography>
                <Typography variant="h6">{selectedPayment.clientName}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="caption">Total</Typography>
                    <Typography variant="body1" fontWeight={600}>₹{selectedPayment.totalAmount?.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption">Already Paid</Typography>
                    <Typography variant="body1" fontWeight={600} color="success.main">₹{selectedPayment.paidAmount?.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption">Balance Due</Typography>
                    <Typography variant="body1" fontWeight={600} color="error.main">₹{selectedPayment.balanceAmount?.toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Payment Amount"
                    type="number"
                    value={partialPayment.amount}
                    onChange={(e) => setPartialPayment(prev => ({ ...prev, amount: e.target.value }))}
                    InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography> }}
                    helperText={`Maximum: ₹${selectedPayment.balanceAmount?.toLocaleString()}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select
                      value={partialPayment.paymentMode}
                      label="Payment Mode"
                      onChange={(e) => setPartialPayment(prev => ({ ...prev, paymentMode: e.target.value }))}
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank">Bank Transfer</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Reference No."
                    value={partialPayment.referenceNo}
                    onChange={(e) => setPartialPayment(prev => ({ ...prev, referenceNo: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    value={partialPayment.remarks}
                    onChange={(e) => setPartialPayment(prev => ({ ...prev, remarks: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPartialDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAddPartialPayment}
            startIcon={<SaveIcon />}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ReceiptIcon color="primary" />
            Payment Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ mt: 2 }}>
              <Paper sx={{ p: 2, backgroundColor: "#f8fafc", mb: 2 }}>
                <Typography variant="overline" color="text.secondary">Receipt</Typography>
                <Typography variant="h6">{selectedPayment.receiptNumber || `#${selectedPayment.paymentId}`}</Typography>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Client</Typography>
                  <Typography variant="body1" fontWeight={500}>{selectedPayment.clientName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Invoice</Typography>
                  <Typography variant="body1">{selectedPayment.invoiceNumber || "-"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Bill Date</Typography>
                  <Typography variant="body1">{selectedPayment.billDate ? new Date(selectedPayment.billDate).toLocaleDateString('en-IN') : "-"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Due Date</Typography>
                  <Typography variant="body1">{selectedPayment.dueDate ? new Date(selectedPayment.dueDate).toLocaleDateString('en-IN') : "-"}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ height: 1, backgroundColor: "#e2e8f0", my: 1 }} />
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                  <Typography variant="h6">₹{selectedPayment.totalAmount?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Paid Amount</Typography>
                  <Typography variant="h6" color="success.main">₹{selectedPayment.paidAmount?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Balance</Typography>
                  <Typography variant="h6" color={selectedPayment.balanceAmount > 0 ? "error.main" : "success.main"}>
                    ₹{selectedPayment.balanceAmount?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ height: 1, backgroundColor: "#e2e8f0", my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Payment Mode</Typography>
                  <Typography variant="body1">{selectedPayment.paymentMode || "Cash"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>
                    <Chip 
                      label={getStatusLabel(selectedPayment)} 
                      size="small" 
                      color={getStatusColor(getStatusLabel(selectedPayment))}
                    />
                    {selectedPayment.isOverdue && (
                      <Chip label={`${selectedPayment.overdueDays}d overdue`} size="small" color="error" sx={{ ml: 1 }} />
                    )}
                  </Box>
                </Grid>
                {selectedPayment.referenceNo && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Reference No.</Typography>
                    <Typography variant="body1">{selectedPayment.referenceNo}</Typography>
                  </Grid>
                )}
                {selectedPayment.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Remarks</Typography>
                    <Typography variant="body1">{selectedPayment.remarks}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
          {selectedPayment?.balanceAmount > 0 && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setOpenViewDialog(false);
                handleOpenPartialDialog(selectedPayment);
              }}
              startIcon={<AddPartialIcon />}
            >
              Add Payment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentsPage;
