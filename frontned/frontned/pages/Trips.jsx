import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AppDatePicker from '../components/common/AppDatePicker';

const Trip = () => {
  const [clients, setClients] = useState([]);
  const [trips, setTrips] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    vehicle: '',
    goods: '',
    amount: '',
    date: '',
    status: 'completed' // added status to support invoice filtering
  });

  useEffect(() => {
    fetchClients();
    fetchTrips();
  }, []);

  const fetchClients = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setClients(res.data);
  };

  const fetchTrips = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/trips', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTrips(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/trips', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setFormData({ clientId: '', vehicle: '', goods: '', amount: '', date: '', status: 'completed' });
    fetchTrips();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Add Trip</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          className="border p-2 w-full" required>
          <option value="">Select Client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>

        <input type="text" placeholder="Vehicle" value={formData.vehicle}
          onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
          className="border p-2 w-full" required />

        <input type="text" placeholder="Goods" value={formData.goods}
          onChange={(e) => setFormData({ ...formData, goods: e.target.value })}
          className="border p-2 w-full" required />

        <input type="number" placeholder="Amount" value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="border p-2 w-full" required />

        <AppDatePicker
          label="Date"
          value={formData.date}
          onChange={(val) => setFormData({ ...formData, date: val ? val.format("YYYY-MM-DD") : "" })}
          required
          fullWidth
        />

        <select value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="border p-2 w-full">
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>

        <button type="submit" className="bg-green-600 text-white px-4 py-2">Add Trip</button>
      </form>

      <h3 className="text-lg font-semibold mb-2">Trip Records</h3>
      <ul>
        {trips.map(trip => (
          <li key={trip.id || trip.trip_id} className="border-b py-2">
            {trip.vehicle} - ₹{trip.amount} - {trip.date} - <b>{trip.status}</b>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Trip;
