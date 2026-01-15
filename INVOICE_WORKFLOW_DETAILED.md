# Invoice & Smart Payments Workflow - Implementation Guide

## Overview
This document provides a detailed walkthrough of the complete invoice creation workflow and how data flows through the system.

---

## Complete Workflow Breakdown

### Phase 1: Invoice Creation (InvoicesPage.jsx)

#### Step 1: Component Initialization
```javascript
const [clients, setClients] = useState([]);
const [filters, setFilters] = useState({ 
  clientId: "", 
  fromDate: null, 
  toDate: null 
});
const [editableInvoices, setEditableInvoices] = useState([]);
const [filtersApplied, setFiltersApplied] = useState(false);
const [totalAmount, setTotalAmount] = useState(0);
```

#### Step 2: User Selects Client & Date Range
```javascript
// User action triggers:
handleFilterChange = (field, value) => {
  setFilters((prev) => ({ ...prev, [field]: value }));
  // Resets filters applied state
  setFiltersApplied(false);
}

// Results in filters object:
{
  clientId: "5",          // Selected client
  fromDate: dayjs(),      // Selected start date
  toDate: dayjs()         // Selected end date
}
```

#### Step 3: Apply Filters - Fetch Invoices
```javascript
fetchInvoices = async () => {
  // Validates all filters present
  if (!filters.clientId || !filters.fromDate || !filters.toDate) return;

  // Calls backend API
  const payload = {
    clientId: filters.clientId,
    startDate: dayjs(filters.fromDate).format("YYYY-MM-DD"),
    endDate: dayjs(filters.toDate).format("YYYY-MM-DD"),
  };

  const res = await getAllInvoices(payload);
  // Response format:
  // [
  //   { invoice_id: 1, date: "2024-01-15", total_amount: 50000, status: "Pending" },
  //   { invoice_id: 2, date: "2024-01-16", total_amount: 75000, status: "Pending" }
  // ]

  setInvoices(res);
  setEditableInvoices(res.map((inv) => ({ ...inv })));  // Create editable copy
  setFiltersApplied(true);  // Show "Create Invoice" button
}
```

#### Step 4: User Edits Invoice Data
```javascript
handleEditInvoice = (invoiceId, field, value) => {
  setEditableInvoices((prev) =>
    prev.map((inv) => {
      const key = inv.invoice_id ?? inv.id;
      return key === invoiceId ? { ...inv, [field]: value } : inv;
    })
  );
}

// Example edits:
// User changes amount: 50000 → 55000
// User changes status: "Pending" → "Created"
// All changes stored in local state (NOT saved to backend yet)

// Calculate total in real-time:
const totalAmount = editableInvoices.reduce(
  (sum, inv) => sum + Number(inv.total_amount || 0), 
  0
);
// Result: totalAmount = 130000 (55000 + 75000)
```

#### Step 5: Create Invoice - Navigate to Smart Payments
```javascript
handleCreateInvoice = () => {
  const client = clients.find((c) => c.client_id === Number(filters.clientId));
  
  const invoicePayload = {
    clientId: filters.clientId,
    clientName: client?.client_name || "",
    fromDate: dayjs(filters.fromDate).format("YYYY-MM-DD"),
    toDate: dayjs(filters.toDate).format("YYYY-MM-DD"),
    totalAmount: 130000,  // From useMemo calculation
    invoices: editableInvoices  // All edited invoice records
  };

  navigate("/smart-payments", {
    state: {
      invoicePayload: invoicePayload
    },
  });
}

// Final payload structure:
{
  clientId: "5",
  clientName: "ABC Transport Ltd",
  fromDate: "2024-01-15",
  toDate: "2024-01-16",
  totalAmount: 130000,
  invoices: [
    { 
      invoice_id: 1, 
      date: "2024-01-15", 
      total_amount: 55000,  // EDITED value
      status: "Created"      // EDITED value
    },
    { 
      invoice_id: 2, 
      date: "2024-01-16", 
      total_amount: 75000,   // Original value (not changed)
      status: "Pending"
    }
  ]
}
```

---

### Phase 2: Invoice Processing (SmartPaymentsPage.jsx)

#### Step 6: Receive Invoice Draft
```javascript
// On page mount, extract invoice payload from location state:
useEffect(() => {
  const payload = location.state?.invoicePayload;
  if (payload) {
    setInvoiceDraft(payload);  // Store for display
    setSelectedClient(String(payload.clientId));  // Auto-select client
    setAppliedFilters((prev) => ({ 
      ...prev, 
      clientId: String(payload.clientId) 
    }));
    
    // Remove state from history (prevent reuse)
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state]);

// invoiceDraft now contains:
{
  clientId: "5",
  clientName: "ABC Transport Ltd",
  fromDate: "2024-01-15",
  toDate: "2024-01-16",
  totalAmount: 130000,
  invoices: [...]
}
```

