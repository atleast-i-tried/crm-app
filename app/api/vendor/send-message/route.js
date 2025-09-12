import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { campaignId, customerId, message } = await req.json();

    if (!campaignId || !customerId || !message) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Simulate real-world delivery with ~90% success rate
    const isSent = Math.random() < 0.9;
    const status = isSent ? "SENT" : "FAILED";
    const vendorResponse = isSent ? "Simulated delivery success." : "Simulated delivery failure.";

    // 💡 In a real-world scenario, this would be an API call to a Delivery Receipt endpoint on your backend
    // For this assignment, we will simulate this call internally.
    const deliveryReceiptRes = await fetch(`${req.nextUrl.origin}/api/logs/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        customerId,
        status,
        vendorResponse,
      }),
    });
    
    if (!deliveryReceiptRes.ok) {
      const errorData = await deliveryReceiptRes.json();
      throw new Error(errorData.error || "Failed to update log status");
    }

    return new NextResponse(JSON.stringify({ status: "processed" }), { status: 200 });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}