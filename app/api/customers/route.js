import { connectDB } from "@/lib/mongoose";
import Customer from "@/models/Customer";

const TIMEOUT = 8000; // 8 seconds timeout

// Helper: wraps a promise with timeout
async function withTimeout(promise, ms, errorMessage) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ✅ GET /api/customers → fetch all customers
export async function GET() {
  try {
    await withTimeout(connectDB(), TIMEOUT, "DB connection timed out");

    const customers = await withTimeout(
      Customer.find({}),
      TIMEOUT,
      "Fetching customers took too long"
    );

    return new Response(JSON.stringify(customers), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ✅ POST /api/customers → add a new customer
export async function POST(req) {
  try {
    await withTimeout(connectDB(), TIMEOUT, "DB connection timed out");
    const body = await withTimeout(req.json(), TIMEOUT, "Request body parsing timed out");

    if (!body.name || !body.email) {
      return new Response(
        JSON.stringify({ error: "Name and Email are required" }),
        { status: 400 }
      );
    }

    const newCustomer = await withTimeout(
      Customer.create(body),
      TIMEOUT,
      "Creating customer took too long"
    );

    return new Response(JSON.stringify(newCustomer), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
