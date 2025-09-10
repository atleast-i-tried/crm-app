import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["PENDING", "COMPLETED", "CANCELLED"], 
      default: "PENDING" 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
