// src/pages/AddVehiclePage.jsx
import React, { useState } from "react";

const AddVehiclePage = () => {
  const [model, setModel] = useState("");
  const [numberPlate, setNumberPlate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, number_plate: numberPlate }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Vehicle added successfully!");
      setModel("");
      setNumberPlate("");
    } else {
      alert("Failed to add vehicle: " + data.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-10 shadow-xl rounded-2xl border border-blue-300">
      <h2 className="text-xl font-bold mb-4">Add New Vehicle</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">
          Model:
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
            className="w-full p-2 border rounded mt-1"
          />
        </label>
        <label className="block mb-2">
          Number Plate:
          <input
            type="text"
            value={numberPlate}
            onChange={(e) => setNumberPlate(e.target.value)}
            required
            className="w-full p-2 border rounded mt-1"
          />
        </label>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Vehicle
        </button>
      </form>
    </div>
  );
};

export default AddVehiclePage;
