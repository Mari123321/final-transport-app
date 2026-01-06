// pages/Vehicles.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/vehicles', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setVehicles(res.data))
      .catch((err) => console.error('Fetch error:', err));
  }, []);

  return (
    <div>
      <h2>Vehicles</h2>
      <Link to="/vehicles/add">+ Add Vehicle</Link>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Number</th>
            <th>Type</th>
            <th>Capacity</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, idx) => (
            <tr key={v.vehicle_id}>
              <td>{idx + 1}</td>
              <td>{v.number_plate}</td>
              <td>{v.model}</td>
              <td>{v.capacity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Vehicles;
