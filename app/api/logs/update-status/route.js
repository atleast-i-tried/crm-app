import { connectDB } from "@/lib/mongoose";
import CampaignLog from "@/models/CampaignLog";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { campaignId, customerId, status, vendorResponse } = await req.json();

    if (!campaignId || !customerId || !status) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Find the log and update its status
    const updatedLog = await CampaignLog.findOneAndUpdate(
      { campaign: campaignId, customer: customerId },
      { status, vendorResponse, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedLog) {
      // Create a new log if one doesn't exist (e.g., first delivery attempt)
      const newLog = await CampaignLog.create({
        campaign: campaignId,
        customer: customerId,
        status,
        vendorResponse,
      });
      return new NextResponse(JSON.stringify(newLog), { status: 201 });
    }

    return new NextResponse(JSON.stringify(updatedLog), { status: 200 });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}