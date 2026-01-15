# 🔌 Invoice Creation - API Integration Guide

## Overview

This guide documents all API endpoints used by the Invoice Creation feature, including request/response formats, error handling, and integration points.

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/clients` | GET | Fetch all clients for dropdown | ✅ Existing |
| `/api/trips/filter` | GET | Fetch trips by client + date range | ✅ Existing |
| `/api/invoices` | POST | Create invoice from trips | ✅ New |
| `/api/smart-payments/from-invoice` | POST | Notify Smart Payment of new invoice | ✅ New |

---

## 1. Fetch Clients

### Endpoint
```
GET /api/clients
```

### Purpose
Load all clients for the client dropdown filter

### Request
```bash
GET http://localhost:5000/api/clients
```

### Response (200 OK)
```json
[
  {
    "client_id": 1,
    "client_name": "ABC Logistics",
    "client_phone": "9876543210",
    "client_email": "contact@abc.com"
  },
  {
    "client_id": 3,
    "client_name": "Client 3 Logistics",
    "client_phone": "8765432109",
    "client_email": "client3@example.com"
  }
]
```

### Error Response (500)
```json
{
  "error": "Failed to fetch clients",
  "detail": "Connection refused"
}
```

### Frontend Usage
```javascript
const fetchClients = async () => {
  setClientsLoading(true);
  try {
    const response = await axios.get("http://localhost:5000/api/clients");
    setClients(response.data || []);
  } catch (err) {
    toast.error("Failed to load clients");
  } finally {
    setClientsLoading(false);
  }
};
```

---

## 2. Fetch Filtered Trips

### Endpoint
```
GET /api/trips/filter
```

### Purpose
Fetch all trips matching the client and date range filters

### Request Parameters
```
clientId: number (required)
startDate: string YYYY-MM-DD (optional)
endDate: string YYYY-MM-DD (optional)
```

### Example Request
```bash
GET http://localhost:5000/api/trips/filter?clientId=3&startDate=2026-01-01&endDate=2026-01-31
```

### Response (200 OK)
```json
{
  "trips": [
    {
      "trip_id": 1,
      "client_id": 3,
      "date": "2026-01-10",
      "dispatch_date": "2026-01-10",
      "from_place": "Bangalore",
      "to_place": "Mumbai",
      "minimum_quantity": 10,
      "actual_quantity": 15.5,
      "rate_per_tonne": 800,
      "amount": 12400,
      "amount_paid": 5000,
      "payment_mode": "Cash",
      "client": {
        "client_id": 3,
        "client_name": "Client 3 Logistics"
      },
      "vehicle": {
        "vehicle_id": 5,
        "vehicle_number": "KA-01-AB-1234"
      },
      "driver": {
        "driver_id": 2,
        "name": "Raj Kumar"
      }
    },
    // ... more trips
  ],
  "summary": {
    "totalAmount": 125000,
    "totalPaid": 45000,
    "totalPending": 80000
  }
}
```

### Error Response (404)
```json
{
  "error": "No trips found for the selected filters"
}
```

### Frontend Usage
```javascript
const fetchFilteredTrips = async (clientId, fromDate, toDate) => {
  setApplyingFilters(true);
  try {
    const params = {
      clientId,
      startDate: fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : null,
      endDate: toDate ? dayjs(toDate).format("YYYY-MM-DD") : null,
    };
    
    const response = await axios.get(
      "http://localhost:5000/api/trips/filter",
      { params }
    );
    
    const { trips = [], summary = {} } = response.data;
    
    if (!trips || trips.length === 0) {
      toast.warning("No trips found for selected filters");
      return false;
    }
    
    setFilteredTrips(trips);
    setSummary({
      totalTrips: trips.length,
      totalAmount: summary.totalAmount || 0,
      paidAmount: summary.totalPaid || 0,
      pendingAmount: summary.totalPending || 0,
    });
    
    return true;
  } catch (err) {
    toast.error("Failed to fetch trips");
    return false;
  } finally {
    setApplyingFilters(false);
  }
};
```

---

## 3. Create Invoice from Trips

### Endpoint
```
POST /api/invoices
```

### Purpose
Create a new invoice from selected trips with automatic Smart Payment notification

### Request Body
```json
{
  "client_id": 3,
  "date": "2026-01-10",
  "trip_ids": [1, 2, 3, 4]
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| client_id | number | Yes | ID of the client for the invoice |
| date | string | Yes | Invoice date (YYYY-MM-DD format) |
| trip_ids | array | Yes | Array of trip IDs to include in invoice |

### Response (201 Created)
```json
{
  "success": true,
  "invoice": {
    "invoice_id": 42,
    "invoice_number": "INV-202601-9287",
    "client_id": 3,
    "client_name": "Client 3 Logistics",
    "date": "2026-01-10",
    "invoiceCreatedDate": "2026-01-13",
    "total_amount": 125000.50,
    "amount_paid": 45000.00,
    "pending_amount": 80000.50,
    "payment_status": "Unpaid",
    "trip_count": 4,
    "trips": [
      {
        "trip_id": 1,
        "date": "2026-01-10",
        "dispatch_date": "2026-01-10",
        "from_place": "Bangalore",
        "to_place": "Mumbai",
        "vehicle": "KA-01-AB-1234",
        "driver": "Raj Kumar",
        "actual_quantity": 15.5,
        "rate_per_tonne": 800,
        "amount": 12400,
        "amount_paid": 5000,
        "payment_mode": "Cash"
      },
      // ... more trips
    ]
  },
  "message": "Invoice created successfully"
}
```

### Error Response (400 - Missing Trips)
```json
{
  "success": false,
  "error": "At least one trip must be selected",
  "detail": "trip_ids array cannot be empty"
}
```

### Error Response (400 - Client Mismatch)
```json
{
  "success": false,
  "error": "All selected trips must belong to the same client",
  "detail": "Trip IDs do not all match the provided client_id"
}
```

### Error Response (500 - Server Error)
```json
{
  "success": false,
  "error": "Failed to create invoice",
  "detail": "Connection to database failed"
}
```

### Frontend Usage
```javascript
const createInvoice = async () => {
  setCreatingInvoice(true);
  setError("");

  try {
    const invoicePayload = {
      client_id: parseInt(filters.clientId),
      date: dayjs(filters.fromDate).format("YYYY-MM-DD"),
      trip_ids: filteredTrips.map((trip) => trip.trip_id),
    };

    const invoiceResponse = await axios.post(
      "http://localhost:5000/api/invoices",
      invoicePayload
    );

    if (!invoiceResponse.data || !invoiceResponse.data.invoice) {
      throw new Error("Invalid invoice response from server");
    }

    const invoice = invoiceResponse.data.invoice;

    // Notify Smart Payment (see next endpoint)
    await notifySmartPayment(invoice);

    toast.success(
      `✅ Invoice #${invoice.invoice_id} created successfully!`
    );

    handleCancel();
  } catch (err) {
    const errorMsg =
      err.response?.data?.error ||
      err.response?.data?.detail ||
      "Failed to create invoice";
    setError(errorMsg);
    toast.error(errorMsg);
  } finally {
    setCreatingInvoice(false);
  }
};
```

---

## 4. Notify Smart Payment

### Endpoint
```
POST /api/smart-payments/from-invoice
```

### Purpose
Send invoice details to Smart Payment system for payment tracking

### Request Body
```json
{
  "invoiceId": 42,
  "clientId": 3,
  "clientName": "Client 3 Logistics",
  "invoiceCreatedDate": "2026-01-13",
  "invoiceAmount": 125000.50,
  "invoiceStatus": "CREATED",
  "sourceModule": "invoiceCreation"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| invoiceId | number | Yes | ID of created invoice |
| clientId | number | Yes | ID of the client |
| clientName | string | Yes | Name of the client |
| invoiceCreatedDate | string | Yes | Creation date (YYYY-MM-DD) |
| invoiceAmount | number | Yes | Total invoice amount |
| invoiceStatus | string | Yes | Status ("CREATED") |
| sourceModule | string | Yes | Source ("invoiceCreation") |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Invoice 42 successfully loaded in Smart Payment system",
  "data": {
    "invoiceId": 42,
    "clientId": 3,
    "clientName": "Client 3 Logistics",
    "invoiceCreatedDate": "2026-01-10",
    "totalAmount": 125000.50,
    "paidAmount": 45000.00,
    "pendingAmount": 80000.50,
    "paymentStatus": "Unpaid",
    "sourceModule": "invoiceCreation",
    "timestamp": "2026-01-13T10:30:00Z"
  },
  "note": "Invoice is now available under 'Invoices created by requesting client' in Smart Payments"
}
```

### Error Response (404 - Invoice Not Found)
```json
{
  "success": false,
  "error": "Invoice not found in system",
  "detail": "Invoice with ID 42 does not exist"
}
```

### Error Response (400 - Client Mismatch)
```json
{
  "success": false,
  "error": "Client mismatch",
  "detail": "Invoice 42 does not belong to client 3"
}
```

### Error Response (500 - Server Error)
```json
{
  "success": false,
  "error": "Failed to process invoice",
  "detail": "Database connection error"
}
```

### Frontend Usage
```javascript
const notifySmartPayment = async (invoice) => {
  const selectedClient = clients.find(
    (c) => c.client_id === invoice.client_id
  );

  const smartPaymentPayload = {
    invoiceId: invoice.invoice_id,
    clientId: invoice.client_id,
    clientName: invoice.client_name || selectedClient?.client_name,
    invoiceCreatedDate: dayjs().format("YYYY-MM-DD"),
    invoiceAmount: invoice.total_amount,
    invoiceStatus: "CREATED",
    sourceModule: "invoiceCreation",
  };

  try {
    await axios.post(
      "http://localhost:5000/api/smart-payments/from-invoice",
      smartPaymentPayload
    );
    toast.info("Invoice added to Smart Payments system");
  } catch (smartPaymentErr) {
    console.warn("Smart Payment sync warning:", smartPaymentErr.response?.data);
    toast.warning("Invoice created but Smart Payment sync had an issue");
  }
};
```

---

## Complete Integration Example

### Full Invoice Creation Flow
```javascript
const handleCreateInvoiceClick = () => {
  // Step 1: Show confirmation
  setConfirmDialog({
    open: true,
    title: "Confirm Invoice Creation",
    message: `Create invoice for ${selectedClientName} with ${filteredTrips.length} trips?`,
    onConfirm: createInvoice,
  });
};

