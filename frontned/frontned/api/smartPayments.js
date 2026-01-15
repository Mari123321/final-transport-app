/**
 * Smart Payment API Service
 * 
 * Provides all API calls for the smart payment management system
 * - Client-driven filtering (no manual date entry)
 * - Automatic date dropdown population
 * - Partial payment with balance tracking
 */

import api from './axios';

const BASE_URL = '/api/smart-payments';

/**
 * Get all clients for dropdown selection
 */
export const getClientsForPayment = async () => {
  const response = await api.get(`${BASE_URL}/clients`);
  return response.data;
};

/**
 * Get available bill dates for a client (CRITICAL - no manual date entry)
 * @param {number} clientId - Selected client ID
 */
export const getBillDatesForClient = async (clientId) => {
  if (!clientId) {
    return { success: true, data: [], count: 0 };
  }
  const response = await api.get(`${BASE_URL}/bill-dates`, {
    params: { clientId }
  });
  return response.data;
};

/**
 * Get invoices for a client (for linking payments to invoices)
 * @param {number} clientId - Selected client ID
 */
export const getInvoicesForClient = async (clientId) => {
  if (!clientId) {
    return { success: true, data: [] };
  }
  const response = await api.get(`${BASE_URL}/invoices`, {
    params: { clientId }
  });
  return response.data;
};

/**
 * Get filtered payments
 * @param {Object} filters - Filter parameters
 * @param {number} filters.clientId - Client ID (required for date dropdown)
 * @param {string} filters.billDate - Bill date (selected from dropdown)
 * @param {string} filters.status - Payment status (Paid, Partial, Pending)
 * @param {string} filters.paymentMode - Payment mode (Cash, Bank, UPI, Cheque)
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 */
export const getFilteredPayments = async (filters = {}) => {
  const params = {};
  
  if (filters.clientId) params.clientId = filters.clientId;
  if (filters.billDate) params.billDate = filters.billDate;
  if (filters.status) params.status = filters.status;
  if (filters.paymentMode) params.paymentMode = filters.paymentMode;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;
  
  const response = await api.get(BASE_URL, { params });
  return response.data;
};

/**
 * Get payment summary for filtered results
 * @param {Object} filters - Same filters as getFilteredPayments
 */
export const getFilteredPaymentSummary = async (filters = {}) => {
  const params = {};
  
  if (filters.clientId) params.clientId = filters.clientId;
  if (filters.billDate) params.billDate = filters.billDate;
  if (filters.status) params.status = filters.status;
  if (filters.paymentMode) params.paymentMode = filters.paymentMode;
  
  const response = await api.get(`${BASE_URL}/summary`, { params });
  return response.data;
};

/**
 * Add partial payment (CRITICAL - recalculates balance)
 * @param {number} paymentId - Payment record ID
 * @param {Object} paymentData - Partial payment details
 * @param {number} paymentData.amount - Amount to pay
 * @param {string} paymentData.paymentMode - Payment mode
 * @param {string} paymentData.referenceNo - Reference number
 * @param {string} paymentData.remarks - Payment remarks
 */
export const addPartialPayment = async (paymentId, paymentData) => {
  const response = await api.post(`${BASE_URL}/${paymentId}/partial`, paymentData);
  return response.data;
};

/**
 * Get payment transaction history
 * @param {number} paymentId - Payment record ID
 */
export const getPaymentTransactions = async (paymentId) => {
  const response = await api.get(`${BASE_URL}/${paymentId}/transactions`);
  return response.data;
};

/**
 * Create payment from invoice
 * @param {Object} paymentData - Payment details
 * @param {number} paymentData.clientId - Client ID
 * @param {number} paymentData.invoiceId - Invoice ID
 * @param {string} paymentData.billDate - Bill date
 * @param {number} paymentData.paidAmount - Initial paid amount
 * @param {string} paymentData.dueDate - Due date
 * @param {string} paymentData.paymentMode - Payment mode
 * @param {string} paymentData.referenceNo - Reference number
 * @param {string} paymentData.remarks - Remarks
 */
export const createPaymentFromInvoice = async (paymentData) => {
  const response = await api.post(BASE_URL, paymentData);
  return response.data;
};

/**
 * Apply invoice draft coming from Invoice page
 * @param {Object} draftData - Draft invoice payload
 */
export const applyInvoiceDraft = async (draftData) => {
  const response = await api.post(`${BASE_URL}/from-invoice`, draftData);
  return response.data;
};

export default {
  getClientsForPayment,
  getBillDatesForClient,
  getInvoicesForClient,
  getFilteredPayments,
  getFilteredPaymentSummary,
  addPartialPayment,
  getPaymentTransactions,
  createPaymentFromInvoice,
  applyInvoiceDraft,
};
