import express from 'express';
import { 
  getAllBills, 
  createBill, 
  updateBill, 
  deleteBill,
  updatePaymentStatus, 
  updateMinChargeQty,
  downloadBillPDF,
  getAvailableDates 
} from '../controllers/billController.js';
import { generateInvoicePDF } from '../controllers/pdfController.js';

const router = express.Router();

// Get available dates for a client from bills (accepts ?clientId= or /:clientId for backward compatibility)
router.get('/available-dates', getAvailableDates);
router.get('/available-dates/:clientId', getAvailableDates);

// Get all bills (with optional filtering by clientId, startDate, endDate)
router.get('/', getAllBills);

// Create new bill
router.post('/', createBill);

// Update bill (general update including qty, rate, min_charge_qty)
router.put('/:id', updateBill);

// Update payment status
router.put('/:id/status', updatePaymentStatus);

// Update minimum charge quantity (with auto-calculation)
router.put('/:id/min-charge', updateMinChargeQty);

// Delete bill
router.delete('/:id', deleteBill);

// Generate PDF
router.get('/:id/pdf', generateInvoicePDF);

// Download PDF
router.get('/:id/download', downloadBillPDF);

export default router;
