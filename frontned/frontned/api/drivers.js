import api from './axios';

// Get all drivers
export const getAllDrivers = async () => {
  const response = await api.get('/api/drivers');
  return response.data;
};

// Create driver
export const createDriver = async (driverData) => {
  const response = await api.post('/api/drivers', driverData);
  return response.data;
};

// Update driver
export const updateDriver = async (id, driverData) => {
  const response = await api.put(`/api/drivers/${id}`, driverData);
  return response.data;
};

// Delete driver
export const deleteDriver = async (id) => {
  const response = await api.delete(`/api/drivers/${id}`);
  return response.data;
};

// Bulk delete drivers
export const bulkDeleteDrivers = async (ids) => {
  const response = await api.post('/api/drivers/bulk-delete', { ids });
  return response.data;
};