import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    totalSpend: { type: Number, default: 0 },        // lifetime spend
    visits: { type: Number, default: 0 },            // number of visits/orders
    lastActive: { type: Date, default: Date.now },   // last activity
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
