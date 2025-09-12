import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Customer from "@/models/Customer";

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({}).populate("customer");

    // Map PENDING -> SUCCESS for frontend display
    const mappedOrders = orders.map(order => ({
      ...order._doc,
      status: order.status === "PENDING" ? "SUCCESS" : order.status,
    }));

    return new Response(JSON.stringify(mappedOrders), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

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

    const newOrder = await Order.create({
      customer: body.customerId,
      amount: body.amount,
      status: body.status || "PENDING",
    });

    await Customer.findByIdAndUpdate(body.customerId, {
      $inc: { totalSpend: body.amount, visits: 1 },
      $set: { lastActive: new Date() },
    });

    // Map PENDING -> SUCCESS in response
    const responseOrder = {
      ...newOrder._doc,
      status: newOrder.status === "PENDING" ? "SUCCESS" : newOrder.status,
    };

    return new Response(JSON.stringify(responseOrder), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}