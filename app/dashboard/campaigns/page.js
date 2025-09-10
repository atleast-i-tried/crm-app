"use client";

import { useEffect, useState } from "react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        // if API returns { campaigns: [...] }, use data.campaigns
        setCampaigns(Array.isArray(data) ? data : data.campaigns || []);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Campaigns</h1>
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Created By</th>
            <th className="border p-2">Message</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c._id}>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2">{c.createdBy?.email || "Unknown"}</td>
              <td className="border p-2">{c.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
