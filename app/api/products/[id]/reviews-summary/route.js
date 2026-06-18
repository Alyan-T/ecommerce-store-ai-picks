import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Review from "@/models/Review";
import { mistral } from "@/lib/mistral";

export async function GET(req, { params }) {
  const { id } = params;

  try {
    await connectToDatabase();

    // Fetch reviews for this product
    const reviews = await Review.find({ product: id }).lean();

    if (reviews.length < 3) {
      return NextResponse.json({
        success: false,
        message: "Need at least 3 reviews to generate an AI summary."
      });
    }

    const reviewContent = reviews
      .map((r, i) => `Review ${i + 1} (Rating: ${r.rating}/5): "${r.comment}"`)
      .join("\n\n");

    const prompt = `Below are customer reviews for a product. Read them carefully and compile an AI summary.
You MUST respond ONLY with a JSON object and absolutely nothing else. Do not wrap it in markdown code blocks. The JSON object must match this exact structure:
{
  "pros": ["string", "string", ...],
  "cons": ["string", "string", ...],
  "verdict": "2-sentence overall summary verdict"
}

Here are the customer reviews:
${reviewContent}`;

    const completion = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: "You are a helpful product analyst. You summarize customer reviews objectively into pros, cons, and a short verdict in JSON format." },
        { role: "user", content: prompt }
      ]
    });

    let rawOutput = completion.choices[0].message.content.trim();
    
    // Safety check in case it wraps it in a markdown json code block
    if (rawOutput.startsWith("```")) {
      rawOutput = rawOutput.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const summary = JSON.parse(rawOutput);

    return NextResponse.json({
      success: true,
      summary
    });
  } catch (err) {
    console.error("Failed to generate reviews summary:", err);
    return NextResponse.json({ error: "Failed to compile reviews summary." }, { status: 500 });
  }
}
