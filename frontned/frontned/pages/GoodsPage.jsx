import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

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
    };

    return (
        <div className="flex">
            <Sidebar />
            <main className="ml-60 p-6 w-full">
                <h1 className="text-2xl font-bold mb-4">Goods</h1>
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                    <div>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Goods Name"
                            className="border p-2 w-full"
                        />
                    </div>
                    <div>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="border p-2 w-full"
                        >
                            <option value="">Select Goods Type</option>
                            <option value="Fragile">Fragile</option>
                            <option value="Perishable">Perishable</option>
                            <option value="Heavy">Heavy</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <input
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            type="number"
                            placeholder="Weight (kg)"
                            className="border p-2 w-full"
                        />
                    </div>
                    <div>
                        <input
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            type="number"
                            placeholder="Quantity"
                            className="border p-2 w-full"
                        />
                    </div>
                    <div>
                        <input
                            name="pickupLocation"
                            value={formData.pickupLocation}
                            onChange={handleChange}
                            placeholder="Pickup Location"
                            className="border p-2 w-full"
                        />
                    </div>
                    <div>
                        <input
                            name="deliveryLocation"
                            value={formData.deliveryLocation}
                            onChange={handleChange}
                            placeholder="Delivery Location"
                            className="border p-2 w-full"
                        />
                    </div>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded">Add Goods</button>
                </form>
                <h2 className="text-xl font-bold mb-4">Goods List</h2>
                <ul className="list-disc pl-5">
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
