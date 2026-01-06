import React from 'react';

const VehicleTable = ({ vehicles }) => {
  return (
    <table className="w-full mt-4 border">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 border">ID</th>
          <th className="p-2 border">Vehicle Name</th>
          <th className="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => (
          <tr key={vehicle.id}>
            <td className="p-2 border">{vehicle.id}</td>
            <td className="p-2 border">{vehicle.name}</td>
            <td className="p-2 border">
              <button className="text-blue-500 hover:underline">Edit</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default VehicleTable;
