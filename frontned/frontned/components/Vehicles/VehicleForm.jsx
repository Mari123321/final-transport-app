// src/components/Vehicles/VehicleForm.jsx
import { useState } from 'react';

export default function VehicleForm({ onAdd }) {
  const [numberPlate, setNumberPlate] = useState('');
  const [model, setModel] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numberPlate || !model) return;
    onAdd({ number_plate: numberPlate, model });
    setNumberPlate('');
    setModel('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md p-4 rounded-xl mb-6 space-y-4 max-w-md">
      <h2 className="text-xl font-semibold">Add Vehicle</h2>
      <input
        type="text"
        placeholder="Number Plate"
        value={numberPlate}
        onChange={(e) => setNumberPlate(e.target.value)}
        className="w-full p-2 border rounded-lg"
      />
      <input
        type="text"
        placeholder="Model"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="w-full p-2 border rounded-lg"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Add Vehicle
      </button>
    </form>
  );
}
