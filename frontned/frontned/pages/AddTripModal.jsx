import React, { useState, useEffect } from "react";
import AppDatePicker from "../components/common/AppDatePicker";

export default function AddTripModal({ onClose, onSaved }) {
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    client_id: "",
    driver_id: "",
    vehicle_id: "",
    date: "",
    from_place: "",
    to_place: "",
    tonnage: "",
    diesel_litre: "",
    diesel_payment: "",
    amount: "",
    amount_paid: "",
    payment_mode: "Cash",
  });

  useEffect(() => {
    fetch("/api/clients").then(res => res.json()).then(setClients);
    fetch("/api/drivers").then(res => res.json()).then(setDrivers);
    fetch("/api/vehicles").then(res => res.json()).then(setVehicles);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-lg font-bold mb-4">Add New Trip</h2>

        <select name="client_id" value={form.client_id} onChange={handleChange} className="w-full border p-2 mb-2">
          <option value="">Select Client</option>
          {clients.map(c => (
            <option key={c.client_id} value={c.client_id}>{c.name}</option>
          ))}
        </select>

        <select name="driver_id" value={form.driver_id} onChange={handleChange} className="w-full border p-2 mb-2">
          <option value="">Select Driver</option>
          {drivers.map(d => (
            <option key={d.driver_id} value={d.driver_id}>{d.name}</option>
          ))}
        </select>

        <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} className="w-full border p-2 mb-2">
          <option value="">Select Vehicle</option>
          {vehicles.map(v => (
            <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_no}</option>
          ))}
        </select>

        <AppDatePicker
          label="Date"
          value={form.date}
          onChange={(val) => handleChange({ target: { name: 'date', value: val ? val.format("YYYY-MM-DD") : "" } })}
          fullWidth
        />
        <input name="from_place" placeholder="From Place" value={form.from_place} onChange={handleChange} className="w-full border p-2 mb-2" />
        <input name="to_place" placeholder="To Place" value={form.to_place} onChange={handleChange} className="w-full border p-2 mb-2" />
        <input name="tonnage" placeholder="Tonnage" value={form.tonnage} onChange={handleChange} className="w-full border p-2 mb-2" />
        <input name="diesel_litre" placeholder="Diesel Litre" value={form.diesel_litre} onChange={handleChange} className="w-full border p-2 mb-2" />
        <input name="diesel_payment" placeholder="Diesel Payment" value={form.diesel_payment} onChange={handleChange} className="w-full border p-2 mb-2" />
        <input name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} className="w-full border p-2 mb-2" />
        <input name="amount_paid" placeholder="Amount Paid" value={form.amount_paid} onChange={handleChange} className="w-full border p-2 mb-2" />

        <select name="payment_mode" value={form.payment_mode} onChange={handleChange} className="w-full border p-2 mb-4">
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Cheque">Cheque</option>
          <option value="Net Banking">Net Banking</option>
        </select>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
}
