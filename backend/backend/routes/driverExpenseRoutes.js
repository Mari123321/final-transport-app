import express from 'express';
import {
  createDriverExpense,
  getDriverExpenses,
  getDriverExpenseById,
  getExpensesByDriver,
  updateDriverExpense,
  deleteDriverExpense
} from '../controllers/driverExpenseController.js';

const router = express.Router();

// Create new driver expense
router.post('/', createDriverExpense);

// Get all driver expenses (with optional filters)
router.get('/', getDriverExpenses);

// Get single driver expense by ID
router.get('/:id', getDriverExpenseById);

// Get expenses by driver ID
router.get('/driver/:driverId', getExpensesByDriver);

// Update driver expense
router.put('/:id', updateDriverExpense);

// Delete driver expense
router.delete('/:id', deleteDriverExpense);

export default router;
