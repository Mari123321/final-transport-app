import express from 'express';
import {
  getAllBills,
  getBillById,
  createBillFromInvoice,
  updateBill,
  updateBillStatus,
  deleteBill,
  getBillsSummary
} from '../controllers/billController.js';

const router = express.Router();

/**
 * Bill Routes
 * All endpoints work with the proper Bill model with relationships to Invoice, Client, Vehicle
 */

// GET /api/bills/summary - Dashboard KPIs
router.get('/summary', getBillsSummary);

// GET /api/bills - Get all bills with filtering and pagination
router.get('/', getAllBills);

// GET /api/bills/:id - Get single bill by ID
router.get('/:id', getBillById);

// POST /api/bills - Create bill from invoice
router.post('/', createBillFromInvoice);

// PUT /api/bills/:id - Update bill amounts and notes
router.put('/:id', updateBill);

// PATCH /api/bills/:id/status - Update payment status (UNPAID, PARTIAL, PAID)
router.patch('/:id/status', updateBillStatus);

// DELETE /api/bills/:id - Soft delete bill
router.delete('/:id', deleteBill);

export default router;
