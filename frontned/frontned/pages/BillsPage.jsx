// frontend/src/pages/BillsPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow,
  TableCell, Paper, IconButton, Switch, TextField, Button,
  Card, CardContent, Grid, Chip, TableContainer, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem
} from "@mui/material";
import {
  Delete as DeleteIcon,
  GetApp as GetAppIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  Add as AddIcon,
  Send as SendIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppDatePicker from "../components/common/AppDatePicker";

const API = "http://localhost:5000/api/invoices";

const BillsPage = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [editedRow, setEditedRow] = useState(null);
  const [editedMinQty, setEditedMinQty] = useState({});
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [filters, setFilters] = useState({
    clientId: "",
    startDate: "",
    endDate: ""
  });
  const [newBill, setNewBill] = useState({
    invoice_no: "",
    invoice_date: "",
    dispatch_date: "",
    client_id: "",
    vehicle_number: "",
    particulars: "",
    qty: "",
    min_charge_qty: "",
    rate: "",
    payment_status: "Pending"
  });
  const [summary, setSummary] = useState({
    totalBills: 0,
    paidBills: 0,
    pendingBills: 0,
    totalAmount: 0,
  });

  useEffect(() => { 
    fetchBills(); 
    fetchClients();
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [filters.clientId, filters.startDate, filters.endDate]);

  const fetchBills = async () => {
    try {
      let url = API;
      const params = [];
      if (filters.clientId) params.push(`clientId=${filters.clientId}`);
      if (filters.startDate) params.push(`startDate=${filters.startDate}`);
      if (filters.endDate) params.push(`endDate=${filters.endDate}`);
      if (params.length) url += `?${params.join("&")}`;

      const res = await axios.get(url);
      setBills(res.data);

      // Calculate summary
      const totalBills = res.data.length;
      const paidBills = res.data.filter(b => b.payment_status === "Paid").length;
      const pendingBills = totalBills - paidBills;
      const totalAmount = res.data.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

      setSummary({ totalBills, paidBills, pendingBills, totalAmount });
    } catch (err) {
      console.error("Error fetching bills:", err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/clients");
      setClients(res.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/vehicles");
      setVehicles(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  const handleCreateBill = async () => {
    try {
      if (!newBill.invoice_no || !newBill.invoice_date || !newBill.client_id) {
        alert("Please fill in required fields (Invoice No, Date, Client)");
        return;
      }

      await axios.post(API, newBill);
      alert("Bill created successfully!");
      setOpenCreateDialog(false);
      setNewBill({
        invoice_no: "",
        invoice_date: "",
        dispatch_date: "",
        client_id: "",
        vehicle_number: "",
        particulars: "",
        qty: "",
        min_charge_qty: "",
        rate: "",
        payment_status: "Pending"
      });
      fetchBills();
    } catch (err) {
      alert("Failed to create bill: " + (err.response?.data?.message || err.message));
    }
  };

  const handleMinQtyChange = (id, value) => {
    setEditedMinQty(prev => ({ ...prev, [id]: value }));
  };

  const saveMinQty = async (id) => {
    try {
      const minQtyNum = Number(editedMinQty[id]);
      if (isNaN(minQtyNum)) {
        alert("Please enter a valid number");
        return;
      }
      await axios.put(`${API}/${id}/min-charge`, { min_charge_qty: minQtyNum });
      setEditedRow(null);
      fetchBills();
    } catch (err) {
      alert("Failed to update minimum quantity");
    }
  };

  const handlePaymentStatusChange = async (id, status) => {
    try {
      await axios.put(`${API}/${id}/status`, { payment_status: status });
      fetchBills();
    } catch (err) {
      alert("Failed to update payment status");
    }
  };

  const deleteBill = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchBills();
    } catch (err) {
      alert("Failed to delete bill");
    }
  };

  const downloadPDF = (id) => {
    window.open(`${API}/${id}/pdf`, "_blank");
  };

  const handleForwardToInvoice = (billId) => {
    navigate(`/generate-invoice?forwardedBillId=${billId}`);
  };

  const clearFilters = () => {
    setFilters({ clientId: "", startDate: "", endDate: "" });
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ReceiptIcon sx={{ fontSize: 32, color: "#1976d2" }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
            Bills Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1.5,
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
          }}
        >
          Add New Bill
        </Button>
      </Box>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <FilterListIcon sx={{ color: "#64748b" }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#334155" }}>
            Filters
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Client</InputLabel>
              <Select
                value={filters.clientId}
                label="Client"
                onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
              >
                <MenuItem value="">All Clients</MenuItem>
                {clients.map(c => (
                  <MenuItem key={c.client_id || c.clientId} value={c.client_id || c.clientId}>
                    {c.client_name || c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <AppDatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(val) => setFilters(prev => ({ ...prev, startDate: val }))}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <AppDatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(val) => setFilters(prev => ({ ...prev, endDate: val }))}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              sx={{ height: "40px", textTransform: "none" }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Bills
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {summary.totalBills}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    All invoices
                  </Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(240, 147, 251, 0.4)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Paid Bills
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {summary.paidBills}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Completed
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(79, 172, 254, 0.4)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Pending Bills
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {summary.pendingBills}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Awaiting payment
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "white",
              boxShadow: "0 4px 20px rgba(250, 112, 154, 0.4)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Amount
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ₹{summary.totalAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Revenue
                  </Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bills Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <TableContainer>
          <Table sx={{ border: "1px solid #e2e8f0" }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Invoice No</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Min Charge Qty</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map((bill) => (
                <TableRow
                  key={bill.bill_id || bill.invoice_id}
                  sx={{
                    "&:hover": { backgroundColor: "#f1f5f9" },
                    transition: "all 0.2s ease"
                  }}
                >
                  <TableCell>{bill.invoice_no || "-"}</TableCell>
                  <TableCell>{bill.client?.client_name || "-"}</TableCell>
                  <TableCell>{bill.date || bill.invoice_date || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={bill.vehicle_number || "-"}
                      size="small"
                      sx={{
                        backgroundColor: "#e0f2fe",
                        color: "#0369a1",
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>{bill.qty || 0}</TableCell>
                  <TableCell>
                    {editedRow === (bill.bill_id || bill.invoice_id) ? (
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <TextField
                          size="small"
                          type="number"
                          value={editedMinQty[bill.bill_id || bill.invoice_id] || bill.min_charge_qty || ""}
                          onChange={(e) => handleMinQtyChange(bill.bill_id || bill.invoice_id, e.target.value)}
                          sx={{ width: 80 }}
                        />
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => saveMinQty(bill.bill_id || bill.invoice_id)}
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <span>{bill.min_charge_qty || 0}</span>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditedRow(bill.bill_id || bill.invoice_id);
                            setEditedMinQty({
                              [bill.bill_id || bill.invoice_id]: bill.min_charge_qty || 0
                            });
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>₹{Number(bill.rate || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: "#059669" }}>
                      ₹{Number(bill.total_amount || 0).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={bill.payment_status === "Paid"}
                      onChange={(e) =>
                        handlePaymentStatusChange(
                          bill.bill_id || bill.invoice_id,
                          e.target.checked ? "Paid" : "Pending"
                        )
                      }
                      color={bill.payment_status === "Paid" ? "success" : "warning"}
                    />
                    <Chip
                      label={bill.payment_status || "Pending"}
                      size="small"
                      color={bill.payment_status === "Paid" ? "success" : "warning"}
                      sx={{ ml: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleForwardToInvoice(bill.bill_id || bill.invoice_id)}
                        title="Forward to Generate Invoice"
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => downloadPDF(bill.bill_id || bill.invoice_id)}
                      >
                        <GetAppIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteBill(bill.bill_id || bill.invoice_id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Bill Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Bill</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                required
                value={newBill.invoice_no}
                onChange={(e) => setNewBill(prev => ({ ...prev, invoice_no: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <AppDatePicker
                label="Invoice Date"
                value={newBill.invoice_date}
                onChange={(val) => setNewBill(prev => ({ ...prev, invoice_date: val }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <AppDatePicker
                label="Dispatch Date"
                value={newBill.dispatch_date}
                onChange={(val) => setNewBill(prev => ({ ...prev, dispatch_date: val }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Client</InputLabel>
                <Select
                  value={newBill.client_id}
                  label="Client"
                  onChange={(e) => setNewBill(prev => ({ ...prev, client_id: e.target.value }))}
                >
                  {clients.map(c => (
                    <MenuItem key={c.client_id || c.clientId} value={c.client_id || c.clientId}>
                      {c.client_name || c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={newBill.vehicle_number}
                onChange={(e) => setNewBill(prev => ({ ...prev, vehicle_number: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Particulars"
                value={newBill.particulars}
                onChange={(e) => setNewBill(prev => ({ ...prev, particulars: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={newBill.qty}
                onChange={(e) => setNewBill(prev => ({ ...prev, qty: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Min Charge Qty"
                type="number"
                value={newBill.min_charge_qty}
                onChange={(e) => setNewBill(prev => ({ ...prev, min_charge_qty: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Rate"
                type="number"
                value={newBill.rate}
                onChange={(e) => setNewBill(prev => ({ ...prev, rate: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={newBill.payment_status}
                  label="Payment Status"
                  onChange={(e) => setNewBill(prev => ({ ...prev, payment_status: e.target.value }))}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateBill}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            Create Bill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillsPage;
