import { Expense } from '../models/index.js';

export const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
