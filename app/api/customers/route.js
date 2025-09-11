import { connectDB } from "@/lib/mongoose";
import Customer from "@/models/Customer";

// ✅ GET /api/customers → fetch all customers
export async function GET() {
  try {
    await connectDB();
    const customers = await Customer.find({});
    return new Response(JSON.stringify(customers), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ POST /api/customers → add a new customer
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Basic validation
    if (!body.name || !body.email) {
      return new Response(
        JSON.stringify({ error: "Name and Email are required" }),
        { status: 400 }
      );
    }

    const newCustomer = await Customer.create(body);
    return new Response(JSON.stringify(newCustomer), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}