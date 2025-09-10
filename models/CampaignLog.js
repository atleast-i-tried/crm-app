import mongoose from "mongoose";

const CampaignLogSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    status: { type: String, enum: ["SENT", "FAILED"], default: "SENT" },
    vendorResponse: { type: String }, // optional, to simulate vendor API response
  },
  { timestamps: true }
);

export default mongoose.models.CampaignLog || mongoose.model("CampaignLog", CampaignLogSchema);
