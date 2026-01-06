import api from './axios';

// Get dashboard stats
export const getDashboardStats = async () => {
  const response = await api.get('/api/dashboard');
  return response.data;
};

// Get analytics
export const getAnalytics = async () => {
  const response = await api.get('/api/analytics');
  return response.data;
};