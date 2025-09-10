"use client";
import { useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("/api/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Campaign Logs</h1>
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            <th className="border p-2">Campaign</th>
            <th className="border p-2">Customer</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l._id}>
              <td className="border p-2">{l.campaign?.name || "Unknown"}</td>
              <td className="border p-2">{l.customer?.name || "Unknown"}</td>
              <td className="border p-2">{l.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
