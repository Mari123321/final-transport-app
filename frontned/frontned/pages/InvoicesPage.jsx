import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  TableContainer,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import axios from "axios";

const InvoicePage = () => {
  const [clients, setClients] = useState([]);
  const [trips, setTrips] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [error, setError] = useState("");
  
  const [filters, setFilters] = useState({
    clientId: "",
    date: ""
  });

  const [summary, setSummary] = useState({
    totalTrips: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch available dates when client changes
  useEffect(() => {
    if (filters.clientId) {
      fetchAvailableDates(filters.clientId);
    } else {
      setAvailableDates([]);
      setFilters(prev => ({ ...prev, date: "" }));
    }
  }, [filters.clientId]);

  const fetchClients = async () => {
    setLoadingClients(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:5000/api/clients");
      setClients(res.data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Failed to fetch clients");
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchAvailableDates = async (clientId) => {
    setLoadingDates(true);
    setError("");
    try {
      const res = await axios.get(`http://localhost:5000/api/trips/by-client/${clientId}`);
      const { dates } = res.data || {};
      
      if (dates && dates.length > 0) {
        setAvailableDates(dates);
      } else {
        setAvailableDates([]);
      }
    } catch (err) {
      console.error("Error fetching available dates:", err);
      setError("Failed to fetch available dates");
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  const handleApplyFilters = async () => {
    if (!filters.clientId) {
      setError("Please select a client");
      return;
    }

    setLoadingTrips(true);
    setError("");
    
    try {
      const params = { clientId: filters.clientId };
      if (filters.date) {
        params.date = filters.date;
      }

      const res = await axios.get("http://localhost:5000/api/trips/filter", { params });
      const { trips: fetchedTrips, summary: fetchedSummary } = res.data || {};
      
      setTrips(fetchedTrips || []);
      
      // Update summary
      if (fetchedSummary) {
        setSummary({
          totalTrips: fetchedTrips?.length || 0,
          totalAmount: fetchedSummary.totalAmount || 0,
          paidAmount: fetchedSummary.totalPaid || 0,
          pendingAmount: fetchedSummary.totalPending || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError("Failed to fetch trips");
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({ clientId: "", date: "" });
    setTrips([]);
    setAvailableDates([]);
    setSummary({
      totalTrips: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    });
    setError("");
  };

  const handleClientChange = (clientId) => {
    setFilters({ clientId, date: "" });
    setTrips([]);
    setSummary({
      totalTrips: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    });
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <ReceiptIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
          Smart Invoice Filtering
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <FilterListIcon sx={{ color: "#64748b" }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155" }}>
            Filters
          </Typography>
        </Box>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small" disabled={loadingClients}>
              <InputLabel>Select Client</InputLabel>
              <Select
                value={filters.clientId}
                label="Select Client"
                onChange={(e) => handleClientChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>{loadingClients ? "Loading clients..." : "Select a client"}</em>
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl 
              fullWidth 
              size="small" 
              disabled={!filters.clientId || loadingDates}
            >
              <InputLabel>Select Date</InputLabel>
              <Select
                value={filters.date}
                label="Select Date"
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              >
                <MenuItem value="">
                  <em>
                    {!filters.clientId
                      ? "Select client first"
                      : loadingDates
                        ? "Loading dates..."
                        : availableDates.length === 0
                          ? "No dates available"
                          : "All dates"}
                  </em>
                </MenuItem>
                {availableDates.map((dateObj) => (
                  <MenuItem key={dateObj.iso} value={dateObj.iso}>
                    {dateObj.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleApplyFilters}
              disabled={!filters.clientId || loadingTrips}
              sx={{ 
                height: "40px", 
                textTransform: "none", 
                fontWeight: 600,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }}
            >
              {loadingTrips ? <CircularProgress size={24} color="inherit" /> : "Apply Filters"}
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              disabled={loadingTrips}
              sx={{ height: "40px", textTransform: "none" }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>

        {/* Filter Status Message */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {!filters.clientId && "👉 Select a client to see available dates"}
            {filters.clientId && !filters.date && "👉 Select a date or click Apply Filters to see all trips"}
            {filters.clientId && filters.date && "👉 Click Apply Filters to load trips"}
          </Typography>
        </Box>
      </Paper>

      {/* Summary Cards */}
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Trips
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {summary.totalTrips}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Matching filters
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Amount
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ₹{summary.totalAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Revenue
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Paid Amount
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ₹{summary.paidAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Collected
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Pending
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ₹{summary.pendingAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Outstanding
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trips Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <Box sx={{ p: 2, backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155" }}>
            Trip Details {trips.length > 0 && `(${trips.length} trips)`}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Trip ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Dispatch Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Route</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Payment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingTrips ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: "#64748b" }}>
                    {!filters.clientId 
                      ? "👆 Select a client and click Apply Filters to see trips" 
                      : "No trips found for selected filters"}
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => (
                  <TableRow
                    key={trip.trip_id}
                    sx={{
                      "&:hover": { backgroundColor: "#f1f5f9" },
                      transition: "all 0.2s ease"
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={`#${trip.trip_id}`}
                        size="small"
                        sx={{
                          backgroundColor: "#e0e7ff",
                          color: "#4338ca",
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {trip.date ? new Date(trip.date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {trip.dispatch_date ? new Date(trip.dispatch_date).toLocaleDateString() : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{trip.client?.client_name || "-"}</TableCell>
                    <TableCell>{trip.vehicle?.vehicle_number || "-"}</TableCell>
                    <TableCell>{trip.driver?.name || "-"}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trip.from_place} → {trip.to_place}
                      </Typography>
                    </TableCell>
                    <TableCell>{trip.actual_quantity || 0} T</TableCell>
                    <TableCell>₹{Number(trip.rate_per_tonne || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: "#059669" }}>
                        ₹{Number(trip.amount || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trip.payment_mode || "N/A"}
                        size="small"
                        color={
                          trip.payment_mode === "Cash" ? "success" :
                          trip.payment_mode === "UPI" ? "primary" :
                          "default"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default InvoicePage;
