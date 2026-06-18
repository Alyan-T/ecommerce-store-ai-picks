import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { mistral } from "@/lib/mistral";

export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, category } = await req.json();

    if (!name || !category) {
      return NextResponse.json({ error: "Product name and category are required" }, { status: 400 });
    }

    const prompt = `You are a high-end copywriter for HyperStore, an elegant, warm-minimalist fashion & lifestyle e-commerce brand.
Write a compelling, premium, and sophisticated product description for an item with:
- Name: "${name}"
- Category: "${category}"

Avoid overly loud buzzwords. Keep the tone refined, literary, editorial, and inspiring, focusing on quality, style, and design.
The response should be 2 to 3 paragraphs maximum, ready to be dropped into the product page. Output ONLY the description text, nothing else.`;

    const completion = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: "You are a professional luxury copywriter." },
        { role: "user", content: prompt }
      ]
    });

    const description = completion.choices[0].message.content.trim();

    return NextResponse.json({ description });
  } catch (err) {
    console.error("Failed to generate description:", err);
    return NextResponse.json({ error: "Failed to generate description. Please try again." }, { status: 500 });
  }
}
