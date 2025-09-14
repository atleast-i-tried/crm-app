import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";

export async function POST(req) {
  try {
    const { objective } = await req.json();

    const prompt = `
      You are a skilled marketing copywriter specializing in CRM campaigns.
        Write 3 short, catchy, customer-friendly marketing messages tailored for the campaign objective: "${objective}".

        ✅ Each message must:

        Be under 100 words.

        Sound natural, engaging, and persuasive (not robotic).

        Use a positive, friendly, and action-oriented tone.

        Vary the style: one urgent, one warm & personal, one value-driven.

        Avoid jargon, technical words, or sounding too salesy.

        Include numbers like discounts, or timeframes where relevant.

        Return the results as a numbered list, with each message on a separate line.
    `;

    const suggestions = await generateText(prompt);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI suggestion failed" }, { status: 500 });
  }
}
