import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import { People, TrendingUp, AccountBalance } from "@mui/icons-material";
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteDialog from "../components/common/ConfirmDeleteDialog";
import EmptyState from "../components/common/EmptyState";
import KPICard from "../components/common/KPICard";
import LoadingSkeleton from "../components/LoadingSkeleton";

const API = "http://localhost:5000/api/clients";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const [alertSeverity, setAlertSeverity] = useState("error");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch clients on load
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(API);
        setClients(data);
      } catch (e) {
        console.error("Failed to fetch clients:", e);
        setAlertSeverity("error");
        setAlertMessage("Failed to fetch clients from server.");
        setAlertOpen(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalClients = clients.length;
    const totalOutstanding = clients.reduce((sum, c) => {
      const outstanding = c?.outstanding ?? c?.pending_amount ?? c?.balance ?? 0;
      return sum + Number(outstanding);
    }, 0);
    const activeClients = clients.filter(c => c?.status !== 'inactive').length;
    
    return {
      totalClients,
      totalOutstanding,
      activeClients
    };
  }, [clients]);

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

  // 🎯 DEMO DATA - Auto-fill for quick testing
  const fillDemoData = () => {
    const randomNum = Math.floor(Math.random() * 1000);
    setFormData({
      clientName: `Demo Client ${randomNum}`,
      address: `${randomNum} Transport Street, Chennai`,
      email: `client${randomNum}@example.com`,
      gstin: `29ABCDE${randomNum}F1Z5`,
      phone: `98${String(randomNum).padStart(8, '0')}`,
      idProof: "PAN",
      idNumber: `ABCDE${randomNum}F`,
    });
  };

  const handleSave = async () => {
    const { clientName, address, email, gstin, phone, idProof, idNumber } = formData;
    if (!clientName || !address || !email || !gstin || !phone || !idProof || !idNumber) {
      setAlertSeverity("warning");
      setAlertMessage("Please enter all details.");
      setAlertOpen(true);
      return;
    }

    setSaving(true);
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
        setAlertSeverity("success");
        setAlertMessage("Client updated successfully!");
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
        setAlertSeverity("success");
        setAlertMessage("Client added successfully!");
      }
      setOpenDialog(false);
      setAlertOpen(true);
    } catch (e) {
      console.error("Save failed:", e);
      setAlertSeverity("error");
      setAlertMessage("Failed to save client.");
      setAlertOpen(true);
    } finally {
      setSaving(false);
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

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/${deleteTarget.id}`);
      setClients((list) => list.filter((c) => c.id !== deleteTarget.id));
      setSelected((sel) => sel.filter((x) => x !== deleteTarget.id));
      setAlertSeverity("success");
      setAlertMessage("Client deleted successfully!");
      setAlertOpen(true);
    } catch (e) {
      console.error("Delete failed:", e);
      setAlertSeverity("error");
      setAlertMessage("Failed to delete client.");
      setAlertOpen(true);
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

  const handleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelected(clients.map((c) => c.id));
    else setSelected([]);
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) {
      setAlertSeverity("warning");
      setAlertMessage("No clients selected for deletion.");
      setAlertOpen(true);
      return;
    }
    if (!window.confirm(`Delete ${selected.length} clients? This action cannot be undone.`)) return;
    
    setBulkDeleting(true);
    try {
      await axios.post(`${API}/bulk-delete`, { ids: selected });
      setClients((list) => list.filter((c) => !selected.includes(c.id)));
      setSelected([]);
      setAlertSeverity("success");
      setAlertMessage(`${selected.length} clients deleted successfully!`);
      setAlertOpen(true);
    } catch (e) {
      console.error("Bulk delete failed:", e);
      setAlertSeverity("error");
      setAlertMessage("Bulk delete failed.");
      setAlertOpen(true);
    } finally {
      setBulkDeleting(false);
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

  const cardStyle = {
    p: 3,
    mb: 3,
    borderRadius: 2,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
    background: "white",
  };

  const formatOutstanding = (client) => {
    const value = client?.outstanding ?? client?.pending_amount ?? client?.balance;
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
    return Number(value).toLocaleString("en-IN", { style: "currency", currency: "INR" });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
          Clients
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Manage client records, contact details, and outstanding amounts
        </Typography>
      </Box>

      {/* KPI Cards */}
      {loading ? (
        <LoadingSkeleton variant="cards" />
      ) : (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <KPICard
              title="Total Clients"
              value={kpis.totalClients}
              subtitle={`${kpis.activeClients} active`}
              color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              icon={People}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KPICard
              title="Outstanding Amount"
              value={formatOutstanding({ outstanding: kpis.totalOutstanding })}
              subtitle="Total pending payments"
              color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              icon={AccountBalance}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <KPICard
              title="Average Outstanding"
              value={formatOutstanding({ outstanding: kpis.totalClients > 0 ? kpis.totalOutstanding / kpis.totalClients : 0 })}
              subtitle="Per client"
              color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              icon={TrendingUp}
            />
          </Grid>
        </Grid>
      )}

      {/* Actions & Filters */}
      <Paper sx={cardStyle}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7} display="flex" gap={1} flexWrap="wrap">
            <Button variant="contained" color="primary" onClick={handleAddClick} disabled={saving || deleting}>
              Add Client
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleBulkDelete}
              disabled={selected.length === 0 || bulkDeleting}
            >
              Delete Selected
            </Button>
            <Button variant="outlined" color="secondary" onClick={fillDemoData} disabled={saving}>
              Fill Demo Data
            </Button>
          </Grid>
          <Grid item xs={12} md={5} display="flex" justifyContent="flex-end">
            <TextField
              fullWidth
              size="small"
              label="Search clients"
              placeholder="Search by name, email, GSTIN"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Clients Table */}
      <Paper sx={{ ...cardStyle, overflow: "hidden" }}>
        {loading ? (
          <LoadingSkeleton variant="table" rows={8} />
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>S.No</TableCell>
                  <TableCell padding="checkbox" sx={{ background: "#f8fafc" }}>
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < clients.length}
                      checked={clients.length > 0 && selected.length === clients.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>GSTIN</TableCell>
                  <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>ID Proof</TableCell>
                  <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>ID Number</TableCell>
                  <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Outstanding</TableCell>
                  <TableCell sx={{ background: "#f8fafc", fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <EmptyState
                        message="No clients found"
                        submessage="Try adjusting filters or add a new client."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((client, index) => (
                  <TableRow key={client.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(client.id)}
                        onChange={() => handleSelect(client.id)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{client.client_name}</TableCell>
                    <TableCell>{client.client_email}</TableCell>
                    <TableCell>{client.client_phone}</TableCell>
                    <TableCell>{client.client_gst}</TableCell>
                    <TableCell>{client.client_pan}</TableCell>
                    <TableCell sx={{ maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {client.client_type}
                    </TableCell>
                    <TableCell>{formatOutstanding(client)}</TableCell>
                    <TableCell>
                      <ActionButtons
                        onEdit={() => handleEdit(client)}
                        onDelete={() => handleDeleteClick(client.id, client.client_name)}
                        disabled={saving || deleting}
                        editTooltip="Edit Client"
                        deleteTooltip="Delete Client"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => !saving && setOpenDialog(false)} maxWidth="sm" fullWidth>
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
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={saving}
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
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="GSTIN"
                fullWidth
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Phone"
                fullWidth
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth disabled={saving}>
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
                disabled={saving}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="outlined" color="secondary" onClick={fillDemoData} disabled={saving}>
            Fill Demo Data
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : (editClient ? "Update Client" : "Save Client")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        title="Delete Client"
        message="Are you sure you want to delete this client?"
        itemName={deleteTarget?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />

      {/* Snackbar Alerts */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={4000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAlertOpen(false)}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientsPage;
