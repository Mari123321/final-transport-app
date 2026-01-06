// src/pages/DriversPage.jsx
import React, { useEffect, useState } from "react";
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
  IconButton,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editDriverId, setEditDriverId] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    license_number: "",
    aadhar_number: "",
  });

  // Fetch drivers
  const fetchDrivers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/drivers");
      setDrivers(res.data);
    } catch (err) {
      console.error("Error fetching drivers", err);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpen = () => {
    setFormData({
      name: "",
      phone: "",
      license_number: "",
      aadhar_number: "",
    });
    setEditDriverId(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditDriverId(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.phone || !formData.license_number || !formData.aadhar_number) {
      alert("All fields are required!");
      return;
    }
    if (formData.phone.length !== 10) {
      alert("Phone number must be 10 digits");
      return;
    }
    if (formData.aadhar_number.length !== 16) {
      alert("Aadhar number must be 16 digits");
      return;
    }

    try {
      if (editDriverId) {
        await axios.put(
          `http://localhost:5000/api/drivers/${editDriverId}`,
          formData
        );
      } else {
        await axios.post("http://localhost:5000/api/drivers", formData);
      }
      fetchDrivers();
      handleClose();
    } catch (err) {
      console.error("Submit failed", err);
      alert("Error: " + (err.response?.data?.message || "Submit failed"));
    }
  };

  const handleEdit = (driver) => {
    setFormData({
      name: driver.name,
      phone: driver.phone,
      license_number: driver.license_number,
      aadhar_number: driver.aadhar_number,
    });
    setEditDriverId(driver.driver_id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/drivers/${id}`);
      fetchDrivers();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

  // Filter drivers by search
  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>
        Drivers Management
      </Typography>

      {/* Add & Search */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Add Driver
        </Button>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" mb={1}>
        Total Drivers: {drivers.length}
      </Typography>

      {/* Dialog Form */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{editDriverId ? "Edit Driver" : "Add Driver"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ""); // digits only
                  if (val.length <= 10) {
                    setFormData((prev) => ({ ...prev, phone: val }));
                  }
                }}
                inputProps={{ maxLength: 10 }}
                helperText="10-digit phone number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="License Number"
                name="license_number"
                value={formData.license_number}
                onChange={(e) => {
                  const val = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "");
                  if (val.length <= 15) {
                    setFormData((prev) => ({
                      ...prev,
                      license_number: val,
                    }));
                  }
                }}
                inputProps={{ maxLength: 15 }}
                helperText="Format: 15 chars (e.g., TN1220241234567)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Aadhar Number"
                name="aadhar_number"
                value={formData.aadhar_number}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ""); // digits only
                  if (val.length <= 16) {
                    setFormData((prev) => ({
                      ...prev,
                      aadhar_number: val,
                    }));
                  }
                }}
                inputProps={{ maxLength: 16 }}
                helperText="Must be exactly 16 digits"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
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
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>License No.</TableCell>
              <TableCell>Aadhar No.</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDrivers.map((driver) => (
              <TableRow key={driver.driver_id}>
                <TableCell>{driver.name}</TableCell>
                <TableCell>{driver.phone}</TableCell>
                <TableCell>{driver.license_number}</TableCell>
                <TableCell>{driver.aadhar_number}</TableCell>
                <TableCell>
                  {driver.createdAt
                    ? new Date(driver.createdAt).toLocaleDateString("en-IN")
                    : "-"}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEdit(driver)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(driver.driver_id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredDrivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No drivers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DriversPage;
