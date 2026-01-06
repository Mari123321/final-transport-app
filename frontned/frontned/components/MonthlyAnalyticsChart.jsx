import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';
import { Box, Typography, Select, MenuItem } from '@mui/material';

const MonthlyAnalyticsChart = () => {
  const [data, setData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
    try {
      const [paymentsRes, billsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/payments'),
        axios.get('http://localhost:5000/api/bills'),
      ]);

      const monthlyTotals = {};

      // Helper to aggregate
      const aggregateByMonth = (arr, type) => {
        arr.forEach(({ amount, date }) => {
          const d = new Date(date);
          const m = d.toLocaleString('default', { month: 'short' });
          const y = d.getFullYear();
          if (y !== year) return;

          const key = m;
          if (!monthlyTotals[key]) monthlyTotals[key] = { month: key, payment: 0, bill: 0 };
          monthlyTotals[key][type] += Number(amount);
        });
      };

      aggregateByMonth(paymentsRes.data, 'payment');
      aggregateByMonth(billsRes.data, 'bill');

      const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const chartData = monthsOrder.map((m) => monthlyTotals[m] || { month: m, payment: 0, bill: 0 });

      setData(chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  return (
    <Box mt={4} p={3} sx={{ borderRadius: 4, background: '#fff', boxShadow: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold" fontFamily="Poppins">
          Monthly Revenue & Bills - {year}
        </Typography>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} size="small">
          {[2025, 2024, 2023].map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </Select>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="bill" fill="#6366F1" name="Bills" />
          <Bar dataKey="payment" fill="#10B981" name="Payments" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default MonthlyAnalyticsChart;