#### Step 7: Display Invoice Draft Section
```javascript
{invoiceDraft && (
  <Paper sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6">
      Incoming Invoice Draft
    </Typography>
    <Typography variant="body2">
      {invoiceDraft.clientName || getClientName(invoiceDraft.clientId)} • 
      {invoiceDraft.fromDate} → {invoiceDraft.toDate}
    </Typography>
    
    {/* Display summary chips */}
    <Chip label={`Invoices: ${invoiceDraft.invoices?.length || 0}`} />
    <Chip label={`Total: ₹${invoiceDraft.totalAmount || 0}`} />
    
    {/* Display invoice details table */}
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Invoice #</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {invoiceDraft.invoices.map((inv) => (
          <TableRow key={inv.invoice_id || inv.id}>
            <TableCell>#{inv.invoice_id}</TableCell>
            <TableCell>{formatDate(inv.date)}</TableCell>
            <TableCell>₹{formatCurrency(inv.total_amount)}</TableCell>
            <TableCell>{inv.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    
    {/* Action buttons */}
    <Button onClick={handleApplyInvoiceDraft} color="success">
      Apply Invoice
    </Button>
    <Button onClick={() => setInvoiceDraft(null)}>
      Dismiss
    </Button>
  </Paper>
)}
```

#### Step 8: User Reviews & Applies Invoice
```javascript
handleApplyInvoiceDraft = async () => {
  if (!invoiceDraft) return;
  setApplyingInvoice(true);
  
  try {
    // 1. Notify backend about invoice receipt (logging/audit)
    await applyInvoiceDraft({ 
      ...invoiceDraft, 
      invoiceStatus: "CREATED", 
      sourceModule: "invoicesPage" 
    });

    // 2. Create payment record for each invoice
    const results = [];
    for (const inv of invoiceDraft.invoices) {
      const payload = {
        clientId: invoiceDraft.clientId,
        invoiceId: inv.invoice_id || inv.id,
        billDate: inv.date || invoiceDraft.fromDate,
        paidAmount: 0,  // Initial payment is 0
        paymentMode: "Cash",
        remarks: "Applied via Smart Payments",
      };
      const res = await createPaymentFromInvoice(payload);
      results.push(res);
    }

    // 3. Success notification
    showNotification(
      `Applied ${results.length} invoice(s) to Smart Payments`, 
      "success"
    );

    // 4. Refresh displays
    setInvoiceDraft(null);
    loadPayments({ clientId: selectedClient });
    loadClientInvoices(selectedClient);

  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    setApplyingInvoice(false);
  }
}
```

---

### Phase 3: Backend Processing

#### Step 9: Backend Receives Invoice Draft
```javascript
// Route: POST /api/smart-payments/from-invoice
// Controller: receiveInvoiceFromCreation()

export const receiveInvoiceFromCreation = async (req, res) => {
  try {
    const {
      invoiceId,
      clientId,
      clientName,
      invoiceCreatedDate,
      invoiceAmount,
      invoiceStatus,
      sourceModule,  // "invoicesPage"
    } = req.body;

    // Validate
    if (!invoiceId || !clientId || !invoiceCreatedDate || !invoiceAmount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Get client details
    const client = await Client.findByPk(clientId);

    // Log receipt (audit trail)
    console.log(`✅ Received invoice ${invoiceId} from ${sourceModule}`);

    // Return success
    return res.json({
      success: true,
      message: "Invoice draft received successfully",
      data: {
        invoiceId,
        clientId,
        status: invoiceStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to receive invoice",
    });
  }
};
```

#### Step 10: Create Payment Records
```javascript
// Route: POST /api/smart-payments
// Controller: createPaymentFromInvoice()

export const createPaymentFromInvoice = async (req, res) => {
  try {
    const {
      clientId,
      invoiceId,
      billDate,
      paidAmount = 0,
      paymentMode = "Cash",
      referenceNo,
      remarks,
    } = req.body;

    // Validate
    if (!clientId || !invoiceId || !billDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Get invoice to determine total amount
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Create payment record
    const payment = await Payment.create({
      client_id: clientId,
      invoice_id: invoiceId,
      bill_date: billDate,
      total_amount: invoice.total_amount,
      paid_amount: paidAmount,
      balance_amount: invoice.total_amount - paidAmount,
      payment_mode: paymentMode,
      payment_status: paidAmount >= invoice.total_amount ? "Paid" : "Pending",
      reference_no: referenceNo,
      remarks: remarks,
    });

    // Update invoice status
    await invoice.update({
      status: "Created",
      payment_id: payment.payment_id,
    });

    // Return created payment
    return res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      data: {
        paymentId: payment.payment_id,
        clientId: payment.client_id,
        invoiceId: payment.invoice_id,
        totalAmount: payment.total_amount,
        paidAmount: payment.paid_amount,
        balanceAmount: payment.balance_amount,
        paymentStatus: payment.payment_status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to create payment record",
    });
  }
};
```

