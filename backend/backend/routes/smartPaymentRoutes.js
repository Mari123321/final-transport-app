/**
 * Smart Payment Routes
 * 
 * Routes for the smart payment management system
 * - Client-driven date filtering
 * - No manual date entry
 * - Automatic status calculation
 */

import express from "express";
import {
  getClientsForPayment,
  getBillDatesForClient,
  getFilteredPayments,
  getFilteredPaymentSummary,
  addSmartPartialPayment,
  getPaymentTransactions,
  createPaymentFromInvoice,
  getInvoicesForClient,
  receiveInvoiceFromCreation,
  createTripPayment,
} from "../controllers/smartPaymentController.js";

const router = express.Router();

// ============================================================
// LOOKUP ENDPOINTS (for dropdowns)
// ============================================================

// Get all clients for dropdown
router.get("/clients", getClientsForPayment);

// Get bill dates for selected client (CRITICAL - no manual date entry)
router.get("/bill-dates", getBillDatesForClient);

// Get invoices for selected client
router.get("/invoices", getInvoicesForClient);

// ============================================================
// FILTERED DATA ENDPOINTS
// ============================================================

// Get payments filtered by client + date + status + mode
router.get("/", getFilteredPayments);

// Get summary for filtered payments
router.get("/summary", getFilteredPaymentSummary);

// ============================================================
// PAYMENT OPERATIONS
// ============================================================

// Create payment for trip (direct trip payment with validation)
router.post("/trip", createTripPayment);

// Create payment from invoice
router.post("/", createPaymentFromInvoice);

// Receive invoice created by invoice creation module
router.post("/from-invoice", receiveInvoiceFromCreation);

// Add partial payment (CRITICAL - recalculates balance)
router.post("/:id/partial", addSmartPartialPayment);

// Get payment transaction history
router.get("/:paymentId/transactions", getPaymentTransactions);

export default router;

