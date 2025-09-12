import { connectDB } from "@/lib/mongoose";
import Campaign from "@/models/Campaign";
import Customer from "@/models/Customer";
import CampaignLog from "@/models/CampaignLog";
import { NextResponse } from "next/server";

// ✅ GET /api/campaigns
export async function GET() {
  try {
    await connectDB();
    const campaigns = await Campaign.find({});
    return new NextResponse(JSON.stringify(campaigns), { status: 200 });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ POST /api/campaigns → create campaign + execute filters
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.createdBy || !body.filters || !body.message) {
      return new NextResponse(
        JSON.stringify({ error: "name, createdBy, filters, message are required" }),
        { status: 400 }
      );
    }

    // 1️⃣ Create campaign
    const newCampaign = await Campaign.create(body);

    // 2️⃣ Apply filters to select customers
    const conditions = body.filters.map(f => {
      switch (f.key) {
        case "minSpend":
          return { totalSpend: { $gte: f.value } };
        case "minVisits":
          return { visits: { $gte: f.value } };
        case "inactiveDays":
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - f.value);
          return { lastActive: { $lte: cutoff } };
        default:
          return {};
      }
    }).filter(c => Object.keys(c).length > 0);

    let query = {};
    if (conditions.length > 0) {
      if (body.logic === "AND") {
        query.$and = conditions;
      } else {
        query.$or = conditions;
      }
    }

    const targetCustomers = await Customer.find(query);

    // 3️⃣ Send message to vendor API for each matched customer
    const logPromises = targetCustomers.map((cust) =>
      // This sends a request to your new simulated vendor API
      fetch(`${req.nextUrl.origin}/api/vendor/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: newCampaign._id,
          customerId: cust._id,
          message: body.message,
        }),
      })
    );

    // Wait for all messages to be "sent" by the vendor
    await Promise.all(logPromises);

    return new NextResponse(
      JSON.stringify({
        campaign: newCampaign,
        matchedCustomers: targetCustomers.length,
        message: "Campaign initiated. Logs will be updated shortly.",
      }),
      { status: 201 }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}