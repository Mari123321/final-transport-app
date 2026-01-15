import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Alert,
  Card,
  CardContent,
  Chip,
  TablePagination,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Create as CreateIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

const InvoicesPage = () => {
  const navigate = useNavigate();

  // State for client and date selection
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("");
  
  // State for trip dates
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  
  // State for invoice data
  const [invoiceData, setInvoiceData] = useState([]);
  const [filteredApplied, setFilteredApplied] = useState(false);
  
  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch available dates when client changes
  useEffect(() => {
    if (selectedClient) {
      fetchTripsAndDates(selectedClient);
    } else {
      setAvailableDates([]);
      setSelectedDate("");
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:5000/api/clients");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      setError("Failed to load clients. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTripsAndDates = async (clientId) => {
    try {
      setLoading(true);
      setError("");
      setAvailableDates([]);
      setSelectedDate("");
      setInvoiceData([]);
      setFilteredApplied(false);

      const res = await fetch(`http://localhost:5000/api/trips/by-client/${clientId}`);
      const data = await res.json();

      if (data.dates && Array.isArray(data.dates)) {
        setAvailableDates(data.dates);
      }

      if (!data.dates || data.dates.length === 0) {
        setError(`No trips found for this client. Please create trips first.`);
      }
    } catch (err) {
      console.error("Failed to fetch trips:", err);
      setError("Failed to load trip dates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);

    // Find and set client name
    const client = clients.find((c) => c.client_id === parseInt(clientId));
    setSelectedClientName(client?.client_name || "");
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setInvoiceData([]);
    setFilteredApplied(false);
  };

  const handleApplyFilters = async () => {
    if (!selectedClient || !selectedDate) {
      setError("Please select both client and date");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInvoiceData([]);

      // Fetch invoice data based on client and date
      // This endpoint should return invoice details (trips, amounts, etc.)
      const res = await fetch(
        `http://localhost:5000/api/invoices/create-preview?clientId=${selectedClient}&date=${selectedDate}`
      );

      if (!res.ok) {
        if (res.status === 404) {
          setError("No invoice data found for this client and date");
          setInvoiceData([]);
          setFilteredApplied(true);
          return;
        }
        throw new Error("Failed to fetch invoice data");
      }

      const data = await res.json();
      
      // Handle different response formats
      let invoiceDetails = [];
      if (Array.isArray(data)) {
        invoiceDetails = data;
      } else if (data.data && Array.isArray(data.data)) {
        invoiceDetails = data.data;
      } else if (data.trips && Array.isArray(data.trips)) {
        invoiceDetails = data.trips;
      }

      setInvoiceData(invoiceDetails);
      setFilteredApplied(true);
      setPage(0);

      if (invoiceDetails.length === 0) {
        setError("No trips found for this client on the selected date");
      }
    } catch (err) {
      console.error("Failed to apply filters:", err);
      setError("Failed to load invoice data. Please try again.");
      setInvoiceData([]);
      setFilteredApplied(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (invoiceData.length === 0) {
      setError("No invoice data available. Please apply filters first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Collect trip IDs from invoice data
      const tripIds = invoiceData.map((item) => item.trip_id || item.id).filter(Boolean);

      if (tripIds.length === 0) {
        setError("No valid trips found in invoice data");
        return;
      }

      // Create invoice via backend
      const res = await fetch("http://localhost:5000/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: parseInt(selectedClient),
          date: selectedDate,
          trip_ids: tripIds,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create invoice");
      }

      const invoiceResult = await res.json();

      // Calculate summary
      const summary = {
        invoiceId: invoiceResult.invoice_id || invoiceResult.id,
        clientId: selectedClient,
        clientName: selectedClientName,
        date: selectedDate,
        totalAmount: invoiceResult.total_amount || 0,
        amountPaid: invoiceResult.amount_paid || 0,
        pendingAmount: invoiceResult.pending_amount || 0,
        tripsCount: tripIds.length,
      };

      // Navigate to Smart Payments with invoice data
      navigate("/smart-payments", {
        state: {
          newInvoice: summary,
          autoSelectInvoice: invoiceResult.invoice_id || invoiceResult.id,
        },
      });
    } catch (err) {
      console.error("Failed to create invoice:", err);
      setError(err.message || "Failed to create invoice. Please try again.");
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

  // Calculate pagination
  const paginatedData = invoiceData.slice(
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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
          Create Invoice
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Select a client and date to create a new invoice from trips
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity={filteredApplied && invoiceData.length === 0 ? "info" : "error"}
          onClose={() => setError("")}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Selection Section */}
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
          Step 1: Select Client & Date
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
              <InputLabel>Trip Date</InputLabel>
              <Select
                value={selectedDate}
                label="Trip Date"
                onChange={handleDateChange}
              >
                <MenuItem value="">-- Select Date --</MenuItem>
                {availableDates.map((dateObj) => (
                  <MenuItem key={dateObj.iso} value={dateObj.iso}>
                    {dateObj.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleApplyFilters}
              disabled={!selectedClient || !selectedDate || loading}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                textTransform: "none",
                fontWeight: 600,
                py: 1.2,
              }}
            >
              {loading ? <CircularProgress size={20} /> : "Apply Filters"}
            </Button>
          </Grid>
        </Grid>

        {selectedClient && availableDates.length === 0 && !loading && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "#fef3c7",
              borderLeft: "4px solid #f59e0b",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <WarningIcon sx={{ color: "#f59e0b" }} />
            <Typography variant="body2" sx={{ color: "#92400e" }}>
              No trips found for this client. Please create trips first.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Invoice Data Section */}
      {filteredApplied && (
        <Box>
          {/* Step 2 Info */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#334155" }}>
            Step 2: Review Trip Data
          </Typography>

          {invoiceData.length > 0 ? (
            <Paper
              sx={{
                borderRadius: 2,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                overflow: "hidden",
                mb: 3,
              }}
            >
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ p: 2, backgroundColor: "#f8fafc" }}>
                <Grid item xs={6} sm={3} md={3}>
                  <Card
                    sx={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                    }}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Total Trips
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {invoiceData.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <Card
                    sx={{
                      background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                      color: "white",
                    }}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Total Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatCurrency(
                          invoiceData.reduce((sum, trip) => sum + (Number(trip.amount) || 0), 0)
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <Card
                    sx={{
                      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      color: "white",
                    }}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Qty (Actual)
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {invoiceData.reduce((sum, trip) => sum + (Number(trip.actual_quantity) || 0), 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <Card
                    sx={{
                      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                      color: "white",
                    }}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        Date
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                        {formatDate(selectedDate)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Data Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f1f5f9" }}>
                      <TableCell sx={{ fontWeight: 600 }}>Trip ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Min Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Actual Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Rate/T</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((trip) => (
                      <TableRow key={trip.trip_id || trip.id} sx={{ "&:hover": { backgroundColor: "#f8fafc" } }}>
                        <TableCell sx={{ fontWeight: 600, color: "#1976d2" }}>
                          #{trip.trip_id || trip.id}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.9rem" }}>
                          {trip.from_place} → {trip.to_place}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={trip.vehicle_number || trip.vehicle?.vehicle_number || "-"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.9rem" }}>
                          {trip.driver?.name || trip.driver || "-"}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right", fontSize: "0.9rem" }}>
                          {trip.minimum_quantity || "-"}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right", fontWeight: 600, color: "#059669" }}>
                          {trip.actual_quantity}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right", fontSize: "0.9rem" }}>
                          {formatCurrency(trip.rate_per_tonne)}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right", fontWeight: 600, color: "#059669" }}>
                          {formatCurrency(trip.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                component="div"
                count={invoiceData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
              />

              {/* Create Invoice Button */}
              <Box sx={{ p: 2, backgroundColor: "#f8fafc", display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<CreateIcon />}
                  onClick={handleCreateInvoice}
                  disabled={loading}
                  sx={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    textTransform: "none",
                    fontWeight: 600,
                    px: 4,
                  }}
                >
                  {loading ? "Creating..." : "Create Invoice"}
                </Button>
                <Tooltip title="After creating invoice, you'll be taken to Smart Payments for payment tracking">
                  <IconButton size="small" color="info">
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          ) : (
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 2,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                backgroundColor: "#f0fdf4",
                border: "2px dashed #d1fae5",
              }}
            >
              <Typography variant="h6" sx={{ color: "#047857", mb: 1 }}>
                No trip data available
              </Typography>
              <Typography variant="body2" sx={{ color: "#10b981" }}>
                The selected date has no trips. Please select a different client or date.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default InvoicesPage;
