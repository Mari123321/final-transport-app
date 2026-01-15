import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Divider,
  Skeleton,
} from "@mui/material";
import {
  People as PeopleIcon,
  DirectionsCar as DirectionsCarIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PieChart as PieChartIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { toast } from "react-toastify";

// ============================================================
// CONSTANTS
// ============================================================

const API_BASE = "http://localhost:5000/api";
const COLORS = {
  primary: "#1976d2",
  secondary: "#f57c00",
  success: "#388e3c",
  warning: "#ff9800",
  danger: "#d32f2f",
  neutral: "#757575",
  background: "#f5f7fa",
  border: "#e0e0e0",
};

const STATUS_COLORS = {
  PAID: COLORS.success,
  PARTIAL: COLORS.warning,
  UNPAID: COLORS.danger,
  Completed: COLORS.success,
  Running: COLORS.warning,
  Pending: COLORS.neutral,
};

// ============================================================
// METRIC CARD COMPONENT
// ============================================================

const MetricCard = ({ title, value, icon: Icon, loading, error, subtitle, color = COLORS.primary }) => {
  return (
    <Card sx={{ height: "100%", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography color="textSecondary" sx={{ fontSize: "0.875rem", mb: 0.5 }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width="80px" height="32px" sx={{ mt: 1 }} />
            ) : error ? (
              <Typography sx={{ color: COLORS.danger, fontSize: "0.875rem" }}>Error</Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: "1.75rem", fontWeight: 700, color }}>
                  {typeof value === "number" ? value.toLocaleString() : value}
                </Typography>
                {subtitle && (
                  <Typography sx={{ fontSize: "0.75rem", color: "textSecondary", mt: 0.5 }}>
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              backgroundColor: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ color, fontSize: "1.5rem" }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ============================================================
// EMPTY STATE COMPONENT
// ============================================================

const EmptyState = ({ message = "No data available", icon: Icon = MoreVertIcon }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 6,
      color: "textSecondary",
    }}
  >
    <Icon sx={{ fontSize: "3rem", mb: 2, opacity: 0.3 }} />
    <Typography>{message}</Typography>
  </Box>
);

// ============================================================
// RECENT ACTIVITY TABLE COMPONENT
// ============================================================

const RecentActivityTable = ({ title, data, loading, columns, icon: Icon, onRowClick }) => {
  return (
    <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {Icon && <Icon sx={{ color: COLORS.primary }} />}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ py: 3 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={50} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : !data || data.length === 0 ? (
          <EmptyState message={`No ${title.toLowerCase()} available`} />
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f7fa" }}>
                  {columns.map((col) => (
                    <TableCell key={col.id} sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow
                    key={idx}
                    sx={{
                      cursor: onRowClick ? "pointer" : "default",
                      "&:hover": onRowClick ? { backgroundColor: "#f5f7fa" } : {},
                    }}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.id} sx={{ fontSize: "0.875rem" }}>
                        {col.render ? col.render(row) : row[col.id] || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================

const DashboardNew = () => {
  // ============================================================
  // STATE
  // ============================================================

  const [metrics, setMetrics] = useState({
    totalClients: 0,
    totalVehicles: 0,
    totalTrips: 0,
    totalInvoices: 0,
    totalBills: 0,
    totalRevenue: 0,
    totalPending: 0,
    totalPaid: 0,
  });

  const [loading, setLoading] = useState({
    metrics: true,
    trips: true,
    invoices: true,
    bills: true,
    analytics: true,
  });

  const [errors, setErrors] = useState({});

  const [recentTrips, setRecentTrips] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentBills, setRecentBills] = useState([]);

  const [analyticsData, setAnalyticsData] = useState({
    invoiceStatus: [],
    tripsPerClient: [],
    revenue: [],
  });

  const [filters, setFilters] = useState({
    clientId: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  const [clients, setClients] = useState([]);

  // ============================================================
  // API CALLS
  // ============================================================

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, metrics: true }));
      setErrors((prev) => ({ ...prev, metrics: null }));

      const [clientsRes, vehiclesRes, tripsRes, invoicesRes, billsRes] = await Promise.all([
        axios.get(`${API_BASE}/clients`),
        axios.get(`${API_BASE}/vehicles`),
        axios.get(`${API_BASE}/trips`),
        axios.get(`${API_BASE}/invoices`),
        axios.get(`${API_BASE}/bills`),
      ]);

      const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      const bills = billsRes.data?.bills || [];

      const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
      const totalPaid = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount_paid) || 0), 0);
      const totalPending = totalRevenue - totalPaid;

      setMetrics({
        totalClients: Array.isArray(clientsRes.data) ? clientsRes.data.length : 0,
        totalVehicles: Array.isArray(vehiclesRes.data) ? vehiclesRes.data.length : 0,
        totalTrips: Array.isArray(tripsRes.data) ? tripsRes.data.trips?.length || 0 : 0,
        totalInvoices: invoices.length,
        totalBills: bills.length,
        totalRevenue: Math.round(totalRevenue),
        totalPending: Math.round(totalPending),
        totalPaid: Math.round(totalPaid),
      });
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setErrors((prev) => ({ ...prev, metrics: "Failed to load metrics" }));
    } finally {
      setLoading((prev) => ({ ...prev, metrics: false }));
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/clients`);
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  }, []);

  const fetchRecentTrips = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, trips: true }));
      const res = await axios.get(`${API_BASE}/trips`);
      const trips = res.data?.trips || [];
      setRecentTrips(trips.slice(0, 5));
    } catch (err) {
      console.error("Error fetching trips:", err);
      setErrors((prev) => ({ ...prev, trips: "Failed to load trips" }));
    } finally {
      setLoading((prev) => ({ ...prev, trips: false }));
    }
  }, []);

  const fetchRecentInvoices = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, invoices: true }));
      const res = await axios.get(`${API_BASE}/invoices`);
      const invoices = Array.isArray(res.data) ? res.data : [];
      setRecentInvoices(invoices.slice(0, 5));
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setErrors((prev) => ({ ...prev, invoices: "Failed to load invoices" }));
    } finally {
      setLoading((prev) => ({ ...prev, invoices: false }));
    }
  }, []);

  const fetchRecentBills = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, bills: true }));
      const res = await axios.get(`${API_BASE}/bills`);
      const bills = res.data?.bills || [];
      setRecentBills(bills.slice(0, 5));
    } catch (err) {
      console.error("Error fetching bills:", err);
      setErrors((prev) => ({ ...prev, bills: "Failed to load bills" }));
    } finally {
      setLoading((prev) => ({ ...prev, bills: false }));
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, analytics: true }));

      const invoicesRes = await axios.get(`${API_BASE}/invoices`);
      const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];

      // Invoice status breakdown
      const statusCounts = {
        "Paid": 0,
        "Partial": 0,
        "Unpaid": 0,
      };

      invoices.forEach((inv) => {
        const status = inv.payment_status?.toLowerCase() || "unpaid";
        if (status.includes("paid") && inv.amount_paid === inv.total_amount) {
          statusCounts["Paid"]++;
        } else if (status.includes("paid") && inv.amount_paid > 0) {
          statusCounts["Partial"]++;
        } else {
          statusCounts["Unpaid"]++;
        }
      });

      const invoiceStatus = Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([name, value]) => ({ name, value }));

      // Trips per client
      const tripsRes = await axios.get(`${API_BASE}/trips`);
      const trips = tripsRes.data?.trips || [];
      const tripsByClient = {};

      trips.forEach((trip) => {
        const clientName = trip.client?.client_name || "Unknown";
        tripsByClient[clientName] = (tripsByClient[clientName] || 0) + 1;
      });

      const tripsPerClient = Object.entries(tripsByClient)
        .slice(0, 6)
        .map(([name, value]) => ({ name, trips: value }));

      setAnalyticsData({
        invoiceStatus: invoiceStatus.length > 0 ? invoiceStatus : [],
        tripsPerClient: tripsPerClient.length > 0 ? tripsPerClient : [],
        revenue: [], // Can be expanded for revenue trends
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setErrors((prev) => ({ ...prev, analytics: "Failed to load analytics" }));
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  }, []);

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    fetchMetrics();
    fetchClients();
    fetchRecentTrips();
    fetchRecentInvoices();
    fetchRecentBills();
    fetchAnalytics();
  }, [fetchMetrics, fetchClients, fetchRecentTrips, fetchRecentInvoices, fetchRecentBills, fetchAnalytics]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box sx={{ backgroundColor: COLORS.background, minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        {/* PAGE HEADER */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography color="textSecondary">
            Welcome back! Here's an overview of your transport operations.
          </Typography>
        </Box>

        {/* FILTERS SECTION */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Client</InputLabel>
                <Select
                  value={filters.clientId}
                  label="Client"
                  onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
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
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() =>
                  setFilters({
                    clientId: "",
                    startDate: "",
                    endDate: "",
                    status: "",
                  })
                }
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* METRICS GRID */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Clients"
              value={metrics.totalClients}
              icon={PeopleIcon}
              loading={loading.metrics}
              color={COLORS.primary}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Vehicles"
              value={metrics.totalVehicles}
              icon={DirectionsCarIcon}
              loading={loading.metrics}
              color={COLORS.secondary}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Trips"
              value={metrics.totalTrips}
              icon={TrendingUpIcon}
              loading={loading.metrics}
              color={COLORS.warning}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Invoices"
              value={metrics.totalInvoices}
              icon={ReceiptIcon}
              loading={loading.metrics}
              color={COLORS.success}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Bills"
              value={metrics.totalBills}
              icon={AttachMoneyIcon}
              loading={loading.metrics}
              color={COLORS.primary}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Revenue"
              value={`₹${metrics.totalRevenue.toLocaleString()}`}
              icon={AttachMoneyIcon}
              loading={loading.metrics}
              color={COLORS.success}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Paid Amount"
              value={`₹${metrics.totalPaid.toLocaleString()}`}
              icon={CheckCircleIcon}
              loading={loading.metrics}
              color={COLORS.success}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Pending Amount"
              value={`₹${metrics.totalPending.toLocaleString()}`}
              icon={ScheduleIcon}
              loading={loading.metrics}
              color={COLORS.warning}
            />
          </Grid>
        </Grid>

        {/* ANALYTICS SECTION */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Analytics
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* INVOICE STATUS PIE CHART */}
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <PieChartIcon sx={{ color: COLORS.primary }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Invoice Status
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {loading.analytics ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : analyticsData.invoiceStatus.length === 0 ? (
                  <EmptyState message="No invoice data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.invoiceStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} (${value})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill={COLORS.success} />
                        <Cell fill={COLORS.warning} />
                        <Cell fill={COLORS.danger} />
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* TRIPS PER CLIENT BAR CHART */}
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendingUpIcon sx={{ color: COLORS.primary }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Trips by Client
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {loading.analytics ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : analyticsData.tripsPerClient.length === 0 ? (
                  <EmptyState message="No trip data available" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.tripsPerClient}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} tick={{ fontSize: 12 }} />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="trips" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* RECENT ACTIVITY SECTION */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Recent Activity
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <RecentActivityTable
              title="Recent Trips"
              data={recentTrips}
              loading={loading.trips}
              icon={TrendingUpIcon}
              columns={[
                { id: "trip_id", label: "Trip ID" },
                {
                  id: "client_name",
                  label: "Client",
                  render: (row) => row.client?.client_name || "-",
                },
                {
                  id: "date",
                  label: "Date",
                  render: (row) => {
                    try {
                      return new Date(row.date).toLocaleDateString("en-IN");
                    } catch {
                      return "-";
                    }
                  },
                },
                {
                  id: "amount",
                  label: "Amount",
                  render: (row) => `₹${(row.amount || 0).toLocaleString()}`,
                },
                {
                  id: "status",
                  label: "Status",
                  render: (row) => (
                    <Chip
                      label={row.status || "Pending"}
                      size="small"
                      sx={{
                        backgroundColor: STATUS_COLORS[row.status] || COLORS.neutral,
                        color: "white",
                      }}
                    />
                  ),
                },
              ]}
            />
          </Grid>

          <Grid item xs={12}>
            <RecentActivityTable
              title="Recent Invoices"
              data={recentInvoices}
              loading={loading.invoices}
              icon={ReceiptIcon}
              columns={[
                { id: "invoice_number", label: "Invoice #" },
                {
                  id: "client_name",
                  label: "Client",
                  render: (row) => row.client_name || "-",
                },
                {
                  id: "date",
                  label: "Date",
                  render: (row) => {
                    try {
                      return new Date(row.date).toLocaleDateString("en-IN");
                    } catch {
                      return "-";
                    }
                  },
                },
                {
                  id: "total_amount",
                  label: "Total",
                  render: (row) => `₹${(row.total_amount || 0).toLocaleString()}`,
                },
                {
                  id: "payment_status",
                  label: "Status",
                  render: (row) => (
                    <Chip
                      label={row.payment_status || "Unpaid"}
                      size="small"
                      sx={{
                        backgroundColor: STATUS_COLORS[row.payment_status] || COLORS.neutral,
                        color: "white",
                      }}
                    />
                  ),
                },
              ]}
            />
          </Grid>

          <Grid item xs={12}>
            <RecentActivityTable
              title="Recent Bills"
              data={recentBills}
              loading={loading.bills}
              icon={AttachMoneyIcon}
              columns={[
                { id: "bill_number", label: "Bill #" },
                {
                  id: "client_name",
                  label: "Client",
                  render: (row) => row.client_name || "-",
                },
                {
                  id: "bill_date",
                  label: "Date",
                  render: (row) => {
                    try {
                      return new Date(row.bill_date).toLocaleDateString("en-IN");
                    } catch {
                      return "-";
                    }
                  },
                },
                {
                  id: "total_amount",
                  label: "Total",
                  render: (row) => `₹${(row.total_amount || 0).toLocaleString()}`,
                },
                {
                  id: "payment_status",
                  label: "Status",
                  render: (row) => (
                    <Chip
                      label={row.payment_status || "Unpaid"}
                      size="small"
                      sx={{
                        backgroundColor: STATUS_COLORS[row.payment_status] || COLORS.neutral,
                        color: "white",
                      }}
                    />
                  ),
                },
              ]}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardNew;
