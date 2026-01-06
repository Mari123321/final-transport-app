import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Checkbox,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import api from "../api/axios";
import dayjs from "dayjs";
import AppDatePicker from "../components/common/AppDatePicker";

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [vehicleData, setVehicleData] = useState({
    vehicle_number: "",
    permit_number: "",
    rc_status: "Current",
    rc_book_number: "",
    rc_expiry_date: "",
    driver_id: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [driverError, setDriverError] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/api/vehicles");
      setVehicles(Array.isArray(res.data?.data ?? res.data) ? res.data?.data ?? res.data : []);
    } catch {
      setSnackbar({ open: true, message: "Failed to load vehicles", severity: "error" });
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await api.get("/api/drivers");
      setDrivers(Array.isArray(res.data?.data ?? res.data) ? res.data?.data ?? res.data : []);
    } catch {
      setSnackbar({ open: true, message: "Failed to load drivers", severity: "error" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({ ...prev, [name]: value }));
    if (name === "driver_id") setDriverError(!value);
  };

  const validateForm = () => {
    if (!vehicleData.driver_id) {
      setDriverError(true);
      setSnackbar({ open: true, message: "Please select a driver", severity: "error" });
      return false;
    }
    setDriverError(false);
    return true;
  };

  const resetForm = () => {
    setVehicleData({
      vehicle_number: "",
      permit_number: "",
      rc_status: "Current",
      rc_book_number: "",
      rc_expiry_date: "",
      driver_id: "",
    });
    setDriverError(false);
    setEditId(null);
  };

  // 🎯 DEMO DATA - Auto-fill for quick testing
  const fillDemoData = () => {
    const randomNum = Math.floor(Math.random() * 10000);
    const futureDate = dayjs().add(2, 'year').format('YYYY-MM-DD');
    
    setVehicleData({
      vehicle_number: `TN${String(randomNum).padStart(6, '0')}`,
      permit_number: `PM${String(randomNum).padStart(8, '0')}`,
      rc_status: "Current",
      rc_book_number: `RC${String(randomNum).padStart(10, '0')}`,
      rc_expiry_date: futureDate,
      driver_id: drivers.length > 0 ? drivers[0].id : "",
    });
    setDriverError(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      ...vehicleData,
      rc_expiry_date: vehicleData.rc_expiry_date ? dayjs(vehicleData.rc_expiry_date).format("YYYY-MM-DD") : null,
      driver_id: vehicleData.driver_id ? Number(vehicleData.driver_id) : null,
    };
    Object.keys(payload).forEach((key) => { if (payload[key] === "") payload[key] = null; });

    try {
      if (editId) {
        await api.put(`/api/vehicles/${editId}`, payload);
        setSnackbar({ open: true, message: "Vehicle updated successfully", severity: "success" });
      } else {
        await api.post("/api/vehicles", payload);
        setSnackbar({ open: true, message: "Vehicle added successfully", severity: "success" });
      }
      setOpen(false);
      resetForm();
      setSelectedIds([]);
      fetchVehicles();
    } catch (error) {
      setSnackbar({ open: true, message: "Submit failed: " + (error?.response?.data?.message || error.message), severity: "error" });
    }
  };

  const handleEdit = (v) => {
    setVehicleData({
      vehicle_number: v.vehicle_number || "",
      permit_number: v.permit_number || "",
      rc_status: v.rc_status || "Current",
      rc_book_number: v.rc_book_number || "",
      rc_expiry_date: v.rc_expiry_date || "",
      driver_id: v.driver_id ? String(v.driver_id) : "",
    });
    setDriverError(!v.driver_id);
    setEditId(v.vehicle_id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      setSnackbar({ open: true, message: "Vehicle deleted", severity: "success" });
      fetchVehicles();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete vehicle", severity: "error" });
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected vehicles?`)) return;
    try {
      await api.post("/api/vehicles/bulk-delete", { ids: selectedIds });
      setSnackbar({ open: true, message: "Selected vehicles deleted", severity: "success" });
      setSelectedIds([]);
      fetchVehicles();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete selected vehicles", severity: "error" });
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", bgcolor: "#f9f9fb", py: 3, minHeight: "calc(100vh - 64px)" }}>
      <Box sx={{ width: 900 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, textAlign: "center" }}>
          Vehicles Management
        </Typography>
        <Paper sx={{ borderRadius: 2, p: 2, mb: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
            <Button variant="contained" onClick={() => { resetForm(); setOpen(true); }} sx={{ textTransform: "none", fontWeight: 600 }}>
              ADD VEHICLE
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              sx={{ ml: 2, textTransform: "none", fontWeight: 600 }}
            >
              DELETE SELECTED
            </Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    checked={selectedIds.length === vehicles.length && vehicles.length > 0}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < vehicles.length}
                    onChange={() => setSelectedIds(selectedIds.length === vehicles.length ? [] : vehicles.map(v => v.vehicle_id))}
                  />
                </TableCell>
                <TableCell>Vehicle Number</TableCell>
                <TableCell>Permit Number</TableCell>
                <TableCell>RC Status</TableCell>
                <TableCell>RC Book Number</TableCell>
                <TableCell>RC Expiry Date</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: "#aaa" }}>
                    No vehicles found.
                  </TableCell>
                </TableRow>
              ) : vehicles.map((v) => (
                <TableRow key={v.vehicle_id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={selectedIds.includes(v.vehicle_id)}
                      onChange={() =>
                        setSelectedIds(selectedIds.includes(v.vehicle_id) ? selectedIds.filter(id => id !== v.vehicle_id) : [...selectedIds, v.vehicle_id])
                      }
                    />
                  </TableCell>
                  <TableCell>{v.vehicle_number || "-"}</TableCell>
                  <TableCell>{v.permit_number || "-"}</TableCell>
                  <TableCell>{v.rc_status || "-"}</TableCell>
                  <TableCell>{v.rc_book_number || "-"}</TableCell>
                  <TableCell>{v.rc_expiry_date ? dayjs(v.rc_expiry_date).format("DD/MM/YYYY") : "-"}</TableCell>
                  <TableCell>{v.driver?.name || "-"}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(v)} color="primary"><Edit fontSize="small" /></IconButton>
                    <IconButton onClick={() => handleDelete(v.vehicle_id)} color="error"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Dialog Form */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 600 }}>{editId ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          <DialogContent>
            <TextField label="Vehicle Number" name="vehicle_number" value={vehicleData.vehicle_number} onChange={handleChange} fullWidth margin="dense" />
            <TextField label="Permit Number" name="permit_number" value={vehicleData.permit_number} onChange={handleChange} fullWidth margin="dense" />
            <FormControl fullWidth margin="dense">
              <InputLabel>RC Status</InputLabel>
              <Select name="rc_status" value={vehicleData.rc_status} onChange={handleChange} label="RC Status">
                <MenuItem value="Current">Current</MenuItem>
                <MenuItem value="Not Current">Not Current</MenuItem>
              </Select>
              <FormHelperText>Choose RC status</FormHelperText>
            </FormControl>
            <TextField label="RC Book Number" name="rc_book_number" value={vehicleData.rc_book_number} onChange={handleChange} fullWidth margin="dense" />
            <AppDatePicker
              label="RC Expiry Date"
              value={vehicleData.rc_expiry_date}
              onChange={(val) => setVehicleData(prev => ({ ...prev, rc_expiry_date: val ? val.format("YYYY-MM-DD") : "" }))}
              margin="dense"
              fullWidth
            />
            <FormControl fullWidth margin="dense" required error={driverError}>
              <InputLabel>Driver</InputLabel>
              <Select name="driver_id" value={vehicleData.driver_id} onChange={handleChange}>
                <MenuItem value=""><em>Select a driver</em></MenuItem>
                {drivers.map(d => (<MenuItem key={d.id || d.driver_id} value={String(d.id || d.driver_id)}>{d.name}</MenuItem>))}
              </Select>
              {driverError && <FormHelperText>Please select a driver</FormHelperText>}
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={fillDemoData} variant="outlined" color="secondary">
              Fill Demo Data
            </Button>
            <Button variant="contained" onClick={handleSubmit}>{editId ? "Update" : "Save"}</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default VehiclesPage;
