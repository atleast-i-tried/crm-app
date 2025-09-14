import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = params || {};
    if (!id) {
      return new NextResponse(JSON.stringify({ error: "Order id is required" }), { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return new NextResponse(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    await Order.findByIdAndDelete(id);

    return new NextResponse(JSON.stringify({ message: "Order deleted successfully", id }), { status: 200 });
  } catch (err) {
    console.error("DELETE /api/orders/[id] error:", err);
    return new NextResponse(JSON.stringify({ error: err.message || "Internal Server Error" }), { status: 500 });
  }
}
