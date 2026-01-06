import api from './axios';

// Generate demo data
export const generateDemoData = async () => {
  try {
    const response = await api.post('/api/demo/generate');
    return response.data;
  } catch (error) {
    console.error('Error generating demo data:', error);
    throw error;
  }
};

// Clear all demo data
export const clearDemoData = async () => {
  try {
    const response = await api.delete('/api/demo/clear');
    return response.data;
  } catch (error) {
    console.error('Error clearing demo data:', error);
    throw error;
  }
};