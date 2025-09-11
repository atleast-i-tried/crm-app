import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    createdBy: { type: String, required: true }, // Changed type to String to match frontend
    filters: { type: Object, required: true },
    message: { type: String, required: true },
    objective: { type: String }, // Added objective field
    status: { type: String, enum: ["PENDING", "SENT"], default: "PENDING" },
  },
  { timestamps: true }
);

export default mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
