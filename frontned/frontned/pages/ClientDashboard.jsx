import React, { useState, useEffect } from "react";
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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Checkbox,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";

const API = "http://localhost:5000/api/clients";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    address: "",
    email: "",
    gstin: "",
    phone: "",
    idProof: "",
    idNumber: "",
  });
  const [editClient, setEditClient] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  // Fetch clients on load
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(API);
        setClients(data);
      } catch (e) {
        console.error("Failed to fetch clients:", e);
        setAlertMessage("Failed to fetch clients from server.");
        setAlertOpen(true);
      }
    })();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && (!/^\d*$/.test(value) || value.length > 10)) return;
    if (name === "idNumber" && formData.idProof === "Aadhar" && (!/^\d*$/.test(value) || value.length > 16)) return;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAddClick = () => {
    setFormData({
      clientName: "",
      address: "",
      email: "",
      gstin: "",
      phone: "",
      idProof: "",
      idNumber: "",
    });
    setEditClient(null);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    const { clientName, address, email, gstin, phone, idProof, idNumber } = formData;
    if (!clientName || !address || !email || !gstin || !phone || !idProof || !idNumber) {
      setAlertMessage("Please enter all details.");
      setAlertOpen(true);
      return;
    }

    try {
      if (editClient) {
        const { data } = await axios.put(`${API}/${editClient.id}`, {
          client_name: clientName,
          client_address: address,
          client_email: email,
          client_gst: gstin,
          client_phone: phone,
          client_pan: idProof,
          client_type: idNumber,
        });
        setClients((list) => list.map((c) => (c.id === editClient.id ? data : c)));
      } else {
        const { data } = await axios.post(API, {
          client_name: clientName,
          client_address: address,
          client_email: email,
          client_gst: gstin,
          client_phone: phone,
          client_pan: idProof,
          client_type: idNumber,
        });
        setClients((list) => [...list, data]);
      }
      setOpenDialog(false);
    } catch (e) {
      console.error("Save failed:", e);
      setAlertMessage("Failed to save client.");
      setAlertOpen(true);
    }
  };

  const handleEdit = (client) => {
    setFormData({
      clientName: client.client_name,
      address: client.client_address,
      email: client.client_email,
      gstin: client.client_gst,
      phone: client.client_phone,
      idProof: client.client_pan,
      idNumber: client.client_type,
    });
    setEditClient(client);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setClients((list) => list.filter((c) => c.id !== id));
      setSelected((sel) => sel.filter((x) => x !== id));
    } catch (e) {
      console.error("Delete failed:", e);
      setAlertMessage("Failed to delete client.");
      setAlertOpen(true);
    }
  };

  const handleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelected(clients.map((c) => c.id));
    else setSelected([]);
  };

  const handleBulkDelete = async () => {
    try {
      await axios.post(`${API}/bulk-delete`, { ids: selected });
      setClients((list) => list.filter((c) => !selected.includes(c.id)));
      setSelected([]);
    } catch (e) {
      console.error("Bulk delete failed:", e);
      setAlertMessage("Bulk delete failed.");
      setAlertOpen(true);
    }
  };

  // Search filter
  const filtered = clients.filter((c) =>
    [c.client_name, c.client_email, c.client_gst, c.client_phone, c.client_pan, c.client_type]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Box p={3}>
      {/* Header + Search */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" gutterBottom>Client Management</Typography>
        <TextField
          size="small"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260 }}
        />
      </Box>

      {/* Action buttons */}
      <Box mb={2}>
        <Button variant="contained" color="primary" onClick={handleAddClick}>Add Client</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleBulkDelete}
          disabled={selected.length === 0}
          sx={{ ml: 2 }}
        >
          Delete Selected
        </Button>
      </Box>

      {/* Clients Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>S.No</b></TableCell>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < clients.length}
                  checked={clients.length > 0 && selected.length === clients.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Address</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>GSTIN</b></TableCell>
              <TableCell><b>Phone</b></TableCell>
              <TableCell><b>ID Proof</b></TableCell>
              <TableCell><b>ID Number</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((client, index) => (
              <TableRow key={client.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(client.id)}
                    onChange={() => handleSelect(client.id)}
                  />
                </TableCell>
                <TableCell>{client.client_name}</TableCell>
                <TableCell>{client.client_address}</TableCell>
                <TableCell>{client.client_email}</TableCell>
                <TableCell>{client.client_gst}</TableCell>
                <TableCell>{client.client_phone}</TableCell>
                <TableCell>{client.client_pan}</TableCell>
                <TableCell sx={{ maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {client.client_type}
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEdit(client)} aria-label="edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(client.id)} aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">No clients found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editClient ? "Edit Client" : "Add Client"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField
                label="Client Name"
                fullWidth
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="GSTIN"
                fullWidth
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Phone"
                fullWidth
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>ID Proof</InputLabel>
                <Select
                  name="idProof"
                  value={formData.idProof}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Aadhar">Aadhar</MenuItem>
                  <MenuItem value="PAN">PAN Card</MenuItem>
                  <MenuItem value="Voter ID">Voter ID</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="ID Number"
                fullWidth
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editClient ? "Update Client" : "Save Client"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alerts */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={4000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="warning">{alertMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientsPage;
