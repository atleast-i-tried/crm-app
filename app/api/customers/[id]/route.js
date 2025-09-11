import { connectDB } from "@/lib/mongoose";
import Customer from "@/models/Customer";
import { NextResponse } from "next/server";

// ✅ PUT /api/customers/[id] → update a customer
export async function PUT(req, context) {
  try {
    await connectDB();

    // ✅ Await params
    const { id } = await context.params;
    const body = await req.json();

    const updatedCustomer = await Customer.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCustomer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), { status: 404 });
    }

    return new NextResponse(JSON.stringify(updatedCustomer), { status: 200 });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ DELETE /api/customers/[id] → delete a customer
export async function DELETE(req, context) {
  try {
    await connectDB();

    // ✅ Await params
    const { id } = await context.params;

    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
