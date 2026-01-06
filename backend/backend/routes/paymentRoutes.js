import express from "express";
import {
  getAllPayments,
  getPaymentSummary,
  getPaymentById,
  createPayment,
  updatePayment,
  addPartialPayment,
  deletePayment,
  getClients,
  getInvoices,
  getAvailableDates,
} from "../controllers/paymentController.js";

const router = express.Router();

// Summary endpoint (must be before /:id)
router.get("/summary", getPaymentSummary);

// Lookup endpoints
router.get("/clients", getClients);
router.get("/invoices", getInvoices);
router.get("/available-dates", getAvailableDates);

// CRUD operations
router.get("/", getAllPayments);
router.get("/:id", getPaymentById);
router.post("/", createPayment);
router.put("/:id", updatePayment);
router.post("/:id/partial", addPartialPayment);
router.delete("/:id", deletePayment);

export default router;
