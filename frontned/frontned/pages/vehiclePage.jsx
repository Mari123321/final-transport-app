import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, InputLabel, FormControl, FormHelperText,
  Table, TableHead, TableBody, TableRow, TableCell, Paper,
  IconButton, Checkbox, Tooltip, Chip, Snackbar, Alert
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import axios from "axios";
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const res = await axios.get("/api/vehicles");
      console.log("Vehicles API Response:", res.data); // debug log
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.data
        ? res.data.data
        : [];
      setVehicles(Array.isArray(list) ? list : []);
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to load vehicles",
        severity: "error",
      });
    }
  };

  // Fetch drivers
  const fetchDrivers = async () => {
    try {
      const res = await axios.get("/api/drivers");
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.data
        ? res.data.data
        : [];
      // ✅ filter out invalid driver_id values to avoid .toString() errors
      setDrivers(Array.isArray(list) ? list.filter(d => d?.driver_id != null) : []);
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to load drivers",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  const handleChange = (e) => {
    setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
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
    setEditId(null);
  };

  const handleSubmit = async () => {
    const payload = {
      ...vehicleData,
      rc_expiry_date: vehicleData.rc_expiry_date
        ? dayjs(vehicleData.rc_expiry_date).format("YYYY-MM-DD")
        : null,
      driver_id: vehicleData.driver_id ? Number(vehicleData.driver_id) : null,
    };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });

    try {
      if (editId) {
        await axios.put(`/api/vehicles/${editId}`, payload);
        setSnackbar({
          open: true,
          message: "Vehicle updated successfully",
          severity: "success",
        });
      } else {
        await axios.post("/api/vehicles", payload);
        setSnackbar({
          open: true,
          message: "Vehicle added successfully",
          severity: "success",
        });
      }
      setOpen(false);
      resetForm();
      setSelectedIds([]);
      fetchVehicles();
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          "Submit failed: " + (error?.response?.data?.message || error.message),
        severity: "error",
      });
    }
  };

  // ✅ SAFER handleEdit (no crash if driver_id is missing)
  const handleEdit = (vehicle) => {
    setEditId(vehicle.vehicle_id);
    setVehicleData({
      vehicle_number: vehicle.vehicle_number || "",
      permit_number: vehicle.permit_number || "",
      rc_status: vehicle.rc_status || "Current",
      rc_book_number: vehicle.rc_book_number || "",
      rc_expiry_date: vehicle.rc_expiry_date || "",
      driver_id: vehicle?.driver_id != null ? String(vehicle.driver_id) : "",
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try {
      await axios.delete(`/api/vehicles/${id}`);
      setSnackbar({
        open: true,
        message: "Vehicle deleted",
        severity: "success",
      });
      fetchVehicles();
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to delete vehicle",
        severity: "error",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} vehicles?`)) return;
    try {
      await axios.post("/api/vehicles/bulk-delete", { ids: selectedIds });
      setSnackbar({
        open: true,
        message: `${selectedIds.length} vehicles deleted`,
        severity: "success",
      });
      setSelectedIds([]);
      fetchVehicles();
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to bulk delete vehicles",
        severity: "error",
      });
    }
  };

  const renderExpiryBadge = (date) => {
    if (!date) return null;
    const diff = dayjs(date).diff(dayjs().startOf("day"), "day");
    if (diff < 0)
      return <Chip label="Expired" color="error" size="small" sx={{ ml: 1 }} />;
    if (diff <= 30)
      return (
        <Tooltip title={`Expires in ${diff} days`}>
          <Chip
            label={`Expires in ${diff} days`}
            color="warning"
            size="small"
            sx={{ ml: 1 }}
          />
        </Tooltip>
      );
    return null;
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Vehicles Management
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <Button
          variant="contained"
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          Add Vehicle
        </Button>
        {selectedIds.length > 0 && (
          <Button variant="outlined" color="error" onClick={handleBulkDelete}>
            Delete Selected ({selectedIds.length})
          </Button>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Vehicle Number"
            name="vehicle_number"
            value={vehicleData.vehicle_number}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Permit Number"
            name="permit_number"
            value={vehicleData.permit_number}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>RC Status</InputLabel>
            <Select
              name="rc_status"
              value={vehicleData.rc_status}
              onChange={handleChange}
            >
              <MenuItem value="Current">Current</MenuItem>
              <MenuItem value="Not Current">Not Current</MenuItem>
            </Select>
            <FormHelperText>Select RC Status</FormHelperText>
          </FormControl>
          <TextField
            label="RC Book Number"
            name="rc_book_number"
            value={vehicleData.rc_book_number}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />

          <AppDatePicker
            label="RC Expiry Date"
            value={vehicleData.rc_expiry_date}
            onChange={(newValue) =>
              setVehicleData({
                ...vehicleData,
                rc_expiry_date: newValue ? newValue.format("YYYY-MM-DD") : "",
              })
            }
            fullWidth
            margin="dense"
          />

          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="driver-label">Driver</InputLabel>
            <Select
              labelId="driver-label"
              name="driver_id"
              value={vehicleData.driver_id}
              onChange={handleChange}
              label="Driver"
              displayEmpty
              renderValue={(selected) => {
                if (!selected) return <em>Select a driver</em>;
                const driver = drivers.find(
                  (d) => d?.driver_id != null && String(d.driver_id) === selected
                );
                return driver ? driver.name : "";
              }}
            >
              <MenuItem value="">
                <em>Select a driver</em>
              </MenuItem>
              {drivers.map((d) => (
                <MenuItem key={d.driver_id} value={String(d.driver_id)}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedIds.length === vehicles.length && vehicles.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < vehicles.length}
                  onChange={() =>
                    setSelectedIds(
                      selectedIds.length === vehicles.length
                        ? []
                        : vehicles.map((v) => v.vehicle_id)
                    )
                  }
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
                <TableCell colSpan={8} align="center">
                  No vehicles found.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => (
                <TableRow
                  key={v.vehicle_id}
                  selected={selectedIds.includes(v.vehicle_id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(v.vehicle_id)}
                      onChange={() =>
                        setSelectedIds(
                          selectedIds.includes(v.vehicle_id)
                            ? selectedIds.filter((sid) => sid !== v.vehicle_id)
                            : [...selectedIds, v.vehicle_id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{v.vehicle_number || "-"}</TableCell>
                  <TableCell>{v.permit_number || "-"}</TableCell>
                  <TableCell>
                    {v.rc_status || "-"} {renderExpiryBadge(v.rc_expiry_date)}
                  </TableCell>
                  <TableCell>{v.rc_book_number || "-"}</TableCell>
                  <TableCell>
                    {v.rc_expiry_date
                      ? dayjs(v.rc_expiry_date).format("DD/MM/YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell>{v.Driver?.name || "-"}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(v)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(v.vehicle_id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default VehiclesPage;
