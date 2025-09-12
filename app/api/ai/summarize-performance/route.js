import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";

export async function POST(req) {
  try {
    const { stats } = await req.json();

    // Example stats = { sent: 1284, delivered: 1140, failed: 144, highValueRate: "95%" }

    const prompt = `
      You are a CRM analytics assistant.
      Summarize this campaign's performance in 2–3 sentences.
      Stats: ${JSON.stringify(stats)}
      Example style:
      "Your last campaign reached 1,284 users. 1,140 messages were delivered. Customers with > ₹10K spend had the best delivery rate."
    `;

    const summary = await generateText(prompt);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI summarization failed" }, { status: 500 });
  }
}
