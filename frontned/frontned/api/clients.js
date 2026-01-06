import api from './axios';

// Get all clients
export const getAllClients = async () => {
  const response = await api.get('/api/clients');
  return response.data;
};

// Get client by ID
export const getClientById = async (id) => {
  const response = await api.get(`/api/clients/${id}`);
  return response.data;
};

// Create client
export const createClient = async (clientData) => {
  const response = await api.post('/api/clients', clientData);
  return response.data;
};

// Update client
export const updateClient = async (id, clientData) => {
  const response = await api.put(`/api/clients/${id}`, clientData);
  return response.data;
};

// Delete client
export const deleteClient = async (id) => {
  const response = await api.delete(`/api/clients/${id}`);
  return response.data;
};

// Bulk delete clients
export const bulkDeleteClients = async (ids) => {
  const response = await api.post('/api/clients/bulk-delete', { ids });
  return response.data;
};