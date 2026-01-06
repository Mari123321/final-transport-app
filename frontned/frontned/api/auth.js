import api from './axios';

// Login
export const login = async (username, password) => {
  const response = await api.post('/api/auth/login', { username, password });
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// Register
export const register = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get stored user
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};