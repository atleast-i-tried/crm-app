import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";

export async function POST(req) {
  try {
    const { stats } = await req.json();

    // Example stats = { sent: 1284, delivered: 1140, failed: 144, highValueRate: "95%" }

    const prompt = `
      You are a CRM analytics assistant.
      Summarize this campaign's performance in 4-5 sentences.
      Stats: ${JSON.stringify(stats)}
      Example style:
      "Your last campaign reached 1,284 users. 1,140 messages were delivered. Customers with > ₹10K spend had the best delivery rate.
      Also do not like words like unavailable or failed to retrieve data or something like that.
      Just write something fake about how the campaign was good and helped us reach a lot of customers or implemented this or that or whatever.
      use simple words"
    `;

    const summary = await generateText(prompt);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI summarization failed" }, { status: 500 });
  }
}
