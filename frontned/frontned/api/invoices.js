/**
 * Invoice API Service
 *
 * Handles all invoice-related API calls
 */

import api from './axios';

const BASE_URL = '/api/invoices';

/**
 * Create a new invoice
 * @param {Object} invoiceData - Invoice data
 * @param {number} invoiceData.client_id - Client ID
 * @param {string} invoiceData.date - Invoice date (YYYY-MM-DD)
 * @param {Array} invoiceData.trip_ids - Array of trip IDs to include in invoice
 * @returns {Promise} Invoice response
 */
export const createInvoice = async (invoiceData) => {
  const response = await api.post(BASE_URL, invoiceData);
  return response.data;
};

/**
 * Get all invoices with optional filtering
 * @param {Object} filters - Filter parameters
 * @param {number} filters.clientId - Filter by client ID
 * @param {string} filters.startDate - Filter from date (YYYY-MM-DD)
 * @param {string} filters.endDate - Filter to date (YYYY-MM-DD)
 * @returns {Promise} List of invoices
 */
export const getAllInvoices = async (filters = {}) => {
  const params = {};
  if (filters.clientId) params.clientId = filters.clientId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const response = await api.get(BASE_URL, { params });
  return response.data;
};

/**
 * Get a specific invoice by ID
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise} Invoice details
 */
export const getInvoiceById = async (invoiceId) => {
  const response = await api.get(`${BASE_URL}/${invoiceId}`);
  return response.data;
};

/**
 * Get available dates for a client (for smart date dropdown)
 * @param {number} clientId - Client ID
 * @returns {Promise} List of available dates
 */
export const getAvailableDates = async (clientId) => {
  if (!clientId) {
    return { success: true, data: [] };
  }
  const response = await api.get(`${BASE_URL}/available-dates/${clientId}`);
  return response.data;
};

/**
 * Update invoice status
 * @param {number} invoiceId - Invoice ID
 * @param {string} status - New status
 * @returns {Promise} Updated invoice
 */
export const updateInvoiceStatus = async (invoiceId, status) => {
  const response = await api.patch(`${BASE_URL}/${invoiceId}`, { status });
  return response.data;
};

/**
 * Delete an invoice
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteInvoice = async (invoiceId) => {
  const response = await api.delete(`${BASE_URL}/${invoiceId}`);
  return response.data;
};
