import { connectDB } from "@/lib/mongoose";
import Campaign from "@/models/Campaign";
import Customer from "@/models/Customer";
import CampaignLog from "@/models/CampaignLog";

// ✅ GET /api/campaigns
export async function GET() {
  try {
    await connectDB();
    const campaigns = await Campaign.find({});
    return new Response(JSON.stringify(campaigns), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ POST /api/campaigns → create campaign + execute filters
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.createdBy || !body.filters || !body.message) {
      return new Response(
        JSON.stringify({ error: "name, createdBy, filters, message are required" }),
        { status: 400 }
      );
    }

    // 1️⃣ Create campaign
    const newCampaign = await Campaign.create(body);

    // 2️⃣ Apply filters to select customers
    let query = {};
    if (body.filters.minSpend) {
      query.totalSpend = { $gte: body.filters.minSpend };
    }
    if (body.filters.inactiveDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - body.filters.inactiveDays);
      query.lastActive = { $lte: cutoff };
    }

    const targetCustomers = await Customer.find(query);

    // 3️⃣ Corrected: Create logs for each matched customer and wait for all to resolve
    const logs = await Promise.all(
      targetCustomers.map((cust) =>
        CampaignLog.create({
          campaign: newCampaign._id,
          customer: cust._id,
          status: "SENT",
          vendorResponse: "Simulated vendor delivery ✅",
        })
      )
    );

    return new Response(
      JSON.stringify({
        campaign: newCampaign,
        matchedCustomers: targetCustomers.length,
        logs,
      }),
      { status: 201 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}