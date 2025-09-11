import { connectDB } from "@/lib/mongoose";
import Campaign from "@/models/Campaign";
import CampaignLog from "@/models/CampaignLog";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // Fix: Add 'await' to ensure params is ready

    if (!id) {
      return new NextResponse(JSON.stringify({ error: "Campaign ID is required" }), { status: 400 });
    }

    // Delete the campaign and all associated logs
    const deletedCampaign = await Campaign.findByIdAndDelete(id);
    await CampaignLog.deleteMany({ campaign: id });

    if (!deletedCampaign) {
      return new NextResponse(JSON.stringify({ error: "Campaign not found" }), { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}