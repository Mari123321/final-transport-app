import api from './axios';

// Get all trips
export const getAllTrips = async () => {
  const response = await api.get('/api/trips');
  return response.data;
};

// Create trip
export const createTrip = async (tripData) => {
  const response = await api.post('/api/trips', tripData);
  return response.data;
};

// Update trip
export const updateTrip = async (id, tripData) => {
  const response = await api.put(`/api/trips/${id}`, tripData);
  return response.data;
};

// Delete trip
export const deleteTrip = async (id) => {
  const response = await api.delete(`/api/trips/${id}`);
  return response.data;
};