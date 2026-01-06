// frontend/src/pages/TripsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Checkbox,
  Snackbar,
  Alert,
} from "@mui/material";
import AppDatePicker from "../components/common/AppDatePicker";

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [selectedTrips, setSelectedTrips] = useState([]); // bulk delete
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [formData, setFormData] = useState({
    client_id: "",
    driver_id: "",
    vehicle_id: "",
    date: "",
    from_place: "",
    to_place: "",
    tonnage: "",
    diesel_litre: "",
    diesel_payment: "",
    amount: "",
    amount_paid: "",
    payment_mode: "Cash",
    advance_upi_id: "",
  });

  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingByClient, setPendingByClient] = useState({}); // store pending amount for all clients

  // Fetch trips
  useEffect(() => {
    fetch("/api/trips")
      .then((res) => res.json())
      .then((data) => setTrips(data))
      .catch((err) => console.error("Error fetching trips:", err));
  }, []);

  // Fetch dropdown data
  useEffect(() => {
    fetch("/api/clients").then((res) => res.json()).then(setClients);
    fetch("/api/drivers").then((res) => res.json()).then(setDrivers);
    fetch("/api/vehicles").then((res) => res.json()).then(setVehicles);
  }, []);

  // Update pending amount dynamically
  useEffect(() => {
    const amt = parseFloat(formData.amount) || 0;
    const paid = parseFloat(formData.amount_paid) || 0;
    setPendingAmount(amt - paid > 0 ? amt - paid : 0);
  }, [formData.amount, formData.amount_paid]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🎯 DEMO DATA - Auto-fill for quick testing
  const fillDemoData = () => {
    const randomNum = Math.floor(Math.random() * 1000);
    const today = new Date().toISOString().split('T')[0];
    
    setFormData({
      client_id: clients.length > 0 ? clients[0].client_id || clients[0].id : "",
      driver_id: drivers.length > 0 ? drivers[0].id || drivers[0].driver_id : "",
      vehicle_id: vehicles.length > 0 ? vehicles[0].vehicle_id || vehicles[0].id : "",
      date: today,
      from_place: "Chennai",
      to_place: "Bangalore",
      tonnage: `${10 + (randomNum % 20)}`,
      diesel_litre: `${50 + (randomNum % 50)}`,
      diesel_payment: `${3000 + (randomNum % 2000)}`,
      amount: `${15000 + (randomNum % 10000)}`,
      amount_paid: `${10000 + (randomNum % 5000)}`,
      payment_mode: "Cash",
      advance_upi_id: "",
    });
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create trip");

      const newTrip = await res.json();
      setTrips([...trips, newTrip]);

      // update client pending after save
      const clientId = formData.client_id;
      const prevPending = pendingByClient[clientId] || 0;
      setPendingByClient({
        ...pendingByClient,
        [clientId]: prevPending + (pendingAmount > 0 ? pendingAmount : 0),
      });

      setSnackbar({ open: true, message: "Trip added successfully", severity: "success" });
      setOpen(false);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to create trip", severity: "error" });
    }
  };

  // Handle single delete
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete trip");
      setTrips(trips.filter((t) => t.trip_id !== id));
      setSnackbar({ open: true, message: "Trip deleted successfully", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to delete trip", severity: "error" });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      const res = await fetch("/api/trips/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedTrips }),
      });

      if (!res.ok) throw new Error("Failed to bulk delete trips");

      setTrips(trips.filter((t) => !selectedTrips.includes(t.trip_id)));
      setSelectedTrips([]);
      setSnackbar({ open: true, message: "Selected trips deleted successfully", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to bulk delete trips", severity: "error" });
    }
  };

  const toggleSelectTrip = (id) => {
    setSelectedTrips((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Trip Management
      </Typography>

      {/* Show pending for all clients */}
      {Object.entries(pendingByClient).map(([clientId, pending]) => {
        if (pending > 0) {
          const client = clients.find(c => c.client_id === parseInt(clientId));
          return (
            <Alert key={clientId} severity="warning" sx={{ mb: 2 }}>
              Client {client?.client_name || clientId} Pending: {pending}
            </Alert>
          );
        }
        return null;
      })}

      {/* Bulk Delete Button */}
      {selectedTrips.length > 0 && (
        <Button variant="contained" color="error" onClick={handleBulkDelete} sx={{ mb: 2 }}>
          Delete Selected ({selectedTrips.length})
        </Button>
      )}

      {/* Add Trip Button */}
      <Button variant="contained" color="primary" onClick={() => setOpen(true)} sx={{ mb: 2, ml: 2 }}>
        Add Trip
      </Button>

      {/* Trip Table */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedTrips.length === trips.length && trips.length > 0}
                  onChange={(e) =>
                    setSelectedTrips(e.target.checked ? trips.map((t) => t.trip_id) : [])
                  }
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trips.map((trip) => {
              const client = clients.find(c => c.client_id === trip.client_id);
              const driver = drivers.find(d => d.driver_id === trip.driver_id);
              const vehicle = vehicles.find(v => v.vehicle_id === trip.vehicle_id);

              return (
                <TableRow key={trip.trip_id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedTrips.includes(trip.trip_id)}
                      onChange={() => toggleSelectTrip(trip.trip_id)}
                    />
                  </TableCell>
                  <TableCell>{trip.trip_id}</TableCell>
                  <TableCell>{client ? client.client_name : trip.client_id}</TableCell>
                  <TableCell>{driver ? driver.name : trip.driver_id}</TableCell>
                  <TableCell>{vehicle ? vehicle.vehicle_number : trip.vehicle_id}</TableCell>
                  <TableCell>{new Date(trip.date).toLocaleDateString()}</TableCell>
                  <TableCell>{trip.amount}</TableCell>
                  <TableCell>{trip.amount_paid}</TableCell>
                  <TableCell>{trip.amount - trip.amount_paid}</TableCell>
                  <TableCell>
                    <Button color="error" onClick={() => handleDelete(trip.trip_id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Add Trip Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Trip</DialogTitle>
        <DialogContent>
          {/* Show Pending Amount for this trip */}
          {pendingAmount > 0 && formData.client_id && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Client {clients.find(c => c.client_id === parseInt(formData.client_id))?.client_name}
              {" "}Pending for this trip: {pendingAmount}
            </Alert>
          )}

          <FormControl fullWidth margin="dense">
            <InputLabel>Client</InputLabel>
            <Select name="client_id" value={formData.client_id} onChange={handleChange}>
              {clients.map((c) => (
                <MenuItem key={c.client_id} value={c.client_id}>
                  {c.client_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Driver</InputLabel>
            <Select name="driver_id" value={formData.driver_id} onChange={handleChange}>
              {drivers.map((d) => (
                <MenuItem key={d.driver_id} value={d.driver_id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Vehicle</InputLabel>
            <Select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange}>
              {vehicles.map((v) => (
                <MenuItem key={v.vehicle_id} value={v.vehicle_id}>
                  {v.vehicle_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <AppDatePicker
            label="Trip Date"
            value={formData.date}
            onChange={(val) => handleChange({ target: { name: 'date', value: val ? val.format("YYYY-MM-DD") : "" } })}
            fullWidth
            margin="dense"
          />

          <TextField label="From Place" fullWidth margin="dense" name="from_place" value={formData.from_place} onChange={handleChange} />
          <TextField label="To Place" fullWidth margin="dense" name="to_place" value={formData.to_place} onChange={handleChange} />
          <TextField label="Tonnage" fullWidth margin="dense" name="tonnage" value={formData.tonnage} onChange={handleChange} />
          <TextField label="Diesel Litre" fullWidth margin="dense" name="diesel_litre" value={formData.diesel_litre} onChange={handleChange} />
          <TextField label="Diesel Payment" fullWidth margin="dense" name="diesel_payment" value={formData.diesel_payment} onChange={handleChange} />
          <TextField label="Amount" fullWidth margin="dense" name="amount" value={formData.amount} onChange={handleChange} />
          <TextField label="Amount Paid" fullWidth margin="dense" name="amount_paid" value={formData.amount_paid} onChange={handleChange} />

          <FormControl fullWidth margin="dense">
            <InputLabel>Payment Mode</InputLabel>
            <Select name="payment_mode" value={formData.payment_mode} onChange={handleChange}>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
              <MenuItem value="Net Banking">Net Banking</MenuItem>
            </Select>
          </FormControl>

          {/* Show UPI ID field if UPI selected */}
          {formData.payment_mode === "UPI" && (
            <TextField
              label="UPI ID"
              fullWidth
              margin="dense"
              name="advance_upi_id"
              value={formData.advance_upi_id}
              onChange={handleChange}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={fillDemoData} variant="outlined" color="secondary">
            Fill Demo Data
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TripsPage;
