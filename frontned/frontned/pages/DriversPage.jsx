import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Checkbox,
  Card,
  CardContent,
  Snackbar,
} from "@mui/material";
import { Warning, DirectionsCar, Person, LocalGasStation } from "@mui/icons-material";
import AppDatePicker from "../components/common/AppDatePicker";
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteDialog from "../components/common/ConfirmDeleteDialog";
import EmptyState from "../components/common/EmptyState";
import KPICard from "../components/common/KPICard";
import LoadingSkeleton from "../components/LoadingSkeleton";

const API = "http://localhost:5000/api";

// Format Aadhaar for display (e.g., 1234567890123456 → 1234 5678 9012 3456)
const formatAadhaar = (aadhaar) =>
  aadhaar ? String(aadhaar).replace(/(\d{4})(?=\d)/g, "$1 ").trim() : "";

const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editDriverId, setEditDriverId] = useState(null);
  const [search, setSearch] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState("error");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Note: Use aadhaar_no to match backend DB column
  const [formData, setFormData] = useState({
    serial_number: "",
    name: "",
    address: "",
    phone: "",
    license_number: "",
    aadhaar_no: "",
    joining_date: new Date(),
    license_expiry_date: new Date(),
  });

  // ============== API ==============
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/drivers`);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setDrivers(list);
      checkLicenseStatus(list);
    } catch (err) {
      console.error("Error fetching drivers", err.response?.data || err.message);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // ============== Helpers ==============
  const isLicenseExpired = (date) => (date ? new Date(date) < new Date() : false);

  const isLicenseExpiringSoon = (date, days = 30) => {
    if (!date) return false;
    const now = new Date();
    const expiry = new Date(date);
    const diff = (expiry - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= days;
  };

  const checkLicenseStatus = (list) => {
    const newAlerts = [];
    list.forEach((d) => {
      if (isLicenseExpired(d.license_expiry_date)) {
        newAlerts.push({ type: "expired", message: `License expired for ${d.name}` });
      } else if (isLicenseExpiringSoon(d.license_expiry_date)) {
        newAlerts.push({ type: "expiring", message: `License expiring soon for ${d.name}` });
      }
    });
    setAlerts(newAlerts);
  };

  const resetForm = () =>
    setFormData({
      serial_number: "",
      name: "",
      address: "",
      phone: "",
      license_number: "",
      aadhaar_no: "",
      joining_date: new Date(),
      license_expiry_date: new Date(),
    });

  // 🎯 DEMO DATA - Auto-fill for quick testing
  const fillDemoData = () => {
    const randomNum = Math.floor(Math.random() * 1000);
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    
    setFormData({
      serial_number: `DR${randomNum}`,
      name: `Driver ${randomNum}`,
      address: `${randomNum} Main Road, Chennai`,
      phone: `98${String(randomNum).padStart(8, '0')}`,
      license_number: `TN${String(randomNum).padStart(10, '0')}`,
      aadhaar_no: `${String(randomNum).padStart(16, '0')}`,
      joining_date: new Date(),
      license_expiry_date: futureDate,
    });
  };

  const handleOpen = () => {
    resetForm();
    setEditDriverId(null);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setEditDriverId(null);
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ============== Create / Update ==============
  const handleSubmit = async () => {
    const { serial_number, name, address, phone, license_number, aadhaar_no, joining_date, license_expiry_date } =
      formData;

    const aadhaarDigits = (aadhaar_no || "").replace(/\s/g, "");

    // validations
    if (!name || !address || !phone || !license_number || !aadhaarDigits) {
      setToastSeverity("warning");
      setToastMessage("All fields are required!");
      setToastOpen(true);
      return;
    }
    if (phone.length !== 10) {
      setToastSeverity("warning");
      setToastMessage("Phone must be 10 digits");
      setToastOpen(true);
      return;
    }
    if (aadhaarDigits.length !== 16) {
      setToastSeverity("warning");
      setToastMessage("Aadhaar must be 16 digits");
      setToastOpen(true);
      return;
    }
    if (license_number.length !== 15) {
      setToastSeverity("warning");
      setToastMessage("License Number must be exactly 15 characters");
      setToastOpen(true);
      return;
    }
    if (serial_number && serial_number.length !== 3) {
      setToastSeverity("warning");
      setToastMessage("Serial number must be 3 characters");
      setToastOpen(true);
      return;
    }

    const payload = {
      serial_number,
      name,
      address,
      phone,
      license_number: license_number.toUpperCase(),
      aadhaar_no: aadhaarDigits,
      joining_date: joining_date ? new Date(joining_date).toISOString().split("T")[0] : null,
      license_expiry_date: license_expiry_date ? new Date(license_expiry_date).toISOString().split("T")[0] : null,
    };

    setSaving(true);
    try {
      if (editDriverId) {
        await axios.put(`${API}/drivers/${editDriverId}`, payload);
        setToastSeverity("success");
        setToastMessage("Driver updated successfully!");
      } else {
        await axios.post(`${API}/drivers`, payload);
        setToastSeverity("success");
        setToastMessage("Driver added successfully!");
      }
      setToastOpen(true);
      fetchDrivers();
      handleClose();
    } catch (err) {
      setToastSeverity("error");
      setToastMessage("Error: " + (err.response?.data?.message || "Submit failed"));
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // ============== Edit / Delete / Bulk ==============
  const handleEdit = (driver) => {
    const formattedAadhaar = formatAadhaar(driver.aadhaar_no);

    setFormData({
      serial_number: driver.serial_number ?? "",
      name: driver.name ?? "",
      address: driver.address ?? "",
      phone: driver.phone ?? "",
      license_number: driver.license_number ?? "",
      aadhaar_no: formattedAadhaar,
      joining_date: driver.joining_date ? new Date(driver.joining_date) : new Date(),
      license_expiry_date: driver.license_expiry_date ? new Date(driver.license_expiry_date) : new Date(),
    });
    setEditDriverId(driver.id);
    setOpen(true);
  };

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/drivers/${deleteTarget.id}`);
      fetchDrivers();
      setToastSeverity("success");
      setToastMessage("Driver deleted successfully!");
      setToastOpen(true);
    } catch (e) {
      setToastSeverity("error");
      setToastMessage("Delete failed");
      setToastOpen(true);
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

  const handleBulkDelete = async () => {
    if (selectedDrivers.length === 0) {
      setToastSeverity("warning");
      setToastMessage("No drivers selected for deletion.");
      setToastOpen(true);
      return;
    }
    if (!window.confirm(`Delete ${selectedDrivers.length} drivers? This action cannot be undone.`)) return;

    setBulkDeleting(true);
    try {
      await axios.post(`${API}/drivers/bulk-delete`, { ids: selectedDrivers });
      setSelectedDrivers([]);
      fetchDrivers();
      setToastSeverity("success");
      setToastMessage(`${selectedDrivers.length} drivers deleted successfully!`);
      setToastOpen(true);
    } catch (e) {
      setToastSeverity("error");
      setToastMessage("Bulk delete failed");
      setToastOpen(true);
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedDrivers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allVisibleIds = useMemo(
    () =>
      drivers
        .filter((d) => d.name?.toLowerCase().includes(search.toLowerCase()))
        .map((d) => d.id),
    [drivers, search]
  );

  const allSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedDrivers.includes(id));

  const toggleSelectAll = () => {
    setSelectedDrivers((prev) =>
      allSelected ? prev.filter((id) => !allVisibleIds.includes(id)) : Array.from(new Set([...prev, ...allVisibleIds]))
    );
  };

  const filteredDrivers = drivers.filter((d) =>
    (d.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // KPIs
  const kpis = useMemo(() => ({
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(d => !isLicenseExpired(d.license_expiry_date)).length,
    totalDieselCost: drivers.reduce((sum, d) => sum + (parseFloat(d?.diesel_cost) || 0), 0),
  }), [drivers]);

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "-";

  const licenseStatus = (driver) => {
    if (!driver.license_expiry_date) return { label: "Not set", color: "default" };
    if (isLicenseExpired(driver.license_expiry_date)) return { label: "Expired", color: "error" };
    if (isLicenseExpiringSoon(driver.license_expiry_date)) return { label: "Expiring soon", color: "warning" };
    return { label: "Valid", color: "success" };
  };

  const cardStyle = {
    p: 3,
    mb: 3,
    borderRadius: 2,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
    background: "white",
  };

  // ============== UI ==============
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
          Drivers
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Manage driver records, license validity, and quick actions
        </Typography>
      </Box>

      {/* KPI Cards */}
      {loading ? (
        <LoadingSkeleton variant="cards" />
      ) : (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <KPICard
              title="Total Drivers"
              value={kpis.totalDrivers}
              subtitle={`${kpis.activeDrivers} with valid licenses`}
              color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              icon={Person}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KPICard
              title="Active Drivers"
              value={kpis.activeDrivers}
              subtitle="Valid license status"
              color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              icon={DirectionsCar}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KPICard
              title="Total Diesel Cost"
              value={`₹${kpis.totalDieselCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              subtitle="Cumulative fuel expenses"
              color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              icon={LocalGasStation}
            />
          </Grid>
        </Grid>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card sx={{ ...cardStyle, mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={1}>
              {alerts.map((alert, idx) => (
                <Grid item xs={12} key={idx}>
                  <Alert severity={alert.type === "expired" ? "error" : "warning"}>{alert.message}</Alert>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Actions & Filters */}
      <Paper sx={cardStyle}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7} display="flex" gap={1} flexWrap="wrap">
            <Button variant="contained" color="primary" onClick={handleOpen} disabled={saving || deleting}>
              Add Driver
            </Button>
            <Button
              variant="outlined"
              color="error"
              disabled={selectedDrivers.length === 0 || bulkDeleting}
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
            <Button variant="outlined" color="secondary" onClick={fillDemoData}>
              Fill Demo Data
            </Button>
          </Grid>
          <Grid item xs={12} md={5} display="flex" justifyContent="flex-end">
            <TextField
              fullWidth
              size="small"
              label="Search drivers"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{editDriverId ? "Edit Driver" : "Add Driver"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Serial Number"
                name="serial_number"
                value={formData.serial_number}
                onChange={(e) => {
                  let val = e.target.value.toUpperCase();
                  if (val.length <= 3) setFormData((p) => ({ ...p, serial_number: val }));
                }}
                inputProps={{ maxLength: 3 }}
                helperText="Unique 3-digit ID (e.g., 001)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleChange} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) setFormData((p) => ({ ...p, phone: val }));
                }}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="License Number"
                name="license_number"
                value={formData.license_number}
                onChange={(e) => {
                  let val = e.target.value.toUpperCase();
                  if (val.length <= 15) setFormData((p) => ({ ...p, license_number: val }));
                }}
                inputProps={{ maxLength: 15 }}
                helperText="(e.g. AB1234567890123)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Aadhaar Number"
                name="aadhaar_no"
                value={formData.aadhaar_no}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "").slice(0, 16);
                  val = val.replace(/(\d{4})(?=\d)/g, "$1 ");
                  setFormData((p) => ({ ...p, aadhaar_no: val }));
                }}
                inputProps={{ maxLength: 19 }}
                helperText="16 digits, e.g. 1234 1234 1234 1234"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <AppDatePicker
                label="Joining Date"
                value={formData.joining_date}
                onChange={(newValue) => setFormData((p) => ({ ...p, joining_date: newValue || null }))}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <AppDatePicker
                label="License Expiry Date"
                value={formData.license_expiry_date}
                onChange={(newValue) => setFormData((p) => ({ ...p, license_expiry_date: newValue || null }))}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={fillDemoData} variant="outlined" color="secondary" disabled={saving}>
            Fill Demo Data
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? "Saving..." : (editDriverId ? "Update" : "Add")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drivers Table */}
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
                    checked={allSelected}
                    indeterminate={!allSelected && selectedDrivers.some((id) => allVisibleIds.includes(id))}
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Serial No.</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>License No.</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Aadhaar No.</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Joining Date</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>License Expiry</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <EmptyState
                      message="No drivers found"
                      submessage="Try adjusting filters or add a new driver."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrivers.map((driver, index) => {
                  const status = licenseStatus(driver);
                  return (
                    <TableRow key={driver.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedDrivers.includes(driver.id)}
                          onChange={() => toggleSelect(driver.id)}
                        />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{driver.name}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>{driver.license_number}</TableCell>
                      <TableCell>{formatAadhaar(driver.aadhaar_no)}</TableCell>
                      <TableCell>{formatDate(driver.joining_date)}</TableCell>
                      <TableCell>{formatDate(driver.license_expiry_date)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={status.color === "error" ? <Warning /> : undefined}
                          label={status.label}
                          color={status.color === "default" ? "default" : status.color}
                          size="small"
                          variant={status.color === "default" ? "outlined" : "filled"}
                        />
                      </TableCell>
                      <TableCell>
                        <ActionButtons
                          onEdit={() => handleEdit(driver)}
                          onDelete={() => handleDeleteClick(driver.id, driver.name)}
                          disabled={saving || deleting}
                          editTooltip="Edit Driver"
                          deleteTooltip="Delete Driver"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        title="Delete Driver"
        message="Are you sure you want to delete this driver?"
        itemName={deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />

      {/* Toast Alerts */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DriversPage;
