
import * as db from '../models/index.js';
import { Transaction } from '../models/index.js';


export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { date, amount, description } = req.body;
    const newTxn = await Transaction.create({ date, amount, description });
    res.status(201).json(newTxn);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};
