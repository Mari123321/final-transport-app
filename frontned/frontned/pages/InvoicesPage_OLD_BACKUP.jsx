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
  IconButton,
  Tooltip,
  TablePagination,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  FilterList as FilterListIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

const InvoicesPage = () => {
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
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

    // Fetch all invoices on mount
    loadInvoices();
  }, []);

  // Load all invoices from backend
  const loadInvoices = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        const invoiceList = Array.isArray(data) ? data : data?.data || [];
        setInvoices(invoiceList);
        applyFilters(invoiceList, selectedClient, selectedStatus);
        calculateSummary(invoiceList);
      })
      .catch((err) => {
        console.error("Failed to fetch invoices:", err);
        setInvoices([]);
        setFilteredInvoices([]);
      })
      .finally(() => setLoading(false));
  };

  // Calculate summary statistics
  const calculateSummary = (invoiceList) => {
    const totalAmount = invoiceList.reduce(
      (sum, inv) => sum + (Number(inv.total_amount) || 0),
      0
    );
    const paidAmount = invoiceList.reduce(
      (sum, inv) => sum + (Number(inv.amount_paid) || 0),
      0
    );
    const pendingAmount = invoiceList.reduce(
      (sum, inv) => sum + (Number(inv.pending_amount) || 0),
      0
    );

    setSummary({
      totalInvoices: invoiceList.length,
      totalAmount,
      paidAmount,
      pendingAmount,
    });
  };

  // Apply filters
  const applyFilters = (invoiceList, clientId, status) => {
    let filtered = invoiceList;

    if (clientId) {
      filtered = filtered.filter(
        (inv) => inv.client_id === parseInt(clientId)
      );
    }

    if (status) {
      filtered = filtered.filter((inv) => inv.payment_status === status);
    }

    setFilteredInvoices(filtered);
    setPage(0);
  };

  // Handle filter changes
  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);
    applyFilters(invoices, clientId, selectedStatus);
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    setSelectedStatus(status);
    applyFilters(invoices, selectedClient, status);
  };

  const handleClearFilters = () => {
    setSelectedClient("");
    setSelectedStatus("");
    setFilteredInvoices(invoices);
    setPage(0);
  };

  // Get client name by ID
  const getClientName = (clientId) => {
    const client = clients.find((c) => c.client_id === clientId);
    return client?.client_name || "-";
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${(Number(amount) || 0).toLocaleString("en-IN")}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "pending":
      case "unpaid":
        return "error";
      default:
        return "default";
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated data
  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
            Invoices
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Manage and track all invoices
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton
            onClick={loadInvoices}
            disabled={loading}
            sx={{
              color: "#1976d2",
              "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.08)" },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary Cards - matching Payments Dashboard */}
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
                Total Invoices
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {summary.totalInvoices}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Total count
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
                Total Amount
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {formatCurrency(summary.totalAmount)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Invoice value
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
                Amount Paid
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {formatCurrency(summary.paidAmount)}
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
                Pending Amount
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {formatCurrency(summary.pendingAmount)}
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
                {summary.totalAmount > 0
                  ? `${((summary.paidAmount / summary.totalAmount) * 100).toFixed(1)}%`
                  : "0%"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Efficiency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Section - matching Payments Dashboard */}
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
            Filters
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Client</InputLabel>
              <Select
                value={selectedClient}
                label="Client"
                onChange={handleClientChange}
              >
                <MenuItem value="">All Clients</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={handleStatusChange}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Unpaid">Unpaid</MenuItem>
                <MenuItem value="Partial">Partial</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleClearFilters}
              sx={{
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Clear Filters
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={loadInvoices}
              disabled={loading}
              sx={{ textTransform: "none" }}
            >
              {loading ? <CircularProgress size={20} /> : "Refresh"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoice Table - matching Payments Dashboard layout */}
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
                <TableCell sx={{ fontWeight: 600 }}>Invoice Date</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Paid Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>Balance</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2, color: "#64748b" }}>
                      Loading invoices...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
                    <Typography variant="h6" sx={{ color: "#64748b" }}>
                      No invoices found
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      No matching invoices for the selected filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.invoice_id}
                    sx={{
                      "&:hover": { backgroundColor: "#f1f5f9" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {getClientName(invoice.client_id)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#1976d2" }}>
                      #{invoice.invoice_id || "-"}
                    </TableCell>
                    <TableCell>
                      {formatDate(invoice.date)}
                    </TableCell>
                    <TableCell sx={{ textAlign: "right", fontWeight: 600, color: "#059669" }}>
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell sx={{ textAlign: "right", fontWeight: 600, color: "#22c55e" }}>
                      {formatCurrency(invoice.amount_paid)}
                    </TableCell>
                    <TableCell sx={{ textAlign: "right", fontWeight: 600, color: "#f59e0b" }}>
                      {formatCurrency(invoice.pending_amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.payment_status || "Unpaid"}
                        size="small"
                        color={getStatusColor(invoice.payment_status)}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="info">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredInvoices.length > 0 && (
          <TablePagination
            component="div"
            count={filteredInvoices.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </Paper>
    </Box>
  );
};

export default InvoicesPage;
