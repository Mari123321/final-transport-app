import React, { useState, useEffect, useMemo } from "react";
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
  TableContainer,
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
  Grid,
  Card,
  CardContent,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { Edit, Delete as DeleteIcon, DirectionsCar, Assignment, Warning } from "@mui/icons-material";
import api from "../api/axios";
import dayjs from "dayjs";
import AppDatePicker from "../components/common/AppDatePicker";
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteDialog from "../components/common/ConfirmDeleteDialog";
import EmptyState from "../components/common/EmptyState";
import KPICard from "../components/common/KPICard";
import LoadingSkeleton from "../components/LoadingSkeleton";

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const cardStyle = {
    p: 3,
    mb: 3,
    borderRadius: 2,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
    background: "white",
  };


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchVehicles(), fetchDrivers()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

    setSaving(true);
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
    } finally {
      setSaving(false);
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

  const handleDeleteClick = (id) => {
    setDeleteTarget(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/vehicles/${deleteTarget}`);
      setSnackbar({ open: true, message: "Vehicle deleted successfully", severity: "success" });
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      fetchVehicles();
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to delete vehicle: " + (error?.response?.data?.message || error.message), severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = window.confirm(`Delete ${selectedIds.length} selected vehicle(s)? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    setBulkDeleting(true);
    try {
      await api.post("/api/vehicles/bulk-delete", { ids: selectedIds });
      setSnackbar({ open: true, message: `${selectedIds.length} vehicle(s) deleted successfully`, severity: "success" });
      setSelectedIds([]);
      fetchVehicles();
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to delete selected vehicles: " + (error?.response?.data?.message || error.message), severity: "error" });
    } finally {
      setBulkDeleting(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) =>
    (v.vehicle_number || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.permit_number || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.driver?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const expiredRC = vehicles.filter(v => {
      if (!v.rc_expiry_date) return false;
      return new Date(v.rc_expiry_date) < now;
    }).length;
    
    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.rc_status === 'Current').length,
      expiredRC,
    };
  }, [vehicles]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
          Vehicles
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Manage vehicle records, insurance, and driver assignments
        </Typography>
      </Box>

      {/* KPI Cards */}
      {loading ? (
        <LoadingSkeleton variant="cards" />
      ) : (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <KPICard
              title="Total Vehicles"
              value={kpis.totalVehicles}
              subtitle={`${kpis.activeVehicles} active vehicles`}
              color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              icon={DirectionsCar}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KPICard
              title="Active Vehicles"
              value={kpis.activeVehicles}
              subtitle="Current RC status"
              color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              icon={Assignment}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KPICard
              title="Expired RC"
              value={kpis.expiredRC}
              subtitle="Requires renewal"
              color="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
              icon={Warning}
            />
          </Grid>
        </Grid>
      )}

      {/* Actions & Filters */}
      <Paper sx={cardStyle}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7} display="flex" gap={1} flexWrap="wrap">
            <Button variant="contained" color="primary" onClick={() => { resetForm(); setOpen(true); }} disabled={saving || deleting || bulkDeleting}>
              Add Vehicle
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0 || bulkDeleting || saving || deleting}
            >
              Delete Selected
            </Button>
            <Button variant="outlined" color="secondary" onClick={fillDemoData} disabled={saving || deleting}>
              Fill Demo Data
            </Button>
          </Grid>
          <Grid item xs={12} md={5} display="flex" justifyContent="flex-end">
            <TextField
              fullWidth
              size="small"
              label="Search vehicles"
              placeholder="Search by number, permit, driver"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Vehicles Table */}
      <Paper sx={{ ...cardStyle, overflow: "hidden" }}>
        {loading ? (
          <LoadingSkeleton variant="table" rows={8} />
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ background: "#f8fafc" }}>
                  <Checkbox
                    color="primary"
                    checked={selectedIds.length === vehicles.length && vehicles.length > 0}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < vehicles.length}
                    onChange={() => setSelectedIds(selectedIds.length === vehicles.length ? [] : vehicles.map(v => v.vehicle_id))}
                  />
                </TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Vehicle Number</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Permit Number</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>RC Status</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>RC Book Number</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>RC Expiry Date</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Driver</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <EmptyState
                      message="No vehicles found"
                      submessage="Try adjusting filters or add a new vehicle to get started"
                    />
                  </TableCell>
                </TableRow>
              ) : filteredVehicles.map((v) => (
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
                  <TableCell sx={{ fontWeight: 600 }}>{v.vehicle_number || "-"}</TableCell>
                  <TableCell>{v.permit_number || "-"}</TableCell>
                  <TableCell>{v.rc_status || "-"}</TableCell>
                  <TableCell>{v.rc_book_number || "-"}</TableCell>
                  <TableCell>{v.rc_expiry_date ? dayjs(v.rc_expiry_date).format("DD/MM/YYYY") : "-"}</TableCell>
                  <TableCell>{v.driver?.name || "-"}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEdit(v)} color="primary" size="small" disabled={deleting} sx={{ "&:hover": { backgroundColor: "#dbeafe" } }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDeleteClick(v.vehicle_id)} color="error" size="small" disabled={deleting} sx={{ "&:hover": { backgroundColor: "#fee2e2" } }}>
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

      {/* Dialog Form */}
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>{editId ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        <DialogContent>
          <TextField label="Vehicle Number" name="vehicle_number" value={vehicleData.vehicle_number} onChange={handleChange} fullWidth margin="dense" disabled={saving} />
          <TextField label="Permit Number" name="permit_number" value={vehicleData.permit_number} onChange={handleChange} fullWidth margin="dense" disabled={saving} />
          <FormControl fullWidth margin="dense" disabled={saving}>
            <InputLabel>RC Status</InputLabel>
            <Select name="rc_status" value={vehicleData.rc_status} onChange={handleChange} label="RC Status">
              <MenuItem value="Current">Current</MenuItem>
              <MenuItem value="Not Current">Not Current</MenuItem>
            </Select>
            <FormHelperText>Choose RC status</FormHelperText>
          </FormControl>
          <TextField label="RC Book Number" name="rc_book_number" value={vehicleData.rc_book_number} onChange={handleChange} fullWidth margin="dense" disabled={saving} />
          <AppDatePicker
            label="RC Expiry Date"
            value={vehicleData.rc_expiry_date}
            onChange={(val) => setVehicleData(prev => ({ ...prev, rc_expiry_date: val ? val.format("YYYY-MM-DD") : "" }))}
            margin="dense"
            fullWidth
            disabled={saving}
          />
          <FormControl fullWidth margin="dense" required error={driverError} disabled={saving}>
            <InputLabel>Driver</InputLabel>
            <Select name="driver_id" value={vehicleData.driver_id} onChange={handleChange}>
              <MenuItem value=""><em>Select a driver</em></MenuItem>
              {drivers.map(d => (<MenuItem key={d.id || d.driver_id} value={String(d.id || d.driver_id)}>{d.name}</MenuItem>))}
            </Select>
            {driverError && <FormHelperText>Please select a driver</FormHelperText>}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={fillDemoData} variant="outlined" color="secondary" disabled={saving}>
            Fill Demo Data
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : (editId ? "Update" : "Save")}
          </Button>
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

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        itemName={deleteTarget ? `Vehicle #${deleteTarget}` : ""}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />
    </Box>
  );
};

export default VehiclesPage;