const createInvoice = async () => {
  setCreatingInvoice(true);

  try {
    // Step 2: Create invoice
    console.log("📝 Creating invoice...");
    const invoiceResponse = await axios.post(
      "http://localhost:5000/api/invoices",
      {
        client_id: parseInt(filters.clientId),
        date: dayjs(filters.fromDate).format("YYYY-MM-DD"),
        trip_ids: filteredTrips.map((trip) => trip.trip_id),
      }
    );

    const invoice = invoiceResponse.data.invoice;
    console.log(`✅ Invoice created: #${invoice.invoice_id}`);

    // Step 3: Notify Smart Payment
    console.log("📤 Notifying Smart Payment...");
    try {
      await axios.post(
        "http://localhost:5000/api/smart-payments/from-invoice",
        {
          invoiceId: invoice.invoice_id,
          clientId: invoice.client_id,
          clientName: invoice.client_name,
          invoiceCreatedDate: dayjs().format("YYYY-MM-DD"),
          invoiceAmount: invoice.total_amount,
          invoiceStatus: "CREATED",
          sourceModule: "invoiceCreation",
        }
      );
      console.log("✅ Smart Payment notified");
      toast.info("Invoice added to Smart Payments");
    } catch (spErr) {
      console.warn("⚠️ Smart Payment warning:", spErr.response?.data);
      toast.warning("Created but Smart Payment sync had an issue");
    }

    // Step 4: Show success
    toast.success(`✅ Invoice #${invoice.invoice_id} created successfully!`);

    // Step 5: Reset
    handleCancel();
  } catch (err) {
    console.error("❌ Error creating invoice:", err);
    const errorMsg = err.response?.data?.error || "Failed to create invoice";
    setError(errorMsg);
    toast.error(errorMsg);
  } finally {
    setCreatingInvoice(false);
  }
};
```

---

## Testing with cURL

### Test 1: Fetch Clients
```bash
curl -X GET http://localhost:5000/api/clients
```

### Test 2: Fetch Trips
```bash
curl -X GET "http://localhost:5000/api/trips/filter?clientId=3&startDate=2026-01-01&endDate=2026-01-31"
```

### Test 3: Create Invoice
```bash
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 3,
    "date": "2026-01-10",
    "trip_ids": [1, 2, 3, 4]
  }'
