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

  // State for clients and invoices
  const [clients, setClients] = useState([]);
  const [clientInvoices, setClientInvoices] = useState({}); // Grouped by client
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState("");
  const [selectedInvoiceData, setSelectedInvoiceData] = useState([]);

  // State for payment
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
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

      // Fetch invoice data for specific client and date
      const res = await fetch(
        `http://localhost:5000/api/invoices/create-preview?clientId=${clientId}&date=${date}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch invoice details");
      }

      const data = await res.json();

      // Handle different response formats
      let details = [];
      if (Array.isArray(data)) {
        details = data;
      } else if (data.data && Array.isArray(data.data)) {
        details = data.data;
      } else if (data.trips && Array.isArray(data.trips)) {
        details = data.trips;
      }

      setSelectedInvoiceData(details);
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
    setPaymentMode("Cash");
    setPaymentNotes("");
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    const amount = Number(paymentAmount);
    const totalPending = Number(selectedPaymentItem?.pending_amount || 0);

    if (amount > totalPending) {
      setError(`Payment amount cannot exceed pending balance of ₹${totalPending.toLocaleString("en-IN")}`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Submit payment
      const res = await fetch("http://localhost:5000/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedPaymentItem.invoice_id,
          amount: amount,
          payment_mode: paymentMode,
          notes: paymentNotes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process payment");
      }

      setSuccess("Payment recorded successfully!");
      setPaymentDialogOpen(false);

      // Refresh invoice data
      if (selectedClient && selectedInvoiceDate) {
        fetchInvoiceDetails(selectedClient, selectedInvoiceDate);
      }

      // Add to transaction history
      const newTransaction = {
        id: Date.now(),
        invoiceId: selectedPaymentItem.invoice_id,
        amount: amount,
        mode: paymentMode,
        date: new Date().toLocaleDateString("en-IN"),
        notes: paymentNotes,
      };
      setTransactionHistory([newTransaction, ...transactionHistory]);
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
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedPaymentItem && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Trip:</strong> #{selectedPaymentItem.trip_id || selectedPaymentItem.id}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Pending Amount:</strong> {formatCurrency(selectedPaymentItem.pending_amount)}
              </Typography>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={paymentMode}
                  label="Payment Mode"
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Online">Online</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePaymentSubmit}
            disabled={loading || !paymentAmount}
          >
            {loading ? "Processing..." : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartPaymentsPage;
