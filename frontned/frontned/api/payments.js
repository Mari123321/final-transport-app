import api from './axios';

/**
 * Payment API Service - Enterprise Grade
 * All API calls for payment operations
 */

// Get all payments with filters
export const getPayments = async (filters = {}) => {
  const params = {};
  
  if (filters.clientId) params.clientId = filters.clientId;
  if (filters.billDate || filters.date) params.billDate = filters.billDate || filters.date;
  if (filters.status) params.status = filters.status;
  if (filters.paymentMode) params.paymentMode = filters.paymentMode;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.isOverdue) params.isOverdue = filters.isOverdue;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  
  const response = await api.get('/api/payments', { params });
  return response.data;
};

// Get payment summary with same filters
export const getPaymentSummary = async (filters = {}) => {
  const params = {};
  
  if (filters.clientId) params.clientId = filters.clientId;
  if (filters.billDate || filters.date) params.billDate = filters.billDate || filters.date;
  if (filters.status) params.status = filters.status;
  if (filters.paymentMode) params.paymentMode = filters.paymentMode;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.isOverdue) params.isOverdue = filters.isOverdue;
  
  const response = await api.get('/api/payments/summary', { params });
  return response.data;
};

// Get payment by ID
export const getPaymentById = async (id) => {
  const response = await api.get(`/api/payments/${id}`);
  return response.data;
};

// Create new payment
export const createPayment = async (paymentData) => {
  const response = await api.post('/api/payments', paymentData);
  return response.data;
};

// Update payment
export const updatePayment = async (id, paymentData) => {
  const response = await api.put(`/api/payments/${id}`, paymentData);
  return response.data;
};

// Add partial payment
export const addPartialPayment = async (id, paymentData) => {
  const response = await api.post(`/api/payments/${id}/partial`, paymentData);
  return response.data;
};

// Delete payment
export const deletePayment = async (id) => {
  const response = await api.delete(`/api/payments/${id}`);
  return response.data;
};

// Get clients for dropdown
export const getClients = async () => {
  const response = await api.get('/api/payments/clients');
  return response.data;
};

// Get invoices for dropdown (optionally filtered by client)
export const getInvoices = async (clientId = null) => {
  const params = clientId ? { clientId } : {};
  const response = await api.get('/api/payments/invoices', { params });
  return response.data;
};

// Get available bill dates for dropdown
export const getAvailableDates = async (clientId = null) => {
  const params = clientId ? { clientId } : {};
  const response = await api.get('/api/payments/available-dates', { params });
  return response.data;
};

export default {
  getPayments,
  getPaymentSummary,
  getPaymentById,
  createPayment,
  updatePayment,
  addPartialPayment,
  deletePayment,
  getClients,
  getInvoices,
  getAvailableDates
};
