import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Card,
  CardContent,
  Grid,
  Chip,
  TableContainer,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  GetApp as GetAppIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import AppDatePicker from "../components/common/AppDatePicker";

const toISODate = (str) => {
  if (!str) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  return str;
};

const numberOrZero = (v) => {
  const n = typeof v === "string" ? v.trim() : v;
  const parsed = parseFloat(n);
  return Number.isFinite(parsed) ? parsed : 0;
};

const GenerateInvoicePage = () => {
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [forwardedBill, setForwardedBill] = useState(null);
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    avgAmount: 0,
  });

  // New state for available dates
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [dateError, setDateError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState({
    invoiceNo: "",
    invoiceDate: "",
    selectedDate: "", // NEW: dropdown selected date
    dispatchDate: "",
    clientId: "",
    vehicleId: "",
    particulars: "",
    actualQty: "",
    minChargeQty: "",
    ratePerTonne: "",
    totalAmount: "0.00",
  });

  // Check for forwarded bill from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const billId = params.get('forwardedBillId');
    if (billId) {
      fetchForwardedBill(billId);
    }
  }, [location.search]);

  // NEW: Fetch available dates when client is selected
  useEffect(() => {
    if (data.clientId) {
      fetchAvailableDates(data.clientId);
    } else {
      setAvailableDates([]);
      setDateError("");
      // Reset selected date when client changes
      setData(prev => ({ ...prev, selectedDate: "" }));
    }
  }, [data.clientId]);

  const fetchForwardedBill = async (billId) => {
    try {
      const res = await api.get(`/api/invoices/${billId}`);
      const bill = res.data;
      setForwardedBill(bill);
      setData({
        invoiceNo: bill.invoice_no || "",
        invoiceDate: bill.invoice_date || bill.date || "",
        selectedDate: "",
        dispatchDate: bill.dispatch_date || "",
        clientId: bill.client_id || "",
        vehicleId: bill.vehicle_id || "",
        particulars: bill.particulars || "",
        actualQty: bill.qty || "",
        minChargeQty: bill.min_charge_qty || "",
        ratePerTonne: bill.rate || "",
        totalAmount: bill.total_amount || "0.00",
      });
      setOpenForm(true);
    } catch (err) {
      console.error("Error fetching forwarded bill:", err);
      alert("Failed to load bill details");
    }
  };

  // NEW: Fetch available dates for selected client
  const fetchAvailableDates = async (clientId) => {
    setLoadingDates(true);
    setDateError("");
    try {
      const res = await api.get(`/api/invoices/available-dates/${clientId}`);
      const { dates, message } = res.data;
      
      if (!dates || dates.length === 0) {
        setAvailableDates([]);
        setDateError(message || "No billable records found for this client");
      } else {
        setAvailableDates(dates);
        setDateError("");
      }
    } catch (err) {
      console.error("Error fetching available dates:", err);
      setDateError("Failed to load available dates");
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/clients");
        setClients(Array.isArray(res.data) ? res.data : res.data.data || []);
      } catch (err) {
        console.error("Error fetching clients:", err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/vehicles");
        let vehiclesArr = [];
        if (Array.isArray(res.data)) vehiclesArr = res.data;
        else if (res.data && Array.isArray(res.data.data)) vehiclesArr = res.data.data;
        setVehicles(vehiclesArr);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setVehicles([]);
      }
    })();
  }, []);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      let url = "/api/invoices";
      const params = [];
      if (data.clientId) params.push(`clientId=${data.clientId}`);
      if (data.vehicleId) params.push(`vehicleId=${data.vehicleId}`);
      if (params.length) url += `?${params.join("&")}`;

      const res = await api.get(url);
      const invoiceData = Array.isArray(res.data) ? res.data : res.data.data || [];
      setInvoices(invoiceData);

      // Calculate summary
      const totalInvoices = invoiceData.length;
      const totalAmount = invoiceData.reduce((sum, inv) => sum + (Number(inv.total_amount || inv.totalAmount) || 0), 0);
      const avgAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      setSummary({ totalInvoices, totalAmount, avgAmount });
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [data.clientId, data.vehicleId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "clientId" || name === "vehicleId") {
        updated[name] = value === "" ? "" : Number(value);
      }
      // When selectedDate is chosen, auto-populate invoiceDate
      if (name === "selectedDate" && value) {
        // Convert display format (DD-MM-YYYY) to ISO format (YYYY-MM-DD) for invoiceDate
        updated.invoiceDate = value;
      }
      if (name === "actualQty" && (prev.minChargeQty === "" || prev.minChargeQty === null)) {
        updated.minChargeQty = value;
      }
      if (["actualQty", "minChargeQty", "ratePerTonne"].includes(name)) {
        const actual = numberOrZero(name === "actualQty" ? value : updated.actualQty);
        const minCharge = numberOrZero(name === "minChargeQty" ? value : updated.minChargeQty);
        const rate = numberOrZero(name === "ratePerTonne" ? value : updated.ratePerTonne);
        const chargeQty = Math.max(actual, minCharge);
        updated.totalAmount = (chargeQty * rate).toFixed(2);
      }
      return updated;
    });
  };

  const resetForm = () =>
    setData({
      invoiceNo: "",
      invoiceDate: "",
      selectedDate: "",
      dispatchDate: "",
      clientId: "",
      vehicleId: "",
      particulars: "",
      actualQty: "",
      minChargeQty: "",
      ratePerTonne: "",
      totalAmount: "0.00",
    });

  const handleSubmit = async () => {
    if (data.clientId === "" || isNaN(data.clientId)) {
      alert("Please select a client.");
      return;
    }
    if (!data.selectedDate) {
      alert("Please select an available date.");
      return;
    }
    if (data.vehicleId === "" || isNaN(data.vehicleId)) {
      alert("Please select a vehicle.");
      return;
    }

    try {
      const actualQtyNum = numberOrZero(data.actualQty);
      const minChargeQtyNum = data.minChargeQty === "" || data.minChargeQty === null ? actualQtyNum : numberOrZero(data.minChargeQty);
      const ratePerTonneNum = numberOrZero(data.ratePerTonne);
      const chargeQty = Math.max(actualQtyNum, minChargeQtyNum);
      const computedTotal = (chargeQty * ratePerTonneNum).toFixed(2);

      const payload = {
        invoice_no: data.invoiceNo,
        invoice_date: toISODate(data.selectedDate),
        dispatch_date: data.dispatchDate ? toISODate(data.dispatchDate) : toISODate(data.selectedDate),
        client_id: data.clientId,
        vehicle_id: data.vehicleId,
        particulars: data.particulars,
        qty: actualQtyNum,
        min_charge_qty: minChargeQtyNum,
        rate: ratePerTonneNum,
        total_amount: computedTotal,
      };

      const response = await api.post("/api/invoices", payload);

      if (response.status === 201 || response.status === 200) {
        alert("Invoice generated successfully!");
        await fetchInvoices();
        setOpenForm(false);
        resetForm();
      } else {
        alert("Failed to generate invoice. Try again.");
      }
    } catch (e) {
      console.error("Error generating invoice:", e);
      alert("Error generating invoice. Check console for details.");
    }
  };

  const toggleSelectInvoice = (invoiceId) => {
    setSelectedInvoices((prev) => {
      if (prev.includes(invoiceId)) {
        return prev.filter((id) => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) {
      alert("Please select at least one invoice to delete.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedInvoices.length} invoices?`)) return;

    try {
      await api.delete("/api/invoices/bulk-delete", { data: { invoiceIds: selectedInvoices } });
      alert(`${selectedInvoices.length} invoices deleted successfully.`);
      setSelectedInvoices([]);
      await fetchInvoices();
    } catch (err) {
      console.error("Error during bulk delete:", err);
      alert("Failed to delete invoices.");
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <DescriptionIcon sx={{ fontSize: 32, color: "#1976d2" }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
            Generate Invoice
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenForm(true)}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            New Invoice
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/bills")}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            View Bills
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={selectedInvoices.length === 0}
            onClick={handleBulkDelete}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Delete ({selectedInvoices.length})
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
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
                    Total Invoices
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {summary.totalInvoices}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Generated
                  </Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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

        <Grid item xs={12} sm={6} md={4}>
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
                    Average Amount
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ₹{summary.avgAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: "block" }}>
                    Per invoice
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoice Creation Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Invoice</DialogTitle>
        <DialogContent dividers>
          {/* Client Select */}
          <FormControl fullWidth margin="normal" required>
            <InputLabel shrink>Client *</InputLabel>
            <Select
              name="clientId"
              value={data.clientId}
              onChange={handleChange}
              displayEmpty
              required
            >
              <MenuItem value="">
                <em>Select client</em>
              </MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.client_id || c.id} value={Number(c.client_id || c.id)}>
                  {c.client_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* NEW: Available Dates Dropdown */}
          <FormControl 
            fullWidth 
            margin="normal" 
            required 
            disabled={!data.clientId || loadingDates}
          >
            <InputLabel shrink>Available Dates *</InputLabel>
            <Select
              name="selectedDate"
              value={data.selectedDate}
              onChange={handleChange}
              displayEmpty
              required
            >
              <MenuItem value="">
                <em>
                  {loadingDates 
                    ? "Loading dates..." 
                    : dateError 
                      ? "No dates available"
                      : "Select date"}
                </em>
              </MenuItem>
              {availableDates.map((dateObj) => (
                <MenuItem 
                  key={dateObj.iso} 
                  value={dateObj.iso}
                  title={`Trips available for ${dateObj.display}`}
                >
                  {dateObj.display}
                </MenuItem>
              ))}
            </Select>
            {dateError && (
              <Typography variant="caption" sx={{ color: "#d32f2f", mt: 0.5, display: "block" }}>
                {dateError}
              </Typography>
            )}
          </FormControl>

          {/* Vehicle Select */}
          <FormControl fullWidth margin="normal" required>
            <InputLabel shrink>Vehicle *</InputLabel>
            <Select
              name="vehicleId"
              value={data.vehicleId}
              onChange={handleChange}
              displayEmpty
              required
            >
              <MenuItem value="">
                <em>Select vehicle</em>
              </MenuItem>
              {vehicles.map((v) => (
                <MenuItem key={v.vehicle_id || v.id} value={Number(v.vehicle_id || v.id)}>
                  {v.vehicle_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Other Fields */}
          <FormControl fullWidth margin="normal">
            <TextField label="Invoice Number" name="invoiceNo" value={data.invoiceNo} onChange={handleChange} />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <AppDatePicker
              label="Dispatch Date"
              value={data.dispatchDate}
              onChange={(val) => handleChange({ target: { name: 'dispatchDate', value: val ? val.format("YYYY-MM-DD") : "" } })}
              fullWidth
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField label="Particulars" name="particulars" value={data.particulars} onChange={handleChange} />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              type="number"
              label="Actual Quantity"
              name="actualQty"
              value={data.actualQty}
              onChange={handleChange}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              type="number"
              label="Minimum Charge Quantity"
              name="minChargeQty"
              placeholder="Defaults to Actual Quantity"
              value={data.minChargeQty === "" ? data.actualQty : data.minChargeQty}
              onChange={handleChange}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              type="number"
              label="Rate Per Tonne"
              name="ratePerTonne"
              value={data.ratePerTonne}
              onChange={handleChange}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </FormControl>
          <Typography variant="h6" mt={2}>
            Total Amount: ₹{data.totalAmount || "0.00"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Generate</Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0" }}>
          <Typography variant="h6" sx={{ color: "#334155", fontWeight: 600 }}>
            Generated Invoices
          </Typography>
        </Box>
        {loadingInvoices ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography sx={{ color: "#64748b" }}>Loading invoices...</Typography>
          </Box>
        ) : invoices.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <DescriptionIcon sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
              No invoices generated yet
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              Click "New Invoice" to create your first invoice
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < invoices.length}
                      checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(invoices.map(inv => inv.invoice_id || inv.id));
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>S.No</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Invoice No</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Invoice Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Dispatch Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Vehicle</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Particulars</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Actual Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Min. Charge Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Rate/Tonne</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv, idx) => {
                  const clientName =
                    inv.client?.client_name ||
                    clients.find(c => (c.client_id || c.id) === inv.clientId)?.client_name ||
                    "-";
                  const vehicleNum =
                    inv.vehicle?.vehicle_number ||
                    vehicles.find(v => (v.vehicle_id || v.id) === inv.vehicleId)?.vehicle_number ||
                    "-";

                  const invId = inv.invoice_id || inv.id;
                  return (
                    <TableRow
                      key={invId}
                      hover
                      sx={{
                        "&:hover": { backgroundColor: "#f8fafc" },
                        transition: "background-color 0.2s",
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedInvoices.includes(invId)}
                          onChange={() => toggleSelectInvoice(invId)}
                        />
                      </TableCell>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: "#1e293b" }}>
                        {inv.invoice_no}
                      </TableCell>
                      <TableCell sx={{ color: "#475569" }}>{inv.invoice_date}</TableCell>
                      <TableCell sx={{ color: "#475569" }}>{inv.dispatch_date}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: "#1e293b" }}>
                        {clientName}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vehicleNum}
                          size="small"
                          sx={{ backgroundColor: "#e0e7ff", color: "#3730a3", fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "#475569" }}>{inv.particulars}</TableCell>
                      <TableCell sx={{ color: "#475569" }}>{inv.qty ?? inv.actual_qty}</TableCell>
                      <TableCell sx={{ color: "#475569" }}>{inv.min_charge_qty}</TableCell>
                      <TableCell sx={{ color: "#475569" }}>
                        ₹{inv.rate ?? inv.rate_per_tonne}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#059669" }}>
                        ₹{Number((inv.totalAmount ?? inv.total_amount) || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<GetAppIcon />}
                          onClick={() => window.open(`http://localhost:5000/api/invoices/${invId}/pdf`, "_blank")}
                          sx={{ textTransform: "none" }}
                        >
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Forwarded Bill Alert */}
      {forwardedBill && (
        <Dialog open={!!forwardedBill} onClose={() => setForwardedBill(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Bill Forwarded</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Bill details have been pre-filled. Review and generate the invoice.
            </Alert>
            <Typography variant="body2">
              <strong>Invoice No:</strong> {forwardedBill.invoice_no}
            </Typography>
            <Typography variant="body2">
              <strong>Client:</strong> {forwardedBill.client?.client_name || "-"}
            </Typography>
            <Typography variant="body2">
              <strong>Amount:</strong> ₹{Number(forwardedBill.total_amount || 0).toLocaleString()}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setForwardedBill(null)}>OK</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default GenerateInvoicePage;
