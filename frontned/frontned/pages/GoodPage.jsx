import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Dialog } from '@headlessui/react';

const GoodsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    weight: '',
    quantity: '',
    pickupLocation: '',
    deliveryLocation: '',
  });
  const [goods, setGoods] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGoods((prev) => [...prev, formData]);
    setFormData({
      name: '',
      type: '',
      weight: '',
      quantity: '',
      pickupLocation: '',
      deliveryLocation: '',
    });
    setIsOpen(false);
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-60 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Goods</h1>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Goods
          </button>
        </div>

        <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-20">
              <Dialog.Title className="text-lg font-bold mb-4">Add Goods</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Goods Name"
                  className="border p-2 w-full rounded"
                />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="border p-2 w-full rounded"
                >
                  <option value="">Select Goods Type</option>
                  <option value="Fragile">Fragile</option>
                  <option value="Perishable">Perishable</option>
                  <option value="Heavy">Heavy</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  type="number"
                  placeholder="Weight (kg)"
                  className="border p-2 w-full rounded"
                />
                <input
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  type="number"
                  placeholder="Quantity"
                  className="border p-2 w-full rounded"
                />
                <input
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  placeholder="Pickup Location"
                  className="border p-2 w-full rounded"
                />
                <input
                  name="deliveryLocation"
                  value={formData.deliveryLocation}
                  onChange={handleChange}
                  placeholder="Delivery Location"
                  className="border p-2 w-full rounded"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Dialog>

        <h2 className="text-xl font-bold mb-4 mt-6">Goods List</h2>
        <ul className="list-disc pl-5 space-y-2">
          {goods.map((good, index) => (
            <li key={index}>
              <strong>{good.name}</strong> - {good.type}, {good.weight}kg, {good.quantity} units, Pickup: {good.pickupLocation}, Delivery: {good.deliveryLocation}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default GoodsPage;