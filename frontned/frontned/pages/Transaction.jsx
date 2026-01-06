import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import AppDatePicker from '../components/common/AppDatePicker';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    description: '',
  });

  // Fetch all transactions
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/transactions', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      setFormData({ date: '', amount: '', description: '' });
      fetchTransactions(); // Refresh the list
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Transactions</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Transaction
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow mb-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <AppDatePicker
              label="Date"
              value={formData.date}
              onChange={(val) => handleChange({ target: { name: 'date', value: val ? val.format("YYYY-MM-DD") : "" } })}
              required
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="w-full mt-1 border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full mt-1 border rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-xl">
          <thead>
            <tr className="bg-gray-100 text-left text-sm font-semibold">
              <th className="p-4">#</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, index) => (
              <tr key={txn.id} className="border-t hover:bg-gray-50">
                <td className="p-4">{index + 1}</td>
                <td className="p-4">{txn.date}</td>
                <td className="p-4">₹ {txn.amount}</td>
                <td className="p-4">{txn.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <p className="mt-4 text-center text-gray-500">No transactions found.</p>
        )}
      </div>
    </Layout>
  );
}

export default Transactions;
