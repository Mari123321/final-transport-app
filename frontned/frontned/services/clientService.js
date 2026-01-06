import axios from 'axios';

const API_URL = 'http://localhost:5000/api/clients'; // Adjust as per backend route

export const addClient = async (clientData) => {
  try {
    const response = await axios.post(API_URL, clientData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Error adding client";
  }
};
