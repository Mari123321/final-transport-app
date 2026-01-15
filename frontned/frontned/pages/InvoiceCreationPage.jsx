import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import axios from "axios";
import dayjs from "dayjs";

const InvoiceCreationPage = () => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  // Dropdown Data
  const [clients, setClients] = useState([]);
  const [tripDates, setTripDates] = useState([]); // Dates from trips

  // Form State
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Filtered Trips Data
  const [filteredTrips, setFilteredTrips] = useState([]);

  // Loading & Error States
  const [clientsLoading, setClientsLoading] = useState(false);
  const [datesLoading, setDatesLoading] = useState(false);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [error, setError] = useState("");

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  useEffect(() => {
    fetchClients();
  }, []);

  // Auto-fetch dates when client changes
  useEffect(() => {
    if (selectedClient) {
      fetchTripsForClient(selectedClient);
    } else {
      setTripDates([]);
      setSelectedDate("");
      setFilteredTrips([]);
    }
  }, [selectedClient]);

  // Auto-fetch trips for selected date
  useEffect(() => {
    if (selectedClient && selectedDate) {
      fetchTripsForDate(selectedClient, selectedDate);
    } else {
      setFilteredTrips([]);
    }
  }, [selectedDate]);

  // ============================================================
  // API CALLS
  // ============================================================

  /**
   * Fetch all clients for dropdown
   */
  const fetchClients = async () => {
    setClientsLoading(true);
    setError("");
    try {
      const response = await axios.get("http://localhost:5000/api/clients");
      const clientList = Array.isArray(response.data) ? response.data : [];
      setClients(clientList);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Failed to load clients. Please refresh the page.");
      toast.error("Failed to load clients");
    } finally {
      setClientsLoading(false);
    }
  };

  /**
   * Fetch DISTINCT trip dates for selected client
   * CRITICAL: Only dates that actually have trips are returned from backend
   * This is the SINGLE SOURCE OF TRUTH for date dropdown
   */
  const fetchTripsForClient = async (clientId) => {
    setDatesLoading(true);
    setError("");
    try {
      // Call dedicated dates endpoint - returns ONLY dates with actual trips
      const response = await axios.get(
        `http://localhost:5000/api/trips/dates?clientId=${clientId}`
      );

      // Response is a simple array of ISO dates: ["2026-01-05", "2026-01-08"]
      const datesList = Array.isArray(response.data) ? response.data : [];

      if (!datesList || datesList.length === 0) {
        setError("No trips found for this client");
        setTripDates([]);
        toast.warning("No trips found for this client");
        return;
      }

      // Format dates for dropdown display
      const formattedDates = datesList.map(dateStr => ({
        iso: dateStr,
        display: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      }));

      setTripDates(formattedDates);

      // Only auto-select date if EXACTLY one exists
      if (formattedDates.length === 1) {
        setSelectedDate(formattedDates[0].iso);
      }
    } catch (err) {
      console.error("Error fetching dates:", err);
      setError("Failed to load trip dates. Please try again.");
      toast.error("Failed to load trip dates");
      setTripDates([]);
    } finally {
      setDatesLoading(false);
    }
  };

  /**
   * Fetch trips for selected client and date
   * This should ALWAYS return trips since date came from /api/trips/dates
   */
  const fetchTripsForDate = async (clientId, date) => {
    setTripsLoading(true);
    setError("");
    try {
      // CRITICAL: Send ISO date (YYYY-MM-DD) to backend
      // Backend will use date range query to match timestamps properly
      console.log(`[DEBUG] Fetching trips:`);
      console.log(`  clientId: ${clientId}`);
      console.log(`  date: ${date}`);
      console.log(`  API endpoint: /api/trips/filter`);
      
      const response = await axios.get("http://localhost:5000/api/trips/filter", {
        params: {
          clientId: parseInt(clientId),
          date: date,  // Must be YYYY-MM-DD format
        },
      });

      const { trips = [] } = response.data;
      console.log(`  Response: ${trips.length} trips received`);

      if (!trips || trips.length === 0) {
        // This should NOT happen if date came from /api/trips/dates
        // But if it does, it indicates a backend data consistency issue
        console.warn(`WARNING: No trips found for clientId=${clientId}, date=${date}, even though date was in dropdown`);
        setFilteredTrips([]);
        // Don't show error - just let user see empty state
        return;
      }

      setFilteredTrips(trips);
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError("Failed to fetch trips. Please try again.");
      toast.error("Failed to fetch trips");
      setFilteredTrips([]);
    } finally {
      setTripsLoading(false);
    }
  };

  /**
   * Create invoice from selected trips
   */
  const createInvoice = async () => {
    if (!selectedClient || !selectedDate || !filteredTrips.length) {
      setError("Missing required data");
      toast.error("Please select client and date with trips");
      return;
    }

    setCreatingInvoice(true);
    setError("");

    try {
      const invoicePayload = {
        client_id: parseInt(selectedClient),
        date: selectedDate,
        trip_ids: filteredTrips.map((trip) => trip.trip_id),
      };

      const invoiceResponse = await axios.post(
        "http://localhost:5000/api/invoices",
        invoicePayload
      );

      if (!invoiceResponse.data?.invoice) {
        throw new Error("Invalid invoice response from server");
      }

      const invoice = invoiceResponse.data.invoice;
      const bill = invoiceResponse.data.bill;

      // Get client name
      const clientData = clients.find((c) => c.client_id === parseInt(selectedClient));
      const clientName = clientData?.client_name || "Unknown";

      // Prepare Smart Payment payload
      const smartPaymentPayload = {
        invoiceId: invoice.invoice_id,
        clientId: invoice.client_id,
        clientName: clientName,
        invoiceCreatedDate: dayjs().format("YYYY-MM-DD"),
        invoiceAmount: invoice.total_amount,
        invoiceStatus: "CREATED",
        sourceModule: "invoiceCreation",
      };

      // Send to Smart Payment module
      try {
        await axios.post(
          "http://localhost:5000/api/smart-payments/from-invoice",
          smartPaymentPayload
        );
      } catch (smartPaymentErr) {
        console.warn("Smart Payment sync warning:", smartPaymentErr);
      }

      const invoiceLabel = invoice.invoice_number || `#${invoice.invoice_id}`;
      const billLabel = bill?.bill_number || `#${bill?.bill_id}`;

      toast.success(
        `✅ Invoice ${invoiceLabel} and Bill ${billLabel} created successfully!`,
        { autoClose: 5000 }
      );

      // Reset form
      handleCancel();
    } catch (err) {
      console.error("Error creating invoice:", err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to create invoice";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreatingInvoice(false);
    }
  };

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  const handleCancel = () => {
    setSelectedClient("");
    setSelectedDate("");
    setFilteredTrips([]);
    setTripDates([]);
    setError("");
  };

  // ============================================================
  // RENDER HELPERS
  // ============================================================

  const getClientName = (clientId) => {
    return clients.find((c) => c.client_id === parseInt(clientId))?.client_name || "-";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(parseFloat(amount) || 0).toLocaleString("en-IN")}`;
  };

  // Calculate summary
  const totalAmount = filteredTrips.reduce((sum, trip) => sum + (Number(trip.amount) || 0), 0);
  const totalPaid = filteredTrips.reduce((sum, trip) => sum + (Number(trip.amount_paid) || 0), 0);
  const totalPending = totalAmount - totalPaid;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <ReceiptIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
          Create Invoice
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Form Section: Client → Date Selection */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <FilterListIcon sx={{ color: "#64748b" }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#334155" }}
          >
            Select Invoice Details
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Step 1: Client Selection */}
          <Grid item xs={12} sm={6} md={5}>
            <FormControl fullWidth size="small" disabled={clientsLoading}>
              <InputLabel>Select Client *</InputLabel>
              <Select
                value={selectedClient}
                label="Select Client *"
                onChange={(e) => {
                  setSelectedClient(e.target.value);
                  setSelectedDate("");
                  setFilteredTrips([]);
                }}
              >
                <MenuItem value="">
                  <em>{clientsLoading ? "Loading..." : "-- Choose Client --"}</em>
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedClient && (
              <Typography variant="caption" sx={{ color: "#10b981", mt: 0.5, display: "block" }}>
                ✓ Client selected
              </Typography>
            )}
          </Grid>

          {/* Step 2: Date Selection (Auto-populated from trips) */}
          <Grid item xs={12} sm={6} md={5}>
            <FormControl fullWidth size="small" disabled={!selectedClient || datesLoading}>
              <InputLabel>Select Invoice Date *</InputLabel>
              <Select
                value={selectedDate}
                label="Select Invoice Date *"
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                <MenuItem value="">
                  <em>
                    {!selectedClient
                      ? "-- Select client first --"
                      : datesLoading
                      ? "Loading dates..."
                      : tripDates.length === 0
                      ? "No dates available"
                      : "-- Choose Date --"}
                  </em>
                </MenuItem>
                {tripDates.map((date) => (
                  <MenuItem key={date.iso} value={date.iso}>
                    {date.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {datesLoading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <CircularProgress size={16} />
                <Typography variant="caption">Fetching dates...</Typography>
              </Box>
            )}
            {selectedDate && !datesLoading && (
              <Typography variant="caption" sx={{ color: "#10b981", mt: 0.5, display: "block" }}>
                ✓ Date selected
              </Typography>
            )}
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              disabled={creatingInvoice}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                if (!selectedClient || !selectedDate) {
                  setError("Please select client and date");
                  return;
                }
                if (filteredTrips.length === 0) {
                  setError("No trips available for the selected date");
                  return;
                }
                setConfirmDialog({
                  open: true,
                  title: "Confirm Invoice Creation",
                  message: `Create invoice for ${getClientName(selectedClient)} on ${formatDate(selectedDate)} with ${filteredTrips.length} trip(s) totaling ${formatCurrency(totalAmount)}?`,
                  onConfirm: createInvoice,
                });
              }}
              disabled={
                creatingInvoice ||
                !selectedClient ||
                !selectedDate ||
                tripsLoading ||
                filteredTrips.length === 0
              }
            >
              {creatingInvoice ? <CircularProgress size={24} color="inherit" /> : "Create Invoice"}
            </Button>
          </Grid>
        </Grid>

        {/* Helper Text */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: "#f0f9ff", borderRadius: 1, borderLeft: "4px solid #0ea5e9" }}>
          <Typography variant="body2" sx={{ color: "#0c4a6e" }}>
            💡 <strong>How it works:</strong> Select a client and the invoice date is auto-fetched from their trips. Select the date and trips for that date will be included in the invoice.
          </Typography>
        </Box>
      </Paper>

      {/* Summary Cards - Show if trips loaded */}
      {filteredTrips.length > 0 && !tripsLoading && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Trips
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {filteredTrips.length}
                    </Typography>
                  </Box>
                  <ReceiptIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(240, 147, 251, 0.4)",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Amount
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {formatCurrency(totalAmount)}
                    </Typography>
                  </Box>
                  <AccountBalanceIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(79, 172, 254, 0.4)",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Paid
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {formatCurrency(totalPaid)}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(250, 112, 154, 0.4)",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Pending
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {formatCurrency(totalPending)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Trips Table */}
      {filteredTrips.length > 0 && !tripsLoading && (
        <Paper
          sx={{
            borderRadius: 2,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
            mb: 3,
          }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155" }}>
              Trip Details ({filteredTrips.length} trips)
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Trip ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>From</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>To</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Driver</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }} align="right">
                    Qty (T)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }} align="right">
                    Rate
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }} align="right">
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow
                    key={trip.trip_id}
                    sx={{
                      "&:hover": { backgroundColor: "#f1f5f9" },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={`#${trip.trip_id}`}
                        size="small"
                        sx={{
                          backgroundColor: "#e0e7ff",
                          color: "#4338ca",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(trip.date)}</TableCell>
                    <TableCell>{trip.from_place || "-"}</TableCell>
                    <TableCell>{trip.to_place || "-"}</TableCell>
                    <TableCell>{trip.driver?.name || "-"}</TableCell>
                    <TableCell align="right">{trip.actual_quantity || 0}</TableCell>
                    <TableCell align="right">
                      ₹{Number(trip.rate_per_tonne || 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 600, color: "#059669" }}>
                        {formatCurrency(trip.amount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* No Trips Message */}
      {selectedDate && !tripsLoading && filteredTrips.length === 0 && (
        <Alert severity="warning">
          No trips found for {getClientName(selectedClient)} on {formatDate(selectedDate)}. Please select a different date.
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body1">{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              confirmDialog.onConfirm && confirmDialog.onConfirm();
              setConfirmDialog({ ...confirmDialog, open: false });
            }}
            variant="contained"
            color="success"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceCreationPage;
