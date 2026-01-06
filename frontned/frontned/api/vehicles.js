// src/api/vehicles.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/vehicles';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getVehicles = async () => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data;
};

export const addVehicle = async (vehicleData) => {
  const response = await axios.post(API_URL, vehicleData, getAuthHeader());
  return response.data;
};

export const updateVehicle = async (id, vehicleData) => {
  const response = await axios.put(`${API_URL}/${id}`, vehicleData, getAuthHeader());
  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};
