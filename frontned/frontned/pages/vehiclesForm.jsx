// src/pages/VehiclesPage.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Paper
} from "@mui/material";

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    registrationNumber: "",
    model: "",
    capacity: "",
  });

  const fetchVehicles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/vehicles");
      if (Array.isArray(res.data)) {
        setVehicles(res.data);
      } else {
        setVehicles([]); // fallback in case data is not array
        console.error("Expected array, got:", res.data);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error.message);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddVehicle = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/vehicles", formData);
      if (res.status === 201 || res.status === 200) {
        setFormData({ registrationNumber: "", model: "", capacity: "" });
        fetchVehicles();
      }
    } catch (err) {
      console.error("Error adding vehicle:", err.message);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        🚚 Add New Vehicle
      </Typography>

      <Card sx={{ maxWidth: 600, mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Registration Number"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleAddVehicle}>
                Add Vehicle
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h6">📋 Vehicle List</Typography>

      <Paper elevation={2} sx={{ overflow: "auto", mt: 2 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Reg. Number</th>
              <th style={thStyle}>Model</th>
              <th style={thStyle}>Capacity</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle, index) => (
              <tr key={vehicle.id}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={tdStyle}>{vehicle.registrationNumber}</td>
                <td style={tdStyle}>{vehicle.model}</td>
                <td style={tdStyle}>{vehicle.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>
    </Box>
  );
};

const thStyle = {
  padding: "10px",
  border: "1px solid #ccc",
  textAlign: "left",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #eee",
};

export default VehiclesPage;
