// frontend/src/components/LicenseAlerts.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function LicenseAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/drivers/expiring").then((res) => {
      setAlerts(res.data);
    });
  }, []);

  return (
    <div className="p-4 bg-yellow-100 rounded-xl">
      <h2 className="text-lg font-bold text-red-600">⚠️ Expiring Licenses</h2>
      {alerts.length > 0 ? (
        <ul>
          {alerts.map((d) => (
            <li key={d.driver_id}>
              {d.name} ({d.license_no}) – Expires on{" "}
              {new Date(d.license_expiry).toLocaleDateString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>No licenses expiring soon ✅</p>
      )}
    </div>
  );
}