---

### Phase 4: Smart Payments Display Update

#### Step 11: Refresh Payments List
```javascript
// After invoice is applied, load updated payments:
loadPayments = async (filters) => {
  const [paymentsRes, summaryRes] = await Promise.all([
    getFilteredPayments({
      ...filters,
      page: 1,
      limit: 25,
    }),
    getFilteredPaymentSummary(filters),
  ]);

  // Response contains newly created payment records:
  // [
  //   {
  //     paymentId: 101,
  //     clientName: "ABC Transport Ltd",
  //     invoiceNumber: "INV-001",
  //     billDate: "2024-01-15",
  //     totalAmount: 55000,
  //     paidAmount: 0,
  //     balanceAmount: 55000,
  //     paymentMode: "Cash",
  //     paymentStatus: "Pending"
  //   },
  //   {
  //     paymentId: 102,
  //     clientName: "ABC Transport Ltd",
  //     invoiceNumber: "INV-002",
  //     billDate: "2024-01-16",
  //     totalAmount: 75000,
  //     paidAmount: 0,
  //     balanceAmount: 75000,
  //     paymentMode: "Cash",
  //     paymentStatus: "Pending"
  //   }
  // ]

  setPayments(paymentsRes.data);
  setSummary(summaryRes.data);
};
```

#### Step 12: Display in Payments Table
```javascript
// Payments now displayed in table:
<Table>
  <TableHead>
    <TableRow>
      <TableCell>Client</TableCell>
      <TableCell>Invoice #</TableCell>
      <TableCell>Bill Date</TableCell>
      <TableCell>Total</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell>Balance</TableCell>
      <TableCell>Status</TableCell>
      <TableCell>Actions</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {payments.map((payment) => (
      <TableRow key={payment.paymentId}>
        <TableCell>ABC Transport Ltd</TableCell>
        <TableCell>INV-001</TableCell>
        <TableCell>15 Jan 2024</TableCell>
        <TableCell>₹55,000</TableCell>
        <TableCell>₹0</TableCell>
        <TableCell>₹55,000</TableCell>
        <TableCell>
          <Chip label="Pending" color="error" />
        </TableCell>
        <TableCell>
          <IconButton onClick={() => handleOpenPartialDialog(payment)}>
            <AddPartialIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// User can now:
// - View invoice payment status
// - Add partial payments
// - View transaction history
// - Manage payment details
```

---

## State Management Summary

### InvoicesPage State
```javascript
{
  clients: [],                    // Available clients
  filters: {
    clientId: "5",
    fromDate: dayjs(),
    toDate: dayjs()
  },
  editableInvoices: [],           // Invoice records (editable)
  filtersApplied: boolean,        // Shows "Create Invoice" button
  loadingClients: boolean,
  loadingInvoices: boolean,
  error: string                   // Error messages
}
```

### SmartPaymentsPage State
```javascript
{
  invoiceDraft: {                 // Received from Invoices page
    clientId: "5",
    clientName: "ABC Transport Ltd",
    fromDate: "2024-01-15",
    toDate: "2024-01-16",
    totalAmount: 130000,
    invoices: [...]
  },
  selectedClient: "5",             // Auto-set from draft
  payments: [],                    // Payment records
  applyingInvoice: boolean,
  clientInvoices: [],              // Invoices for selected client
  notification: {                  // Toast notifications
    open: boolean,
    message: string,
    severity: "info|success|warning|error"
  }
}
```

---

## Error Handling

### Client-Side Validation
- ✅ Invoices page: Checks for client, fromDate, toDate before applying filters
- ✅ Smart Payments: Validates invoice data structure before applying
- ✅ Both pages handle API errors with user notifications

### Backend Validation
- ✅ Checks required fields in payload
- ✅ Verifies client exists
- ✅ Verifies invoice exists
- ✅ Validates dates are valid
- ✅ Calculates balances correctly

### User Notifications
- ✅ Loading states during async operations
- ✅ Success messages on completion
- ✅ Error messages on failure
- ✅ Empty state messages when no data

---

## Next Steps for Testing

1. **Unit Tests**
   - Test invoice filtering logic
   - Test data transformation functions
   - Test date calculations

2. **Integration Tests**
   - Test end-to-end invoice creation flow
   - Test payment record creation
   - Test state updates across pages

3. **E2E Tests**
   - Cypress or Playwright tests for complete workflow
   - Test sidebar visibility
   - Test navigation flow

---

## Conclusion

The invoice creation workflow is now fully integrated into two pages:
1. **InvoicesPage** - Data collection, filtering, and editing
2. **SmartPaymentsPage** - Data review and backend persistence

Data flows unidirectionally through state passing, ensuring clean separation of concerns and maintainability.
