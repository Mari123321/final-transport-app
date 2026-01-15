import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import axios from "axios";
import AppDatePicker from "../components/common/AppDatePicker";
import ConfirmDeleteDialog from "../components/common/ConfirmDeleteDialog";
import EmptyState from "../components/common/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingDropdowns, setFetchingDropdowns] = useState(false);
  const [fetchingTrips, setFetchingTrips] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pendingSummaryOpen, setPendingSummaryOpen] = useState(false);
  const [pendingSummary, setPendingSummary] = useState([]);

  const [form, setForm] = useState({
    client_id: "",
    driver_id: "",
    vehicle_id: "",
    date: "",
    dispatch_date: "",
    from_place: "",
    to_place: "",
    minimum_quantity: "",
    actual_quantity: "",
    rate_per_tonne: "",
    diesel_litre: "",
    diesel_payment: "",
    amount: "",
    amount_paid: "",
    payment_mode: "Cash",
  });

  useEffect(() => {
    fetchDropdowns();
    fetchTrips();
  }, []);

  const fetchDropdowns = async () => {
    setFetchingDropdowns(true);
    try {
      const [clientsRes, driversRes, vehiclesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/clients"),
        axios.get("http://localhost:5000/api/drivers"),
        axios.get("http://localhost:5000/api/vehicles"),
      ]);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setDrivers(Array.isArray(driversRes.data) ? driversRes.data : []);
      setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
    } catch {
      setSnackbar({ open: true, message: "Failed to load dropdowns", severity: "error" });
      setClients([]);
      setDrivers([]);
      setVehicles([]);
    } finally {
      setFetchingDropdowns(false);
    }
  };

  const fetchTrips = async () => {
    setFetchingTrips(true);
    try {
      const res = await axios.get("http://localhost:5000/api/trips");
      setTrips(Array.isArray(res.data.trips) ? res.data.trips : []);
    } catch {
      setSnackbar({ open: true, message: "Failed to load trips", severity: "error" });
      setTrips([]);
    } finally {
      setFetchingTrips(false);
    }
  };

  const calculatePendingSummary = () => {
    const summary = new Map();
    filteredTrips.forEach(t => {
      const name = t.client?.client_name;
      if (!name) return;
      const pending = (t.amount ?? 0) - (t.amount_paid ?? 0);
      summary.set(name, (summary.get(name) ?? 0) + pending);
    });
    setPendingSummary([...summary.entries()]);
  };

  const openPendingSummary = () => {
    calculatePendingSummary();
    setPendingSummaryOpen(true);
  };
  const closePendingSummary = () => setPendingSummaryOpen(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "minimum_quantity") {
        updated.actual_quantity = value;
      }
      const minQty = parseFloat(updated.minimum_quantity);
      const rate = parseFloat(updated.rate_per_tonne);
      updated.amount = (!isNaN(minQty) && !isNaN(rate)) ? (minQty * rate).toFixed(2) : "";
      return updated;
    });
  };

  const validateForm = () => {
    const required = ["client_id", "driver_id", "vehicle_id", "date", "dispatch_date", "payment_mode", "minimum_quantity", "rate_per_tonne"];
    for (const field of required) {
      if (!form[field]) {
        setSnackbar({ open: true, message: `Please fill ${field}`, severity: "warning" });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const minQty = parseFloat(form.minimum_quantity);
    const rate = parseFloat(form.rate_per_tonne);
    let actualQty = parseFloat(form.actual_quantity);
    if (isNaN(minQty) || isNaN(rate)) {
      setSnackbar({ open: true, message: "Invalid quantity or rate", severity: "warning" });
      return;
    }
    if (isNaN(actualQty) || actualQty === 0) {
      actualQty = minQty;
    }

    setLoading(true);

    const payload = {
      client_id: Number(form.client_id),
      driver_id: Number(form.driver_id),
      vehicle_id: Number(form.vehicle_id),
      date: form.date,
      dispatch_date: form.dispatch_date,
      from_place: form.from_place.trim(),
      to_place: form.to_place.trim(),
      minimum_quantity: minQty,
      actual_quantity: actualQty,
      rate_per_tonne: rate,
      diesel_litre: parseFloat(form.diesel_litre) || 0,
      diesel_payment: parseFloat(form.diesel_payment) || 0,
      amount: (minQty * rate).toFixed(2),
      amount_paid: parseFloat(form.amount_paid) || 0,
      payment_mode: form.payment_mode,
    };

    try {
      await axios.post("http://localhost:5000/api/trips", payload);
      setSnackbar({ open: true, message: "Trip created successfully", severity: "success" });
      setOpen(false);
      setForm({
        client_id: "",
        driver_id: "",
        vehicle_id: "",
        date: "",
        dispatch_date: "",
        from_place: "",
        to_place: "",
        minimum_quantity: "",
        actual_quantity: "",
        rate_per_tonne: "",
        diesel_litre: "",
        diesel_payment: "",
        amount: "",
        amount_paid: "",
        payment_mode: "Cash",
      });
      fetchTrips();
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.error ?? e.message ?? "Failed to create trip", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (tripId) => {
    setDeleteTarget(tripId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:5000/api/trips/${deleteTarget}`);
      fetchTrips();
      setSnackbar({ open: true, message: "Trip deleted successfully!", severity: "success" });
    } catch (e) {
      setSnackbar({ open: true, message: "Failed to delete trip", severity: "error" });
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const isDisabled = loading || fetchingDropdowns;

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

  const cardStyle = {
    p: 3,
    mb: 3,
    borderRadius: 2,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
    background: "white",
  };

  const summary = useMemo(() => {
    const totalTrips = trips.length;
    const totalAmount = trips.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalPending = trips.reduce((sum, t) => sum + ((Number(t.amount) || 0) - (Number(t.amount_paid) || 0)), 0);
    return { totalTrips, totalAmount, totalPending };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const name = t.client?.client_name || "";
      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        (t.from_place || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.to_place || "").toLowerCase().includes(search.toLowerCase());

      const matchesClient = !filterClient || String(t.client_id ?? t.client?.client_id) === String(filterClient);
      const matchesDriver = !filterDriver || String(t.driver_id ?? t.driver?.id) === String(filterDriver);
      const matchesVehicle = !filterVehicle || String(t.vehicle_id ?? t.vehicle?.vehicle_id) === String(filterVehicle);

      const tripDate = t.date ? new Date(t.date) : null;
      const fromOk = !fromDate || (tripDate && tripDate >= new Date(fromDate));
      const toOk = !toDate || (tripDate && tripDate <= new Date(toDate));

      return matchesSearch && matchesClient && matchesDriver && matchesVehicle && fromOk && toOk;
    });
  }, [trips, search, filterClient, filterDriver, filterVehicle, fromDate, toDate]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
          Trips Management
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Track and manage trips, payments, and dispatch details
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[{
          title: "Total Trips",
          value: summary.totalTrips,
          color: "linear-gradient(135deg, #e0f2fe, #bfdbfe)",
        }, {
          title: "Total Amount",
          value: formatCurrency(summary.totalAmount),
          color: "linear-gradient(135deg, #ecfccb, #d9f99d)",
        }, {
          title: "Pending",
          value: formatCurrency(summary.totalPending),
          color: "linear-gradient(135deg, #fee2e2, #fecaca)",
        }].map((item, idx) => (
          <Grid item xs={12} md={4} key={item.title}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)", 
              background: item.color,
              border: "1px solid rgba(0,0,0,0.06)",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                transform: "translateY(-2px)"
              }
            }}>
              <CardContent sx={{ py: 2.5 }}>
                <Typography variant="subtitle2" sx={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
                  {item.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mt: 1 }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters & Actions */}
      <Paper sx={{ ...cardStyle, mb: 3 }}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1e293b" }}>
            Filters & Search
          </Typography>
        </Box>
        <Grid container spacing={2.5} alignItems="flex-end">
          {/* Search */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search Trips"
              placeholder="Client, route, or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#f8fafc",
                  "&:hover": { backgroundColor: "#f1f5f9" }
                }
              }}
            />
          </Grid>

          {/* Filter by Client */}
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Client</InputLabel>
              <Select
                label="Filter by Client"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                sx={{ backgroundColor: "#f8fafc" }}
              >
                <MenuItem value=""><em>All Clients</em></MenuItem>
                {clients.map((c) => (
                  <MenuItem key={c.client_id} value={String(c.client_id)}>{c.client_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filter by Driver */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Driver</InputLabel>
              <Select
                label="Filter by Driver"
                value={filterDriver}
                onChange={(e) => setFilterDriver(e.target.value)}
                sx={{ backgroundColor: "#f8fafc" }}
              >
                <MenuItem value=""><em>All Drivers</em></MenuItem>
                {drivers.map((d) => (
                  <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filter by Vehicle */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Vehicle</InputLabel>
              <Select
                label="Filter by Vehicle"
                value={filterVehicle}
                onChange={(e) => setFilterVehicle(e.target.value)}
                sx={{ backgroundColor: "#f8fafc" }}
              >
                <MenuItem value=""><em>All Vehicles</em></MenuItem>
                {vehicles.map((v) => (
                  <MenuItem key={v.vehicle_id} value={String(v.vehicle_id)}>{v.vehicle_number}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Date Range */}
          <Grid item xs={12} sm={6} md={2.5}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <AppDatePicker
                label="From Date"
                value={fromDate}
                onChange={(val) => setFromDate(val ? val.format("YYYY-MM-DD") : "")}
                slotProps={{ 
                  textField: { 
                    size: "small", 
                    fullWidth: true,
                    sx: { backgroundColor: "#f8fafc" }
                  } 
                }}
              />
              <AppDatePicker
                label="To Date"
                value={toDate}
                onChange={(val) => setToDate(val ? val.format("YYYY-MM-DD") : "")}
                slotProps={{ 
                  textField: { 
                    size: "small", 
                    fullWidth: true,
                    sx: { backgroundColor: "#f8fafc" }
                  } 
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap", pt: 2.5, borderTop: "1px solid #e2e8f0" }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={openPendingSummary}
            sx={{ minWidth: 140 }}
          >
            Pending Amounts
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setOpen(true)}
            sx={{ minWidth: 120 }}
          >
            Add Trip
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <Paper sx={{ ...cardStyle, position: "relative", overflow: "hidden" }}>
        {fetchingTrips && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.7)", zIndex: 1 }}>
            <CircularProgress />
          </Box>
        )}

        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1e293b" }}>
            Trips List ({filteredTrips.length})
          </Typography>
        </Box>

        {fetchingTrips ? (
          <LoadingSkeleton variant="table" rows={10} />
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }}>#</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }}>Client</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }}>Driver</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }}>Vehicle</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }}>Date</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }}>Dispatch</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }}>From</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }}>To</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }} align="right">Min Qty</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }} align="right">Actual Qty</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }} align="right">Rate/Tonne</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }} align="right">Amount</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }} align="right">Paid</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }} align="right">Pending</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5 }}>Mode</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600, color: "#475569", fontSize: "0.8125rem", py: 1.5, textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredTrips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={16} align="center" sx={{ py: 6 }}>
                    <EmptyState
                      message="No trips found"
                      submessage="Adjust filters or add a new trip to get started"
                    />
                  </TableCell>
                </TableRow>
              )}

              {filteredTrips.map((t, i) => (
                <TableRow 
                  key={t.trip_id || `${t.client_id}-${t.driver_id}-${i}`} 
                  hover
                  sx={{ 
                    "&:hover": { backgroundColor: "#f8fafc" },
                    transition: "background-color 0.15s ease"
                  }}
                >
                  <TableCell sx={{ color: "#64748b", fontSize: "0.8125rem" }}>{i + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.8125rem" }}>{t.client?.client_name ?? t.client ?? "-"}</TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{t.driver?.name ?? t.driver ?? "-"}</TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{t.vehicle?.vehicle_number ?? t.vehicle ?? "-"}</TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{t.date ? new Date(t.date).toLocaleDateString() : "-"}</TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{t.dispatch_date ? new Date(t.dispatch_date).toLocaleDateString() : "-"}</TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{t.from_place ?? "-"}</TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{t.to_place ?? "-"}</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.8125rem" }}>{t.minimum_quantity ?? 0}</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.8125rem" }}>{t.actual_quantity ?? 0}</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.8125rem" }}>{t.rate_per_tonne ?? 0}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.8125rem" }}>{formatCurrency(t.amount)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.8125rem", color: "#059669" }}>{formatCurrency(t.amount_paid)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.8125rem", color: "#dc2626", fontWeight: 500 }}>{formatCurrency((t.amount ?? 0) - (t.amount_paid ?? 0))}</TableCell>
                  <TableCell>{t.payment_mode ?? "-"}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete Trip">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(t.trip_id)}
                        disabled={deleting}
                        sx={{ "&:hover": { backgroundColor: "#fee2e2" } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Paper>

      {/* Pending Amounts Dialog */}
      <Dialog open={pendingSummaryOpen} onClose={closePendingSummary} maxWidth="xs" fullWidth>
        <DialogTitle>Pending Amounts by Client</DialogTitle>
        <DialogContent dividers>
          {pendingSummary.length === 0 ? (
            <Typography>No pending amounts to show.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingSummary.map(([client, amt]) => (
                  <TableRow key={client}>
                    <TableCell>{client}</TableCell>
                    <TableCell align="right">{amt.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePendingSummary}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Trip Dialog */}
      <Dialog open={open} onClose={() => { if (!loading) setOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Trip</DialogTitle>
        <DialogContent dividers>

          <FormControl fullWidth margin="normal" required disabled={isDisabled}>
            <InputLabel id="client-label">Client</InputLabel>
            <Select labelId="client-label" name="client_id" value={form.client_id} onChange={handleChange}>
              <MenuItem value=""><em>Select Client</em></MenuItem>
              {clients.map(c => (
                <MenuItem key={c.client_id} value={String(c.client_id)}>{c.client_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required disabled={isDisabled}>
            <InputLabel id="driver-label">Driver</InputLabel>
            <Select labelId="driver-label" name="driver_id" value={form.driver_id} onChange={handleChange}>
              <MenuItem value=""><em>Select Driver</em></MenuItem>
              {drivers.map(d => (
                <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required disabled={isDisabled}>
            <InputLabel id="vehicle-label">Vehicle</InputLabel>
            <Select labelId="vehicle-label" name="vehicle_id" value={form.vehicle_id} onChange={handleChange}>
              <MenuItem value=""><em>Select Vehicle</em></MenuItem>
              {vehicles.map(v => (
                <MenuItem key={v.vehicle_id} value={String(v.vehicle_id)}>{v.vehicle_number}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <AppDatePicker
            label="Date"
            value={form.date}
            onChange={(val) => setForm(prev => ({ ...prev, date: val ? val.format("YYYY-MM-DD") : "" }))}
            required
            disabled={isDisabled}
            fullWidth
          />

          <AppDatePicker
            label="Dispatch Date"
            value={form.dispatch_date}
            onChange={(val) => setForm(prev => ({ ...prev, dispatch_date: val ? val.format("YYYY-MM-DD") : "" }))}
            required
            disabled={isDisabled}
            fullWidth
          />

          <TextField label="From Place" name="from_place" value={form.from_place} onChange={handleChange} disabled={isDisabled} fullWidth margin="normal" />

          <TextField label="To Place" name="to_place" value={form.to_place} onChange={handleChange} disabled={isDisabled} fullWidth margin="normal" />

          <TextField label="Minimum Quantity" name="minimum_quantity" value={form.minimum_quantity} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} required disabled={isDisabled} fullWidth margin="normal" />

          <TextField label="Actual Quantity" name="actual_quantity" value={form.actual_quantity} type="number" InputProps={{ readOnly: true }} disabled fullWidth margin="normal" />

          <TextField label="Rate per Tonne" name="rate_per_tonne" value={form.rate_per_tonne} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} required disabled={isDisabled} fullWidth margin="normal" />

          <TextField label="Diesel Litres" name="diesel_litre" value={form.diesel_litre} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} disabled={isDisabled} fullWidth margin="normal" />

          <TextField label="Diesel Payment" name="diesel_payment" value={form.diesel_payment} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} disabled={isDisabled} fullWidth margin="normal" />

          <TextField label="Amount" name="amount" value={form.amount} type="number" InputProps={{ readOnly: true }} disabled fullWidth margin="normal" />

          <TextField label="Amount Paid" name="amount_paid" value={form.amount_paid} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} disabled={isDisabled} fullWidth margin="normal" />

          <FormControl fullWidth margin="normal" required disabled={isDisabled}>
            <InputLabel id="payment-mode-label">Payment Mode</InputLabel>
            <Select labelId="payment-mode-label" name="payment_mode" value={form.payment_mode} onChange={handleChange}>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
            </Select>
          </FormControl>

        </DialogContent>

        <DialogActions>
          <Button onClick={() => { if (!loading) setOpen(false); }} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} variant="contained" color="primary">
            {loading ? <CircularProgress size={24} /> : "Add Trip"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        title="Delete Trip"
        message="Are you sure you want to delete this trip? This action cannot be undone."
        itemName={deleteTarget ? `Trip #${deleteTarget}` : ""}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />
    </Box>
  );
};

export default TripsPage;
