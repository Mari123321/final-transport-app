// frontend/src/pages/BillsPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow,
  TableCell, Paper, IconButton, Checkbox, Switch, TextField, Button,
  Card, CardContent, Grid, Chip, TableContainer
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
} from "@mui/icons-material";
import axios from "axios";

const API = "http://localhost:5000/api/invoices";

const BillsPage = () => {
  const [bills, setBills] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editedRow, setEditedRow] = useState(null);
  const [editedMinQty, setEditedMinQty] = useState({});
  const [summary, setSummary] = useState({
    totalBills: 0,
    paidBills: 0,
    pendingBills: 0,
    totalAmount: 0,
  });

  useEffect(() => { fetchBills(); }, []);

  const fetchBills = async () => {
    try {
      const res = await axios.get(API);
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

  const toggleSelect = (id) => {
    setSelected(prev => (
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    ));
  };

  const toggleSelectAll = () => {
    if (selected.length === bills.length) setSelected([]);
    else setSelected(bills.map(b => b.invoice_id || b.id));
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
      await axios.put(`${API}/${id}`, { min_charge_qty: minQtyNum });
      setEditedRow(null);
      fetchBills();
    } catch (err) {
      alert("Failed to update minimum quantity");
    }
  };

  const handlePaymentStatusChange = async (id, status) => {
    try {
      await axios.put(`${API}/${id}`, { payment_status: status });
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

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <ReceiptIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
          Bills Management
        </Typography>
      </Box>

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

      {/* Action Bar */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ color: "#334155", fontWeight: 600 }}>
          Bill Records
        </Typography>
        <Button
          variant="contained"
          color="error"
          disabled={!selected.length}
          onClick={async () => {
            await axios.post(`${API}/bulk-delete`, { ids: selected });
            fetchBills();
            setSelected([]);
          }}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Delete Selected ({selected.length})
        </Button>
      </Box>

      {/* Bills Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <TableContainer>
          <Table sx={{ border: "1px solid #e2e8f0" }}>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.length === bills.length && bills.length > 0}
                    indeterminate={selected.length > 0 && selected.length < bills.length}
                    onChange={toggleSelectAll}
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
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Min Charge Qty</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Rate/Tonne</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Payment Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <ReceiptIcon sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
                      <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
                        No bills found
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                        Bills will appear here once created
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((bill, idx) => {
                  const id = bill.invoice_id || bill.id;
                  const isEditing = editedRow === id;

                  return (
                    <TableRow
                      key={id}
                      selected={selected.includes(id)}
                      sx={{
                        "&:hover": { backgroundColor: "#f8fafc" },
                        transition: "background-color 0.2s",
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.includes(id)}
                          onChange={() => toggleSelect(id)}
                        />
                      </TableCell>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: "#1e293b" }}>
                        {bill.invoice_no || "-"}
                      </TableCell>
                      <TableCell sx={{ color: "#475569" }}>{bill.invoice_date || "-"}</TableCell>
                      <TableCell sx={{ color: "#475569" }}>{bill.dispatch_date || "-"}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: "#1e293b" }}>
                        {bill.client?.client_name || "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={bill.vehicle?.vehicle_number || "-"}
                          size="small"
                          sx={{ backgroundColor: "#e0e7ff", color: "#3730a3", fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "#475569" }}>{bill.particulars || "-"}</TableCell>
                      <TableCell sx={{ color: "#475569" }}>{bill.qty || 0}</TableCell>

                      <TableCell>
                        {isEditing ? (
                          <>
                            <TextField
                              type="number"
                              value={editedMinQty[id] ?? bill.min_charge_qty ?? 0}
                              size="small"
                              onChange={e => handleMinQtyChange(id, e.target.value)}
                              sx={{ width: "80px", mr: 1 }}
                            />
                            <IconButton color="success" onClick={() => saveMinQty(id)}>
                              <SaveIcon />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            {bill.min_charge_qty ?? 0}
                            <IconButton
                              size="small"
                              sx={{ ml: 1 }}
                              onClick={() => {
                                setEditedRow(id);
                                setEditedMinQty({ [id]: bill.min_charge_qty ?? 0 });
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>

                      <TableCell sx={{ color: "#475569" }}>₹{bill.rate || 0}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#059669" }}>
                        ₹{Number(bill.total_amount || 0).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Switch
                            checked={bill.payment_status === "Paid"}
                            onChange={(e) =>
                              handlePaymentStatusChange(id, e.target.checked ? "Paid" : "Pending")
                            }
                            color="primary"
                          />
                          <Chip
                            label={bill.payment_status || "Pending"}
                            size="small"
                            sx={{
                              backgroundColor:
                                bill.payment_status === "Paid" ? "#d1fae5" : "#fef3c7",
                              color: bill.payment_status === "Paid" ? "#065f46" : "#b45309",
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            onClick={() => deleteBill(id)}
                            title="Delete"
                            color="error"
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => downloadPDF(id)}
                            title="Download PDF"
                            color="primary"
                            size="small"
                          >
                            <GetAppIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default BillsPage;
