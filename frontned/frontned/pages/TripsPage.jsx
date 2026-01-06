import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, FormControl, Select, InputLabel,
  Snackbar, Alert, CircularProgress
} from "@mui/material";
import axios from "axios";
import AppDatePicker from "../components/common/AppDatePicker";

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingDropdowns, setFetchingDropdowns] = useState(false);
  const [fetchingTrips, setFetchingTrips] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    if (!search.trim()) {
      setFilteredTrips(trips);
    } else {
      setFilteredTrips(
        trips.filter(t => t.client?.client_name.toLowerCase().includes(search.toLowerCase()))
      );
    }
  }, [search, trips]);

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

  const isDisabled = loading || fetchingDropdowns;

  const formatDate = s => s ? s.slice(0, 10) : "";

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>Trips Management</Typography>

      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField size="small" label="Search by Client" value={search} onChange={e => setSearch(e.target.value)} />
        <Box>
          <Button variant="contained" color="secondary" onClick={openPendingSummary} sx={{ mr: 2 }}>Pending Amounts</Button>
          <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Add Trip</Button>
        </Box>
      </Box>

      <Paper sx={{ overflowX: "auto", position: "relative" }}>
        {fetchingTrips &&
          <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1 }}>
            <CircularProgress />
          </Box>
        }

        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Dispatch Date</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Min Qty</TableCell>
              <TableCell>Actual Qty</TableCell>
              <TableCell>Rate/Tonne</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Mode</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredTrips.length === 0 ? (
              <TableRow><TableCell colSpan={14} align="center">No trips found.</TableCell></TableRow>
            ) : (
              filteredTrips.map((t, i) => (
                <TableRow key={t.trip_id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{t.client?.client_name ?? t.client ?? "-"}</TableCell>
                  <TableCell>{t.driver?.name ?? t.driver ?? "-"}</TableCell>
                  <TableCell>{t.vehicle?.vehicle_number ?? t.vehicle ?? "-"}</TableCell>
                  <TableCell>{t.date ? new Date(t.date).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{t.dispatch_date ? new Date(t.dispatch_date).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{t.from_place ?? "-"}</TableCell>
                  <TableCell>{t.to_place ?? "-"}</TableCell>
                  <TableCell>{t.minimum_quantity ?? 0}</TableCell>
                  <TableCell>{t.actual_quantity ?? 0}</TableCell>
                  <TableCell>{t.rate_per_tonne ?? 0}</TableCell>
                  <TableCell>₹{t.amount ?? 0}</TableCell>
                  <TableCell>₹{t.amount_paid ?? 0}</TableCell>
                  <TableCell>{t.payment_mode ?? "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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

          <FormControl fullWidth margin="normal" required disabled={loading || fetchingDropdowns}>
            <InputLabel id="client-label">Client</InputLabel>
            <Select labelId="client-label" name="client_id" value={form.client_id} onChange={handleChange}>
              <MenuItem value=""><em>Select Client</em></MenuItem>
              {clients.map(c => (
                <MenuItem key={c.client_id} value={String(c.client_id)}>{c.client_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required disabled={loading || fetchingDropdowns}>
            <InputLabel id="driver-label">Driver</InputLabel>
            <Select labelId="driver-label" name="driver_id" value={form.driver_id} onChange={handleChange}>
              <MenuItem value=""><em>Select Driver</em></MenuItem>
              {drivers.map(d => (
                <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required disabled={loading || fetchingDropdowns}>
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
            disabled={loading || fetchingDropdowns}
            fullWidth
          />

          <AppDatePicker
            label="Dispatch Date"
            value={form.dispatch_date}
            onChange={(val) => setForm(prev => ({ ...prev, dispatch_date: val ? val.format("YYYY-MM-DD") : "" }))}
            required
            disabled={loading || fetchingDropdowns}
            fullWidth
          />

          <TextField label="From Place" name="from_place" value={form.from_place} onChange={handleChange} disabled={loading || fetchingDropdowns} fullWidth margin="normal" />

          <TextField label="To Place" name="to_place" value={form.to_place} onChange={handleChange} disabled={loading || fetchingDropdowns} fullWidth margin="normal" />

          <TextField label="Minimum Quantity" name="minimum_quantity" value={form.minimum_quantity} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} required disabled={loading || fetchingDropdowns} fullWidth margin="normal" />

          <TextField label="Actual Quantity" name="actual_quantity" value={form.actual_quantity} type="number" InputProps={{ readOnly: true }} disabled fullWidth margin="normal" />

          <TextField label="Rate per Tonne" name="rate_per_tonne" value={form.rate_per_tonne} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} required disabled={loading || fetchingDropdowns} fullWidth margin="normal" />

          <TextField label="Diesel Litres" name="diesel_litre" value={form.diesel_litre} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} disabled={loading || fetchingDropdowns} fullWidth margin="normal" />

          <TextField label="Diesel Payment" name="diesel_payment" value={form.diesel_payment} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} disabled={loading || fetchingDropdowns} fullWidth margin="normal" />

          <TextField label="Amount" name="amount" value={form.amount} type="number" InputProps={{ readOnly: true }} disabled fullWidth margin="normal" />

          <TextField label="Amount Paid" name="amount_paid" value={form.amount_paid} onChange={handleChange} type="number" inputProps={{ min: 0, step: 'any' }} disabled={loading || fetchingDropdowns} fullWidth margin="normal" />

          <FormControl fullWidth margin="normal" required disabled={loading || fetchingDropdowns}>
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
    </Box>
  );
};

export default TripsPage;
