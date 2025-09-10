import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },   // e.g., "Win-back High Spenders"
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filters: { type: Object, required: true }, // e.g. { spend: ">10000", inactiveDays: ">90" }
    message: { type: String, required: true }, // campaign message
    status: { type: String, enum: ["PENDING", "SENT"], default: "PENDING" },
  },
  { timestamps: true }
);

export default mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);
