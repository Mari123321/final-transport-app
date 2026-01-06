import api from './axios';

// Get all bills
export const getAllBills = async (params) => {
  const response = await api.get('/api/bills', { params });
  return response.data;
};

// Get bill PDF
export const downloadBillPDF = async (id) => {
  const response = await api.get(`/api/bills/${id}/pdf`, {
    responseType: 'blob'
  });
  return response.data;
};

// Update payment status
export const updatePaymentStatus = async (id, status) => {
  const response = await api.put(`/api/bills/${id}/status`, { payment_status: status });
  return response.data;
};

// Delete invoice
export const deleteInvoice = async (id) => {
  const response = await api.delete(`/api/bills/${id}`);
  return response.data;
};