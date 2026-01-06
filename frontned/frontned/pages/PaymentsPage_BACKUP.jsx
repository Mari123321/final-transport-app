import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Snackbar,
  Alert,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  TableContainer,
  Chip,
  TextField,
} from "@mui/material";
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import AppDatePicker from "../components/common/AppDatePicker";

const PaymentsPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [payments, setPayments] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });
  const [summary, setSummary] = useState({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    count: 0,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchPayments(selectedClient);
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/clients");
      setClients(res.data);
    } catch (e) {
      console.error("Failed to fetch clients", e);
    }
  };

  const fetchPayments = async (clientId) => {
    try {
      const url = clientId
        ? `http://localhost:5000/api/payments?clientId=${clientId}`
        : "http://localhost:5000/api/payments";
      const res = await axios.get(url);
      setPayments(res.data);

      // Calculate summary
      const totalAmt = res.data.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
      const paidAmt = res.data.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
      const pendingAmt = res.data.reduce((sum, p) => sum + (Number(p.balanceAmount) || 0), 0);

      setSummary({
        totalAmount: totalAmt,
        paidAmount: paidAmt,
        pendingAmount: pendingAmt,
        count: res.data.length,
      });

      // Show notification if any payments have pending balance
      const anyPending = res.data.some((p) => p.paidAmount < p.totalAmount);
      if (anyPending) {
        setNotification({
          open: true,
          message: "Some payments have pending balance.",
          severity: "warning",
        });
      } else if (res.data.length > 0) {
        setNotification({
          open: true,
          message: "All payments fully cleared!",
          severity: "success",
        });
      }
    } catch (e) {
      console.error("Failed to fetch payments", e);
      setNotification({
        open: true,
        message: "Failed to fetch payments",
        severity: "error",
      });
    }
  };

  const handleClientChange = (e) => {
    setSelectedClient(e.target.value);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return "—";
    return Number(val).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const handleApplyFilters = () => {
    fetchPayments(selectedClient);
  };

  const handleClearFilters = () => {
    setSelectedClient("");
    setFilters({ startDate: "", endDate: "" });
    fetchPayments("");
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <PaymentIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
          Payments Management
        </Typography>
      </Box>

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
                    Total Amount
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(summary.totalAmount)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    {summary.count} records
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
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(240, 147, 251, 0.4)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Paid Amount
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(summary.paidAmount)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Collected
                  </Typography>
                </Box>
                <CheckCircleOutlineIcon sx={{ fontSize: 48, opacity: 0.3 }} />
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
                    Pending Amount
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(summary.pendingAmount)}
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
                    Collection Rate
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {summary.totalAmount > 0 
                      ? `${((summary.paidAmount / summary.totalAmount) * 100).toFixed(1)}%`
                      : "0%"}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Payment efficiency
                  </Typography>
                </Box>
                <PaymentIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ color: "#64748b" }} />
          <Typography variant="h6" sx={{ color: "#334155", fontWeight: 600 }}>
            Filters
          </Typography>
        </Box>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Client</InputLabel>
              <Select
                value={selectedClient}
                label="Filter by Client"
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <MenuItem value="">All Clients</MenuItem>
                {clients.map((c) => (
                  <MenuItem key={c.clientId} value={c.clientId}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppDatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppDatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                fullWidth
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Apply Filter
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
                sx={{ textTransform: "none" }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Payments Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ color: "#334155", fontWeight: 600 }}>
            Payment Records
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Paid Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Balance</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <PaymentIcon sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
                      <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
                        No payments found
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                        Click "Add Diesel Expense" to create one.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map(
                  ({
                    paymentId,
                    clientName,
                    totalAmount,
                    paidAmount,
                    balanceAmount,
                  }) => {
                    const isPending = paidAmount < totalAmount;
                    return (
                      <TableRow
                        key={paymentId}
                        sx={{
                          "&:hover": { backgroundColor: "#f8fafc" },
                          transition: "background-color 0.2s",
                        }}
                      >
                        <TableCell>
                          <Typography sx={{ fontWeight: 500, color: "#1e293b" }}>
                            {clientName}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: "#475569" }}>
                          {formatCurrency(totalAmount)}
                        </TableCell>
                        <TableCell sx={{ color: "#22c55e", fontWeight: 600 }}>
                          {formatCurrency(paidAmount)}
                        </TableCell>
                        <TableCell sx={{ color: isPending ? "#f59e0b" : "#64748b", fontWeight: 600 }}>
                          {formatCurrency(balanceAmount)}
                        </TableCell>
                        <TableCell>
                          {isPending ? (
                            <Chip
                              label="Pending"
                              size="small"
                              sx={{
                                backgroundColor: "#fef3c7",
                                color: "#b45309",
                                fontWeight: 600,
                              }}
                            />
                          ) : (
                            <Chip
                              label="Completed"
                              size="small"
                              icon={<CheckCircleOutlineIcon />}
                              sx={{
                                backgroundColor: "#d1fae5",
                                color: "#065f46",
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentsPage;
