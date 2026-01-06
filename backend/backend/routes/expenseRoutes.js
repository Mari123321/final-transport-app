// routes/expenseRoutes.js
import express from 'express';
import { createExpense, getAllExpenses } from '../controllers/expenseController.js';

const router = express.Router(); // ✅ CORRECT
router.post('/', createExpense);
router.get('/', getAllExpenses);

export default router;
