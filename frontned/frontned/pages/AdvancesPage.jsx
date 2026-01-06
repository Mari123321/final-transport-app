import React from 'react';

const AdvancesPage = () => {
  const advances = [
    {
      id: 1,
      driver: 'Ravi Kumar',
      amount: 5000,
      date: '2025-07-20',
      reason: 'Diesel advance',
    },
    {
      id: 2,
      driver: 'Suresh Das',
      amount: 3000,
      date: '2025-07-23',
      reason: 'Food & Toll',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Advances</h1>
        <p className="text-gray-500">View all driver advance transactions here</p>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
        <table className="min-w-full text-sm text-left text-gray-600 bg-white">
          <thead className="text-xs uppercase bg-gray-100 text-gray-700">
            <tr>
              <th scope="col" className="px-6 py-4">ID</th>
              <th scope="col" className="px-6 py-4">Driver Name</th>
              <th scope="col" className="px-6 py-4">Amount (₹)</th>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Reason</th>
            </tr>
          </thead>
          <tbody>
            {advances.map((advance) => (
              <tr key={advance.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{advance.id}</td>
                <td className="px-6 py-4">{advance.driver}</td>
                <td className="px-6 py-4">₹ {advance.amount}</td>
                <td className="px-6 py-4">{advance.date}</td>
                <td className="px-6 py-4">{advance.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvancesPage;
