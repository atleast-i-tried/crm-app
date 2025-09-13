import { connectDB } from "@/lib/mongoose";
import CampaignLog from "@/models/CampaignLog";
import Customer from "@/models/Customer";
import Campaign from "@/models/Campaign";
import { NextResponse } from "next/server";

// ✅ GET /api/logs → fetch all campaign logs
export async function GET() {
  try {
    await connectDB();
    const logs = await CampaignLog.find({})
      .populate("campaign", "name")
      .populate("customer", "name");
    return new NextResponse(JSON.stringify(logs), { status: 200 });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ POST /api/logs → create a new campaign log (simulating vendor response)
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.campaign || !body.customer) {
      return new NextResponse(
        JSON.stringify({ error: "campaign and customer are required" }),
        { status: 400 }
      );
    }

    const log = await CampaignLog.create({
      campaign: body.campaign,
      customer: body.customer,
      status: body.status || "SENT",
      vendorResponse: body.vendorResponse || "Simulated vendor API response",
    });

    return new NextResponse(JSON.stringify(log), { status: 201 });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
