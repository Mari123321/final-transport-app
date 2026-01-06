import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Chip, Alert, Checkbox, Toolbar
} from "@mui/material";
import { Delete, Edit, Warning } from "@mui/icons-material";
import AppDatePicker from "../components/common/AppDatePicker";

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
    try {
      const res = await axios.get(`${API}/drivers`);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setDrivers(list);
      checkLicenseStatus(list);
    } catch (err) {
      console.error("Error fetching drivers", err.response?.data || err.message);
      setDrivers([]);
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
      alert("All fields required!");
      return;
    }
    if (phone.length !== 10) {
      alert("Phone must be 10 digits");
      return;
    }
    if (aadhaarDigits.length !== 16) {
      alert("Aadhaar must be 16 digits");
      return;
    }
    if (license_number.length !== 15) {
      alert("License Number must be exactly 15 characters");
      return;
    }
    if (serial_number && serial_number.length !== 3) {
      alert("Serial number must be 3 characters");
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

    try {
      if (editDriverId) {
        await axios.put(`${API}/drivers/${editDriverId}`, payload);
      } else {
        await axios.post(`${API}/drivers`, payload);
      }
      fetchDrivers();
      handleClose();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Submit failed"));
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API}/drivers/${id}`);
      fetchDrivers();
    } catch {
      alert("Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDrivers.length === 0) {
      alert("No drivers selected");
      return;
    }
    if (!window.confirm(`Delete ${selectedDrivers.length} drivers?`)) return;

    try {
      await axios.post(`${API}/drivers/bulk-delete`, { ids: selectedDrivers });
      setSelectedDrivers([]);
      fetchDrivers();
    } catch {
      alert("Bulk delete failed");
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

  // ============== UI ==============
  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>
        Drivers Management
      </Typography>

      {alerts.map((alert, idx) => (
        <Alert key={idx} severity={alert.type === "expired" ? "error" : "warning"} sx={{ mb: 1 }}>
          {alert.message}
        </Alert>
      ))}

      <Toolbar disableGutters sx={{ justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Button variant="contained" color="primary" onClick={handleOpen} sx={{ mr: 1 }}>
            {editDriverId ? "Edit Driver" : "Add Driver"}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={selectedDrivers.length === 0}
            onClick={handleBulkDelete}
          >
            Delete Selected
          </Button>
        </Box>
        <TextField
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Toolbar>

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
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={fillDemoData} variant="outlined" color="secondary">
            Fill Demo Data
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editDriverId ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && selectedDrivers.some((id) => allVisibleIds.includes(id))}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell>Serial No.</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>License No.</TableCell>
              <TableCell>Aadhaar No.</TableCell>
              <TableCell>Joining Date</TableCell>
              <TableCell>License Expiry</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredDrivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No drivers found.
                </TableCell>
              </TableRow>
            )}

            {filteredDrivers.map((driver, index) => (
              <TableRow key={driver.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedDrivers.includes(driver.id)}
                    onChange={() => toggleSelect(driver.id)}
                  />
                </TableCell>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{driver.name}</TableCell>
                <TableCell>{driver.address || "-"}</TableCell>
                <TableCell>{driver.phone}</TableCell>
                <TableCell>{driver.license_number}</TableCell>
                <TableCell>{formatAadhaar(driver.aadhaar_no)}</TableCell>
                <TableCell>{driver.joining_date ? new Date(driver.joining_date).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  {driver.license_expiry_date ? (
                    isLicenseExpired(driver.license_expiry_date) ? (
                      <Chip icon={<Warning />} label="Expired!" color="error" size="small" />
                    ) : (
                      new Date(driver.license_expiry_date).toLocaleDateString()
                    )
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(driver)} color="primary" size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(driver.id)} color="error" size="small">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DriversPage;
