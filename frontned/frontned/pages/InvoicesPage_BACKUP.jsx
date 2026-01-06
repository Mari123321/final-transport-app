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
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

const InvoicePage = () => {
  const [clients, setClients] = useState([]);
  const [dates, setDates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  // Fetch clients on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/clients")
      .then((res) => res.json())
      .then(setClients)
      .catch(console.error);
  }, []);

  // Fetch distinct trip dates for selected client
  useEffect(() => {
    if (!selectedClient) {
      setDates([]);
      setSelectedDate("");
      return;
    }
    fetch(`http://localhost:5000/api/invoices/trips/dates/${selectedClient}`)
      .then((res) => res.json())
      .then(setDates)
      .catch(console.error);
  }, [selectedClient]);

  // Generate invoice for selected client and date
  const handleGenerateInvoice = () => {
    if (!selectedClient || !selectedDate) {
      alert("Please select client and date");
      return;
    }
    fetch("http://localhost:5000/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: selectedClient, date: selectedDate }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "No invoice found");
          setInvoices([]);
          return;
        }
        const data = await res.json();
        setInvoices([data]);

        // Calculate summary
        const totalInvoices = 1;
        const totalAmount = Number(data.total_amount) || 0;
        const paidAmount = Number(data.amount_paid) || 0;
        const pendingAmount = Number(data.pending_amount) || 0;

        setSummary({ totalInvoices, totalAmount, paidAmount, pendingAmount });
      })
      .catch(() => {
        alert("Failed to fetch invoice");
        setInvoices([]);
      });
  };

  // Optional: Show all invoices, if endpoint is implemented in backend
  /*
  const handleShowAllInvoices = () => {
    fetch("http://localhost:5000/api/invoices")
      .then((res) => res.json())
      .then(setInvoices)
      .catch(() => alert("Failed to fetch invoices"));
  };
  */

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <DescriptionIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
          Invoice Management
        </Typography>
      </Box>

      {/* Summary Cards */}
      {invoices.length > 0 && (
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
                      ₹{summary.totalAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                      Invoice value
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
                      Amount Paid
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
                      Collection %
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {summary.totalAmount > 0
                        ? `${((summary.paidAmount / summary.totalAmount) * 100).toFixed(1)}%`
                        : "0%"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                      Payment rate
                    </Typography>
                  </Box>
                  <ReceiptIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filter Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <Typography variant="h6" sx={{ mb: 2, color: "#334155", fontWeight: 600 }}>
          Generate Invoice
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Client</InputLabel>
              <Select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                label="Client"
              >
                {clients.map((client) => (
                  <MenuItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Date</InputLabel>
              <Select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                label="Date"
              >
                {dates.length === 0 ? (
                  <MenuItem value="">
                    <em>No dates</em>
                  </MenuItem>
                ) : (
                  dates.map((date, idx) => (
                    <MenuItem key={idx} value={date}>
                      {new Date(date).toLocaleDateString()}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={handleGenerateInvoice}
              fullWidth
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                textTransform: "none",
                fontWeight: 600,
                py: 0.8,
              }}
            >
              Show Invoice
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoice Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ color: "#334155", fontWeight: 600 }}>
            Invoice Details
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Invoice ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Paid</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Pending</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Trips</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <DescriptionIcon sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
                      <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
                        No invoices found
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                        Select a client and date to generate invoice
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow
                    key={invoice.invoice_id || invoice.id}
                    sx={{ "&:hover": { backgroundColor: "#f8fafc" } }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                      {invoice.invoice_id || invoice.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#1e293b" }}>
                      {invoice.client?.client_name || invoice.client || "-"}
                    </TableCell>
                    <TableCell sx={{ color: "#475569" }}>
                      {invoice.date ? new Date(invoice.date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#059669" }}>
                      ₹{Number(invoice.total_amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#22c55e" }}>
                      ₹{Number(invoice.amount_paid || 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#f59e0b" }}>
                      ₹{Number(invoice.pending_amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {invoice.trips && invoice.trips.length > 0 ? (
                        <Chip
                          label={`${invoice.trips.length} trips`}
                          size="small"
                          sx={{
                            backgroundColor: "#e0e7ff",
                            color: "#3730a3",
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          No trips
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Trips Details (if available) */}
        {invoices.length > 0 && invoices[0].trips && invoices[0].trips.length > 0 && (
          <Box sx={{ p: 2, backgroundColor: "#f8fafc" }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: "#334155" }}>
              Trip Details
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#e2e8f0" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Trip ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Driver</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Vehicle</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>From</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>To</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Min Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Actual Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Rate/T</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices[0].trips.map((trip) => (
                    <TableRow key={trip.trip_id} sx={{ "&:hover": { backgroundColor: "#fff" } }}>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{trip.trip_id}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{trip.driver || '-'}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>
                        <Chip
                          label={trip.vehicle || '-'}
                          size="small"
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>
                        {trip.date ? new Date(trip.date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{trip.from_place}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{trip.to_place}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{trip.minimum_quantity}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{trip.actual_quantity}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>₹{trip.rate_per_tonne}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#059669" }}>
                        ₹{Number(trip.amount || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default InvoicePage;