```

### Test 4: Notify Smart Payment
```bash
curl -X POST http://localhost:5000/api/smart-payments/from-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": 42,
    "clientId": 3,
    "clientName": "Client 3 Logistics",
    "invoiceCreatedDate": "2026-01-13",
    "invoiceAmount": 125000.50,
    "invoiceStatus": "CREATED",
    "sourceModule": "invoiceCreation"
  }'
```

---

## Testing with Postman

### Setup Collection
1. Import endpoints as shown above
2. Set base URL: `http://localhost:5000`
3. Create environment variable: `{{base_url}}`
4. Replace URLs with: `{{base_url}}/api/...`

### Test Order
1. ✅ GET /api/clients (verify clients exist)
2. ✅ GET /api/trips/filter (verify trips exist)
3. ✅ POST /api/invoices (create invoice)
4. ✅ POST /api/smart-payments/from-invoice (notify)

---

## Error Handling Strategy

### Frontend
```javascript
try {
  // API call
} catch (err) {
  const errorMsg = 
    err.response?.data?.error ||           // Backend message
    err.response?.data?.detail ||          // Backend detail
    err.message ||                          // Network error
    "Unknown error occurred";               // Fallback
  
  setError(errorMsg);
  toast.error(errorMsg);
}
```

### Backend
```javascript
try {
  // Business logic
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({
    success: false,
    error: "User-friendly message",
    detail: error.message                   // For debugging
  });
}
```

---

## Rate Limiting

No rate limiting currently implemented. Consider adding if endpoint receives high traffic.

---

## Authentication

Currently no authentication required. Add as needed:
```javascript
const response = await api.get(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## CORS Configuration

Endpoints should be configured to accept requests from:
- `http://localhost:5173` (Frontend dev)
- `http://localhost:3000` (Alternative frontend)
- Add production URLs as needed

---

## API Versioning

Current version: `v1` (implied)
Future versions: Consider adding `/api/v2/invoices` when making breaking changes

---

## Monitoring & Logging

### Backend Logging
```javascript
console.log(`✅ Invoice ${invoiceId} created for client ${clientId}`);
console.log(`📤 Notifying Smart Payment for invoice ${invoiceId}`);
console.error(`❌ Failed to create invoice:`, error);
```

### Frontend Logging
Check browser console for:
- API request/response
- State changes
- Error messages
- User actions

---

**Last Updated**: January 13, 2026
**Status**: ✅ Production Ready
**Version**: 1.0
