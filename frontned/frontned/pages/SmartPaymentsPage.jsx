/**
 * Smart Payments Page
 * 
 * CORE FEATURES:
 * - Client dropdown selection (required first)
 * - Bill Date dropdown auto-populates based on client
 * - NO manual date entry
 * - Apply Filter to fetch payments
 * - Partial payment with automatic balance calculation
 * - Transaction audit history
 * 
 * WORKFLOW:
 * 1. Select Client → Bill dates load automatically
 * 2. Select Bill Date (optional)
 * 3. Click Apply Filter → Payments display
 * 4. Add partial payment → Balance updates
 */

import React, { useState, useEffect, useCallback } from "react";
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  AddCircle as AddPartialIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  getClientsForPayment,
  getBillDatesForClient,
  getFilteredPayments,
  getFilteredPaymentSummary,
  addPartialPayment,
  getPaymentTransactions,
} from "../api/smartPayments";

const SmartPaymentsPage = () => {
  // ============================================================
  // STATE
  // ============================================================
  
  // Dropdown data
  const [clients, setClients] = useState([]);
  const [billDates, setBillDates] = useState([]);
  
  // Loading states
  const [clientsLoading, setClientsLoading] = useState(false);
  const [datesLoading, setDatesLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  
  // Filter state (ONLY client, date, status, mode - NO manual date entry)
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedBillDate, setSelectedBillDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  
  // Applied filters (what's currently showing)
  const [appliedFilters, setAppliedFilters] = useState({
    clientId: "",
    billDate: "",
    status: "",
    paymentMode: "",
  });
  
  // Results
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    count: 0,
    totalBilled: 0,
    totalReceived: 0,
    totalPending: 0,
    collectionRate: 0,
    overdueCount: 0,
    overdueAmount: 0,
  });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialogs
  const [partialDialogOpen, setPartialDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Partial payment form
  const [partialAmount, setPartialAmount] = useState("");
  const [partialMode, setPartialMode] = useState("Cash");
  const [partialReference, setPartialReference] = useState("");
  const [partialRemarks, setPartialRemarks] = useState("");
  const [partialLoading, setPartialLoading] = useState(false);
  
  // Notification
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // ============================================================
  // EFFECTS
  // ============================================================
  
  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load bill dates when client changes
  useEffect(() => {
    if (selectedClient) {
      loadBillDates(selectedClient);
    } else {
      setBillDates([]);
      setSelectedBillDate("");
    }
  }, [selectedClient]);

  // ============================================================
  // DATA LOADING
  // ============================================================
  
  const loadClients = async () => {
    setClientsLoading(true);
    try {
      const response = await getClientsForPayment();
      if (response.success) {
        setClients(response.data || []);
      } else {
        showNotification("Failed to load clients", "error");
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      showNotification(error.response?.data?.error || "Failed to load clients", "error");
    } finally {
      setClientsLoading(false);
    }
  };

  const loadBillDates = async (clientId) => {
    setDatesLoading(true);
    setSelectedBillDate(""); // Reset date when client changes
    try {
      console.log("🔍 Fetching bill dates for client:", clientId);
      const response = await getBillDatesForClient(clientId);
      console.log("📅 Bill dates response:", response);
      
      if (response.success) {
        const dates = response.data || [];
        console.log(`✅ Loaded ${dates.length} bill dates:`, dates);
        setBillDates(dates);
        
        if (dates.length === 0) {
          showNotification("No invoices found for this client", "info");
        }
      } else {
        console.warn("❌ Bill dates fetch failed:", response);
        setBillDates([]);
        showNotification(response.error || "Failed to load bill dates", "error");
      }
    } catch (error) {
      console.error("💥 Error loading bill dates:", error);
      console.error("Error details:", error.response?.data);
      setBillDates([]);
      showNotification(
        error.response?.data?.error || "Failed to load bill dates", 
        "error"
      );
    } finally {
      setDatesLoading(false);
    }
  };

  const loadPayments = async (filters) => {
    setPaymentsLoading(true);
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        getFilteredPayments({
          ...filters,
          page: page + 1,
          limit: rowsPerPage,
        }),
        getFilteredPaymentSummary(filters),
      ]);

      if (paymentsRes.success) {
        setPayments(paymentsRes.data || []);
        setTotalCount(paymentsRes.pagination?.total || 0);
      } else {
        setPayments([]);
        setTotalCount(0);
      }

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
    } catch (error) {
      console.error("Error loading payments:", error);
      showNotification(error.response?.data?.error || "Failed to load payments", "error");
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadTransactions = async (paymentId) => {
    try {
      const response = await getPaymentTransactions(paymentId);
      if (response.success) {
        setTransactions(response.data || []);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactions([]);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  
  const handleApplyFilter = () => {
    if (!selectedClient) {
      showNotification("Please select a client first", "warning");
      return;
    }

    const filters = {
      clientId: selectedClient,
      billDate: selectedBillDate,
      status: selectedStatus,
      paymentMode: selectedMode,
    };

    setAppliedFilters(filters);
    setPage(0);
    loadPayments(filters);
  };

  const handleClearFilters = () => {
    setSelectedClient("");
    setSelectedBillDate("");
    setSelectedStatus("");
    setSelectedMode("");
    setBillDates([]);
    setAppliedFilters({
      clientId: "",
      billDate: "",
      status: "",
      paymentMode: "",
    });
    setPayments([]);
    setSummary({
      count: 0,
      totalBilled: 0,
      totalReceived: 0,
      totalPending: 0,
      collectionRate: 0,
      overdueCount: 0,
      overdueAmount: 0,
    });
    setTotalCount(0);
  };

  const handleRefresh = () => {
    if (appliedFilters.clientId) {
      loadPayments(appliedFilters);
    }
  };

  const handleOpenPartialDialog = (payment) => {
    setSelectedPayment(payment);
    setPartialAmount("");
    setPartialMode(payment.paymentMode || "Cash");
    setPartialReference("");
    setPartialRemarks("");
    setPartialDialogOpen(true);
  };

  const handleAddPartialPayment = async () => {
    if (!partialAmount || Number(partialAmount) <= 0) {
      showNotification("Please enter a valid amount", "error");
      return;
    }

    if (Number(partialAmount) > selectedPayment.balanceAmount) {
      showNotification(
        `Amount cannot exceed pending balance of ₹${selectedPayment.balanceAmount.toLocaleString()}`,
        "error"
      );
      return;
    }

    setPartialLoading(true);
    try {
      const response = await addPartialPayment(selectedPayment.paymentId, {
        amount: Number(partialAmount),
        paymentMode: partialMode,
        referenceNo: partialReference,
        remarks: partialRemarks,
      });

      if (response.success) {
        showNotification(response.message || "Payment recorded successfully", "success");
        setPartialDialogOpen(false);
        // Refresh the payments list
        loadPayments(appliedFilters);
      } else {
        showNotification(response.error || "Failed to record payment", "error");
      }
    } catch (error) {
      console.error("Error adding partial payment:", error);
      showNotification(
        error.response?.data?.error || "Failed to record payment",
        "error"
      );
    } finally {
      setPartialLoading(false);
    }
  };

  const handleViewHistory = async (payment) => {
    setSelectedPayment(payment);
    await loadTransactions(payment.paymentId);
    setHistoryDialogOpen(true);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    if (appliedFilters.clientId) {
      loadPayments({ ...appliedFilters, page: newPage + 1, limit: rowsPerPage });
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setRowsPerPage(newLimit);
    setPage(0);
    if (appliedFilters.clientId) {
      loadPayments({ ...appliedFilters, page: 1, limit: newLimit });
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  
  const showNotification = (message, severity = "info") => {
    setNotification({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "pending":
        return "error";
      case "overdue":
        return "error";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(Number(amount) || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === Number(clientId));
    return client?.name || "";
  };

  // ============================================================
  // RENDER
  // ============================================================
  
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          mb: 3,
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <PaymentIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: "#1976d2" }} />
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" },
              }}
            >
              Smart Payment Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select client → Choose date → View & manage payments
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={!appliedFilters.clientId || paymentsLoading}
          sx={{ textTransform: "none" }}
        >
          Refresh
        </Button>
      </Box>

      {/* Filter Section - CRITICAL: Client first, then dates auto-load */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "2px solid #e2e8f0",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <FilterListIcon sx={{ color: "#1976d2" }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155" }}>
            Filter Payments
          </Typography>
          <Chip
            label="Select client first to load dates"
            size="small"
            color="info"
            variant="outlined"
          />
        </Box>

        <Grid container spacing={2} alignItems="flex-end">
          {/* Client Dropdown - REQUIRED FIRST */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Client *</InputLabel>
              <Select
                value={selectedClient}
                label="Client *"
                onChange={(e) => setSelectedClient(e.target.value)}
                disabled={clientsLoading}
              >
                <MenuItem value="">
                  <em>Select a client</em>
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Bill Date Dropdown - AUTO-POPULATED, disabled until client selected */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!selectedClient || datesLoading}>
              <InputLabel>Bill Date</InputLabel>
              <Select
                value={selectedBillDate}
                label="Bill Date"
                onChange={(e) => setSelectedBillDate(e.target.value)}
              >
                <MenuItem value="">
                  <em>
                    {!selectedClient
                      ? "Select client first"
                      : datesLoading
                      ? "Loading dates..."
                      : billDates.length === 0
                      ? "No dates available"
                      : "All dates"}
                  </em>
                </MenuItem>
                {billDates.map((date) => (
                  <MenuItem key={date.iso} value={date.iso}>
                    {date.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
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
                value={selectedMode}
                label="Mode"
                onChange={(e) => setSelectedMode(e.target.value)}
              >
                <MenuItem value="">All Modes</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank">Bank</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} sm={12} md={2}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleApplyFilter}
                disabled={!selectedClient || paymentsLoading}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{ textTransform: "none", minWidth: "auto", px: 2 }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Applied Filters Display */}
        {appliedFilters.clientId && (
          <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`Client: ${getClientName(appliedFilters.clientId)}`}
              size="small"
              color="primary"
            />
            {appliedFilters.billDate && (
              <Chip
                label={`Date: ${formatDate(appliedFilters.billDate)}`}
                size="small"
                color="secondary"
              />
            )}
            {appliedFilters.status && (
              <Chip label={`Status: ${appliedFilters.status}`} size="small" />
            )}
            {appliedFilters.paymentMode && (
              <Chip label={`Mode: ${appliedFilters.paymentMode}`} size="small" />
            )}
          </Box>
        )}
      </Paper>

      {/* Summary Cards - Only show when filters applied */}
      {appliedFilters.clientId && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={2.4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  Total Billed
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(summary.totalBilled)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {summary.count} records
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={2.4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(56, 239, 125, 0.4)",
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  Total Received
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(summary.totalReceived)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Collected
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={2.4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(240, 147, 251, 0.4)",
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  Total Pending
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(summary.totalPending)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Outstanding
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={2.4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(79, 172, 254, 0.4)",
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  Collection Rate
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {summary.collectionRate}%
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Efficiency
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                background:
                  summary.overdueAmount > 0
                    ? "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)"
                    : "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                color: summary.overdueAmount > 0 ? "white" : "#334155",
                boxShadow: "0 4px 20px rgba(255, 65, 108, 0.3)",
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  Overdue
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(summary.overdueAmount)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {summary.overdueCount} overdue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Payments Table */}
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Bill Date</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Paid</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: "center", py: 6 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2, color: "#64748b" }}>
                      Loading payments...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : !appliedFilters.clientId ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: "center", py: 6 }}>
                    <FilterListIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
                    <Typography variant="h6" sx={{ color: "#64748b" }}>
                      Select a client and apply filter
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      Use the filters above to view payments
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: "center", py: 6 }}>
                    <PaymentIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
                    <Typography variant="h6" sx={{ color: "#64748b" }}>
                      No payments found
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      No payment records match the selected filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow
                    key={payment.paymentId}
                    sx={{
                      "&:hover": { backgroundColor: "#f1f5f9" },
                      backgroundColor: payment.isOverdue ? "#fef2f2" : "inherit",
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography sx={{ fontWeight: 500 }}>
                          {payment.clientName}
                        </Typography>
                        {payment.receiptNumber && (
                          <Typography variant="caption" color="text.secondary">
                            {payment.receiptNumber}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{payment.invoiceNumber || "-"}</TableCell>
                    <TableCell>
                      {formatDate(payment.billDate)}
                      {payment.isOverdue && (
                        <Chip
                          label={`${payment.overdueDays}d overdue`}
                          size="small"
                          color="error"
                          sx={{ ml: 1, height: 20, fontSize: "0.65rem" }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      {formatCurrency(payment.totalAmount)}
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Typography sx={{ fontWeight: 600, color: "#059669" }}>
                        {formatCurrency(payment.paidAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: payment.balanceAmount > 0 ? "#dc2626" : "#059669",
                        }}
                      >
                        {formatCurrency(payment.balanceAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.paymentMode || "Cash"}
                        size="small"
                        sx={{
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.paymentStatus}
                        size="small"
                        color={getStatusColor(payment.paymentStatus)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewDetails(payment)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Transaction History">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleViewHistory(payment)}
                          >
                            <HistoryIcon fontSize="small" />
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
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {payments.length > 0 && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </Paper>

      {/* Partial Payment Dialog */}
      <Dialog
        open={partialDialogOpen}
        onClose={() => setPartialDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AddPartialIcon color="success" />
            <Typography variant="h6">Add Payment</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Client
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedPayment.clientName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Invoice
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedPayment.invoiceNumber || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatCurrency(selectedPayment.totalAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Pending Balance
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="error">
                    {formatCurrency(selectedPayment.balanceAmount)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Amount *"
                type="number"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                }}
                helperText={
                  selectedPayment
                    ? `Max: ₹${selectedPayment.balanceAmount?.toLocaleString()}`
                    : ""
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={partialMode}
                  label="Payment Mode"
                  onChange={(e) => setPartialMode(e.target.value)}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Bank">Bank Transfer</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reference Number"
                value={partialReference}
                onChange={(e) => setPartialReference(e.target.value)}
                placeholder="Transaction ID, Cheque No., etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={partialRemarks}
                onChange={(e) => setPartialRemarks(e.target.value)}
                multiline
                rows={2}
                placeholder="Optional payment notes"
              />
            </Grid>
          </Grid>

          {/* Preview */}
          {partialAmount && selectedPayment && Number(partialAmount) > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "#ecfdf5",
                borderRadius: 2,
                border: "1px solid #10b981",
              }}
            >
              <Typography variant="subtitle2" color="success.dark" gutterBottom>
                After this payment:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption">New Paid Amount</Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main">
                    {formatCurrency(
                      (selectedPayment.paidAmount || 0) + Number(partialAmount)
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption">New Balance</Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color={
                      selectedPayment.balanceAmount - Number(partialAmount) > 0
                        ? "error.main"
                        : "success.main"
                    }
                  >
                    {formatCurrency(
                      selectedPayment.balanceAmount - Number(partialAmount)
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPartialDialogOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAddPartialPayment}
            disabled={partialLoading || !partialAmount || Number(partialAmount) <= 0}
            startIcon={partialLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            sx={{ textTransform: "none" }}
          >
            {partialLoading ? "Processing..." : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HistoryIcon color="secondary" />
            <Typography variant="h6">Payment Transaction History</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}>
              <Typography variant="subtitle2">
                {selectedPayment.clientName} - {selectedPayment.invoiceNumber || "No Invoice"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {formatCurrency(selectedPayment.totalAmount)} | Paid:{" "}
                {formatCurrency(selectedPayment.paidAmount)} | Balance:{" "}
                {formatCurrency(selectedPayment.balanceAmount)}
              </Typography>
            </Box>
          )}

          {transactions.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <HistoryIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
              <Typography color="text.secondary">No transaction history found</Typography>
            </Box>
          ) : (
            <List>
              {transactions.map((tx, index) => (
                <React.Fragment key={tx.transactionId}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="subtitle2">
                            {tx.transactionType === "initial"
                              ? "Initial Payment"
                              : "Partial Payment"}
                          </Typography>
                          <Typography variant="subtitle2" color="success.main">
                            +{formatCurrency(tx.amount)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" component="span">
                            {formatDate(tx.transactionDate)} | {tx.paymentMode}
                            {tx.referenceNo && ` | Ref: ${tx.referenceNo}`}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Balance: {formatCurrency(tx.balanceBefore)} →{" "}
                            {formatCurrency(tx.balanceAfter)}
                          </Typography>
                          {tx.remarks && (
                            <>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                {tx.remarks}
                              </Typography>
                            </>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < transactions.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ViewIcon color="info" />
            <Typography variant="h6">Payment Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Receipt Number
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedPayment.receiptNumber || "-"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Client
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedPayment.clientName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Invoice Number
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedPayment.invoiceNumber || "-"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Bill Date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDate(selectedPayment.billDate)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(selectedPayment.totalAmount)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Paid Amount
                </Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {formatCurrency(selectedPayment.paidAmount)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Balance
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color={selectedPayment.balanceAmount > 0 ? "error.main" : "success.main"}
                >
                  {formatCurrency(selectedPayment.balanceAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Payment Mode
                </Typography>
                <Typography variant="body1">{selectedPayment.paymentMode || "Cash"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedPayment.paymentStatus}
                    color={getStatusColor(selectedPayment.paymentStatus)}
                    size="small"
                  />
                  {selectedPayment.isOverdue && (
                    <Chip
                      label={`${selectedPayment.overdueDays} days overdue`}
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Grid>
              {selectedPayment.referenceNo && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Reference Number
                  </Typography>
                  <Typography variant="body1">{selectedPayment.referenceNo}</Typography>
                </Grid>
              )}
              {selectedPayment.remarks && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Remarks
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {selectedPayment.remarks}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedPayment?.balanceAmount > 0 && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddPartialIcon />}
              onClick={() => {
                setViewDialogOpen(false);
                handleOpenPartialDialog(selectedPayment);
              }}
            >
              Add Payment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SmartPaymentsPage;
