import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Customer from "@/models/Customer";

// ✅ GET /api/orders → fetch all orders
export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({}).populate("customer");
    return new Response(JSON.stringify(orders), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ POST /api/orders → create a new order for a customer
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.customerId || !body.amount) {
      return new Response(
        JSON.stringify({ error: "CustomerId and Amount are required" }),
        { status: 400 }
      );
    }

    // Create order
    const newOrder = await Order.create({
      customer: body.customerId,
      amount: body.amount,
      status: body.status || "PENDING",
    });

    // Update customer's total spend + visits
    await Customer.findByIdAndUpdate(body.customerId, {
      $inc: { totalSpend: body.amount, visits: 1 },
      $set: { lastActive: new Date() },
    });

    return new Response(JSON.stringify(newOrder), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
