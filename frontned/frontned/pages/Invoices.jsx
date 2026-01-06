import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";

const InvoicePage = () => {
  const [clients, setClients] = useState([]);
  const [dates, setDates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingDates, setLoadingDates] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/clients")
      .then((res) => res.json())
      .then(setClients)
      .catch(console.error);
  }, []);

  // Fetch distinct trip dates for selected client
  useEffect(() => {
    if (!selectedClient) {
      setDates([]);
      setSelectedDate("");
      return;
    }
    setLoadingDates(true);
    fetch(`http://localhost:5000/api/bills/available-dates?clientId=${selectedClient}`)
      .then((res) => res.json())
      .then((data) => setDates(data?.dates || []))
      .catch((err) => {
        console.error(err);
        setDates([]);
      })
      .finally(() => setLoadingDates(false));
  }, [selectedClient]);

  // Generate invoice for selected client and date
  const handleGenerateInvoice = () => {
    if (!selectedClient || !selectedDate) {
      alert("Please select client and date");
      return;
    }
    fetch("http://localhost:5000/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: selectedClient, date: selectedDate }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "No invoice found");
          setInvoices([]);
          return;
        }
        const data = await res.json();
        setInvoices([data]);
      })
      .catch(() => {
        alert("Failed to fetch invoice");
        setInvoices([]);
      });
  };

  // Optional: Show all invoices, if endpoint is implemented in backend
  /*
  const handleShowAllInvoices = () => {
    fetch("http://localhost:5000/api/invoices")
      .then((res) => res.json())
      .then(setInvoices)
      .catch(() => alert("Failed to fetch invoices"));
  };
  */

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Invoice Management
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Client</InputLabel>
          <Select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            label="Client"
          >
            {clients.map((client) => (
              <MenuItem key={client.client_id} value={client.client_id}>
                {client.client_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Date</InputLabel>
          <Select
            value={selectedDate}
            disabled={!selectedClient || loadingDates}
            onChange={(e) => setSelectedDate(e.target.value)}
            label="Date"
          >
            <MenuItem value="">
              <em>
                {!selectedClient
                  ? "Select client first"
                  : loadingDates
                    ? "Loading dates..."
                    : "Select date"}
              </em>
            </MenuItem>
            {!loadingDates && selectedClient && dates.length === 0 && (
              <MenuItem disabled value="">
                <em>No dates found</em>
              </MenuItem>
            )}
            {dates.map((dateObj, idx) => (
              <MenuItem key={dateObj.iso || idx} value={dateObj.iso || dateObj}>
                {dateObj.display || new Date(dateObj.iso || dateObj).toLocaleDateString()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleGenerateInvoice}>
          Show Invoice
        </Button>
      </Box>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Invoice ID</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>Trips</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.invoice_id || invoice.id}>
                  <TableCell>{invoice.invoice_id || invoice.id}</TableCell>
                  <TableCell>{invoice.client?.client_name || invoice.client || "-"}</TableCell>
                  <TableCell>
                    {invoice.date ? new Date(invoice.date).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>₹{invoice.total_amount}</TableCell>
                  <TableCell>₹{invoice.amount_paid}</TableCell>
                  <TableCell>₹{invoice.pending_amount}</TableCell>
                  <TableCell>
                    {invoice.trips && invoice.trips.length > 0 ? (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Trip ID</TableCell>
                            <TableCell>Client</TableCell>
                            <TableCell>Driver</TableCell>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Dispatch Date</TableCell>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Min Qty</TableCell>
                            <TableCell>Actual Qty</TableCell>
                            <TableCell>Rate/Tonne</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Paid</TableCell>
                            <TableCell>Mode</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {invoice.trips.map((trip) => (
                            <TableRow key={trip.trip_id}>
                              <TableCell>{trip.trip_id}</TableCell>
                              <TableCell>{trip.client || '-'}</TableCell>
                              <TableCell>{trip.driver || '-'}</TableCell>
                              <TableCell>{trip.vehicle || '-'}</TableCell>
                              <TableCell>{trip.date ? new Date(trip.date).toLocaleDateString() : '-'}</TableCell>
                              <TableCell>{trip.dispatch_date ? new Date(trip.dispatch_date).toLocaleDateString() : '-'}</TableCell>
                              <TableCell>{trip.from_place}</TableCell>
                              <TableCell>{trip.to_place}</TableCell>
                              <TableCell>{trip.minimum_quantity}</TableCell>
                              <TableCell>{trip.actual_quantity}</TableCell>
                              <TableCell>{trip.rate_per_tonne}</TableCell>
                              <TableCell>₹{trip.amount}</TableCell>
                              <TableCell>₹{trip.amount_paid}</TableCell>
                              <TableCell>{trip.payment_mode}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      "No trips"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default InvoicePage;
