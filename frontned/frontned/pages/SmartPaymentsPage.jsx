import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Divider,
  TablePagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
} from "@mui/icons-material";

const SmartPaymentsPage = () => {
  const location = useLocation();
  const newInvoiceFromRoute = location.state?.newInvoice;
  const autoSelectInvoiceId = location.state?.autoSelectInvoice;

  // Payment Mode Configuration - ENUM values and display labels
  const PAYMENT_MODES = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'BANK', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
  ];

  // State for clients and invoices
  const [clients, setClients] = useState([]);
  const [clientInvoices, setClientInvoices] = useState({}); // Grouped by client
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState("");
  const [selectedInvoiceData, setSelectedInvoiceData] = useState([]);

  // State for payment
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH"); // UPPERCASE ENUM
  const [paymentNotes, setPaymentNotes] = useState("");

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPaymentItem, setSelectedPaymentItem] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch clients and their invoices on mount
  useEffect(() => {
    fetchClientsWithInvoices();

    // Auto-select newly created invoice if available
    if (newInvoiceFromRoute && autoSelectInvoiceId) {
      setSelectedClient(newInvoiceFromRoute.clientId);
      setSelectedInvoiceDate(newInvoiceFromRoute.date);
      fetchInvoiceDetails(newInvoiceFromRoute.clientId, newInvoiceFromRoute.date);
    }
  }, []);

  const fetchClientsWithInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all invoices (filter to show only those created from Invoice page)
      const res = await fetch("http://localhost:5000/api/invoices");
      const invoices = await res.json();

      // Group invoices by client
      const grouped = {};
      invoices.forEach((invoice) => {
        if (!grouped[invoice.client_id]) {
          grouped[invoice.client_id] = {
            client_id: invoice.client_id,
            client_name: invoice.client_name,
            dates: [],
          };
        }

        // Add unique dates
        if (!grouped[invoice.client_id].dates.includes(invoice.date)) {
          grouped[invoice.client_id].dates.push(invoice.date);
        }
      });

      setClientInvoices(grouped);

      // Extract unique clients
      const clientList = Object.values(grouped);
      setClients(clientList);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError("Failed to load invoices. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (clientId, date) => {
    try {
      setLoading(true);
      setError("");
      setSelectedInvoiceData([]);

      // Fetch invoices for specific client and date
      const res = await fetch(
        `http://localhost:5000/api/invoices?clientId=${clientId}&date=${date}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch invoice details");
      }

      const invoices = await res.json();

      // If we have invoices, fetch their trip details
      if (invoices && invoices.length > 0) {
        // For now, we'll fetch trips from create-preview to show trip-level details
        // This matches the existing workflow
        const previewRes = await fetch(
          `http://localhost:5000/api/invoices/create-preview?clientId=${clientId}&date=${date}`
        );
        
        if (previewRes.ok) {
          const tripData = await previewRes.json();
          // Add invoice_id to each trip if available
          const tripsWithInvoice = tripData.map(trip => ({
            ...trip,
            invoice_id: invoices[0]?.invoice_id // Use the first invoice's ID
          }));
          setSelectedInvoiceData(tripsWithInvoice);
        } else {
          setSelectedInvoiceData([]);
        }
      } else {
        setSelectedInvoiceData([]);
      }
    } catch (err) {
      console.error("Failed to fetch invoice details:", err);
      setError("Failed to load invoice details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);
    setSelectedInvoiceDate("");
    setSelectedInvoiceData([]);
  };

  const handleInvoiceDateChange = (e) => {
    const date = e.target.value;
    setSelectedInvoiceDate(date);
    if (selectedClient && date) {
      fetchInvoiceDetails(selectedClient, date);
    }
  };

  const handlePaymentClick = (item) => {
    setSelectedPaymentItem(item);
    setPaymentAmount("");
    setPaymentMode("CASH"); // Use UPPERCASE ENUM value
    setPaymentNotes("");
    setError(""); // Clear any previous errors
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    // Clear previous errors
    setError("");

    // Validation: Amount is required
    if (!paymentAmount || paymentAmount.trim() === "") {
      setError("Payment amount is required");
      return;
    }

    // Validation: Convert and check if valid number
    const amount = Number(paymentAmount);
    if (isNaN(amount)) {
      setError("Payment amount must be a valid number");
      return;
    }

    // Validation: Amount must be greater than 0
    if (amount <= 0) {
      setError("Payment amount must be greater than 0");
      return;
    }

    // Validation: Amount cannot exceed pending balance
    const totalPending = Number(selectedPaymentItem?.pending_amount || 0);
    // Round both values to 2 decimal places to avoid floating-point precision issues
    const roundedAmount = Math.round(amount * 100) / 100;
    const roundedPending = Math.round(totalPending * 100) / 100;
    
    if (roundedAmount > roundedPending) {
      setError(`Payment amount cannot exceed pending balance of ₹${totalPending.toLocaleString("en-IN")}`);
      return;
    }

    // Validation: Payment mode is required
    if (!paymentMode || paymentMode.trim() === "") {
      setError("Please select a payment mode");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Prepare payment data for backend - TRIP PAYMENT
      const paymentData = {
        trip_id: selectedPaymentItem.trip_id || selectedPaymentItem.id,
        client_id: parseInt(selectedClient),
        amount: Number(amount), // Must be a number
        payment_mode: paymentMode, // Already in UPPERCASE ENUM format (CASH, BANK, etc.)
        payment_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        remarks: paymentNotes || `Payment for trip #${selectedPaymentItem.trip_id || selectedPaymentItem.id}`,
      };

      console.log('Submitting payment:', paymentData);

      // Submit payment to backend - Use trip payment endpoint
      const res = await fetch("http://localhost:5000/api/smart-payments/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("Payment error response:", errData);
        
        // Show detailed validation errors if available
        if (errData.validationErrors) {
          const errorDetails = errData.validationErrors
            .map(e => `${e.field}: ${e.message}`)
            .join('\n');
          throw new Error(errorDetails || errData.error);
        }
        
        const errorMsg = errData.detail || errData.error || "Failed to process payment";
        throw new Error(errorMsg);
      }

      const responseData = await res.json();
      console.log("Payment recorded successfully:", responseData);

      // Update local state using response data
      const updatedInvoiceData = selectedInvoiceData.map((item) => {
        if ((item.trip_id || item.id) === (selectedPaymentItem.trip_id || selectedPaymentItem.id)) {
          // Use values from backend response for accuracy
          return {
            ...item,
            amount_paid: responseData.data?.paid_amount || (Number(item.amount_paid || 0) + amount),
            pending_amount: responseData.data?.pending_amount || Math.max(0, Number(item.amount || item.total_amount || 0) - (Number(item.amount_paid || 0) + amount)),
          };
        }
        return item;
      });

      setSelectedInvoiceData(updatedInvoiceData);

      // Show success message with details
      const statusMsg = responseData.data?.payment_status 
        ? ` (Status: ${responseData.data.payment_status})` 
        : '';
      setSuccess(`Payment of ₹${amount.toLocaleString("en-IN")} recorded successfully!${statusMsg}`);
      
      // Close dialog
      setPaymentDialogOpen(false);

      // Reset form fields
      setPaymentAmount("");
      setPaymentMode("CASH"); // Reset to UPPERCASE ENUM
      setPaymentNotes("");
      setSelectedPaymentItem(null);

      // Add to transaction history
      const newTransaction = {
        id: Date.now(),
        tripId: selectedPaymentItem.trip_id || selectedPaymentItem.id,
        invoiceId: selectedPaymentItem.invoice_id,
        amount: amount,
        mode: paymentMode,
        date: new Date().toLocaleDateString("en-IN"),
        notes: paymentNotes,
      };
      setTransactionHistory([newTransaction, ...transactionHistory]);

      // Optional: Refresh data from server after a short delay
      setTimeout(() => {
        if (selectedClient && selectedInvoiceDate) {
          fetchInvoiceDetails(selectedClient, selectedInvoiceDate);
        }
      }, 1000);

    } catch (err) {
      console.error("Failed to submit payment:", err);
      setError(err.message || "Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = selectedInvoiceData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${(Number(amount) || 0).toLocaleString("en-IN")}`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  // Calculate totals for selected invoice
  const calculateTotals = () => {
    return {
      totalAmount: selectedInvoiceData.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0),
      paidAmount: selectedInvoiceData.reduce((sum, item) => sum + (Number(item.amount_paid) || 0), 0),
      pendingAmount: selectedInvoiceData.reduce((sum, item) => sum + (Number(item.pending_amount) || 0), 0),
    };
  };

  const totals = calculateTotals();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
          Smart Payments
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Manage invoice payments and track collections
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess("")}
          message={success}
        />
      )}
      {newInvoiceFromRoute && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Invoice created successfully! Client: <strong>{newInvoiceFromRoute.clientName}</strong> | Date:{" "}
          <strong>{formatDate(newInvoiceFromRoute.date)}</strong> | Amount:{" "}
          <strong>{formatCurrency(newInvoiceFromRoute.totalAmount)}</strong>
        </Alert>
      )}

      {/* Client & Invoice Selection */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "2px solid #e2e8f0",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#334155" }}>
          Select Invoice
        </Typography>

        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small" disabled={loading}>
              <InputLabel>Client</InputLabel>
              <Select
                value={selectedClient}
                label="Client"
                onChange={handleClientChange}
              >
                <MenuItem value="">-- Select Client --</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small" disabled={!selectedClient || loading}>
              <InputLabel>Invoice Date</InputLabel>
              <Select
                value={selectedInvoiceDate}
                label="Invoice Date"
                onChange={handleInvoiceDateChange}
              >
                <MenuItem value="">-- Select Date --</MenuItem>
                {selectedClient &&
                  clientInvoices[selectedClient]?.dates.map((date) => (
                    <MenuItem key={date} value={date}>
                      {formatDate(date)}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Tooltip title="Reload invoice data">
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  if (selectedClient && selectedInvoiceDate) {
                    fetchInvoiceDetails(selectedClient, selectedInvoiceDate);
                  }
                }}
                disabled={!selectedClient || !selectedInvoiceDate || loading}
              >
                Refresh
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoice Summary */}
      {selectedInvoiceData.length > 0 && (
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3} md={3}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Total Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatCurrency(totals.totalAmount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={3}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(56, 239, 125, 0.4)",
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Amount Paid
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatCurrency(totals.paidAmount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={3}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(240, 147, 251, 0.4)",
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Pending Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatCurrency(totals.pendingAmount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3} md={3}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(79, 172, 254, 0.4)",
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Collection %
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {totals.totalAmount > 0
                      ? `${((totals.paidAmount / totals.totalAmount) * 100).toFixed(1)}%`
                      : "0%"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Invoice Items Table */}
          <Paper
            sx={{
              borderRadius: 2,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              overflow: "hidden",
              mb: 3,
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Trip ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Paid</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Pending</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((item) => (
                    <TableRow key={item.trip_id || item.id} sx={{ "&:hover": { backgroundColor: "#f8fafc" } }}>
                      <TableCell sx={{ fontWeight: 600, color: "#1976d2" }}>
                        #{item.trip_id || item.id}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem" }}>
                        {item.from_place} → {item.to_place}
                      </TableCell>
                      <TableCell sx={{ textAlign: "right", fontWeight: 600 }}>
                        {formatCurrency(item.total_amount || item.amount)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "right", fontWeight: 600, color: "#22c55e" }}>
                        {formatCurrency(item.amount_paid)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "right", fontWeight: 600, color: "#f59e0b" }}>
                        {formatCurrency(item.pending_amount)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            item.pending_amount > 0 ? "Pending" : "Paid"
                          }
                          size="small"
                          color={item.pending_amount > 0 ? "error" : "success"}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.pending_amount > 0 && (
                          <Tooltip title="Add Payment">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePaymentClick(item)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {selectedInvoiceData.length > 0 && (
              <TablePagination
                component="div"
                count={selectedInvoiceData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
              />
            )}
          </Paper>
        </Box>
      )}

      {/* Empty State */}
      {!loading && selectedClient && selectedInvoiceDate && selectedInvoiceData.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            backgroundColor: "#f0fdf4",
            border: "2px dashed #d1fae5",
          }}
        >
          <Typography variant="h6" sx={{ color: "#047857", mb: 1 }}>
            No invoice data available
          </Typography>
          <Typography variant="body2" sx={{ color: "#10b981" }}>
            Please select a valid client and invoice date to view payment details.
          </Typography>
        </Paper>
      )}

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => !loading && setPaymentDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#1976d2" }}>Add Payment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {selectedPaymentItem && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f9ff", borderRadius: 1, border: "1px solid #e0e7ff" }}>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                <strong>Trip ID:</strong> #{selectedPaymentItem.trip_id || selectedPaymentItem.id}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                <strong>Route:</strong> {selectedPaymentItem.from_place} → {selectedPaymentItem.to_place}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5, color: "#f59e0b" }}>
                <strong>Total Amount:</strong> {formatCurrency(selectedPaymentItem.amount || selectedPaymentItem.total_amount)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5, color: "#22c55e" }}>
                <strong>Already Paid:</strong> {formatCurrency(selectedPaymentItem.amount_paid || 0)}
              </Typography>
              <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: 600 }}>
                <strong>Pending Amount:</strong> {formatCurrency(selectedPaymentItem.pending_amount)}
              </Typography>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Amount *"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                inputProps={{ step: "0.01", min: "0", max: selectedPaymentItem?.pending_amount || 0 }}
                placeholder="Enter payment amount"
                variant="outlined"
              />
              <Typography variant="caption" sx={{ color: "#666", mt: 0.5, display: "block" }}>
                {selectedPaymentItem ? `Max: ₹${(selectedPaymentItem.pending_amount || 0).toLocaleString("en-IN")}` : ""}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Mode *</InputLabel>
                <Select
                  value={paymentMode}
                  label="Payment Mode *"
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <MenuItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks (Optional)"
                multiline
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any notes about this payment"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setPaymentDialogOpen(false)}
            disabled={loading}
            sx={{ color: "#666" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePaymentSubmit}
            disabled={loading || !paymentAmount || !paymentMode}
            sx={{
              backgroundColor: loading ? "#ccc" : "#1976d2",
              "&:hover": { backgroundColor: "#1565c0" },
            }}
          >
            {loading ? "Processing Payment..." : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSuccess("")} severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SmartPaymentsPage;
