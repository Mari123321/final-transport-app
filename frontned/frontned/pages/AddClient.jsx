import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';

const AddClient = () => {
  const [formData, setFormData] = useState({
    client_name: '',
    client_address: '',
    client_email: '',
    client_gst: '',
    client_phone: '',
    client_pan: '',
    client_type: ''
  });

  const [clients, setClients] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/clients', formData);
      alert('Client added successfully!');
      setFormData({
        client_name: '',
        client_address: '',
        client_email: '',
        client_gst: '',
        client_phone: '',
        client_pan: '',
        client_type: ''
      });
      fetchClients(); // Refresh client list
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Error adding client.');
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/clients');
      setClients(res.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 5 }}>
      <Paper sx={{ p: 4, mb: 5 }}>
        <Typography variant="h5" mb={3}>Add New Client</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {[
              { name: 'client_name', label: 'Name', required: true },
              { name: 'client_address', label: 'Address', required: true },
              { name: 'client_email', label: 'Email', required: true },
              { name: 'client_gst', label: 'GSTIN' },
              { name: 'client_phone', label: 'Phone', required: true },
              { name: 'client_pan', label: 'ID Number (PAN)' },
              { name: 'client_type', label: 'ID Proof Type (Aadhar/Voter ID)' }
            ].map((field) => (
              <Grid item xs={12} sm={field.name === 'client_name' ? 12 : 6} key={field.name}>
                <TextField
                  fullWidth
                  name={field.name}
                  label={field.label}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                />
              </Grid>
            ))}
          </Grid>
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
            Submit
          </Button>
        </form>
      </Paper>

      <Typography variant="h6" gutterBottom>Client List</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>GST</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.client_name}</TableCell>
                <TableCell>{client.client_address}</TableCell>
                <TableCell>{client.client_email}</TableCell>
                <TableCell>{client.client_phone}</TableCell>
                <TableCell>{client.client_gst}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default AddClient;
