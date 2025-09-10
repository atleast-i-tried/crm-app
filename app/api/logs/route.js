import { connectDB } from "@/lib/mongoose";
import CampaignLog from "@/models/CampaignLog";

// ✅ GET /api/logs → fetch all campaign logs
export async function GET() {
  try {
    await connectDB();
    const logs = await CampaignLog.find({})
      .populate("campaign")
      .populate("customer");
    return new Response(JSON.stringify(logs), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ POST /api/logs → create a new campaign log (simulating vendor response)
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.campaign || !body.customer) {
      return new Response(
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

    return new Response(JSON.stringify(log), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
