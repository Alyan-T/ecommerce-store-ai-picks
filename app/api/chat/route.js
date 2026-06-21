import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { mistral, getEmbedding } from "@/lib/mistral";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/chat
// body: { message: string, history: [{ role, content }] }
export async function POST(req) {
  try {
    await connectToDatabase();

    const { message, history = [] } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const user = getUserFromRequest(req);
    const includeDemo = user?.email === "demo.seller@hyperstore.com";
    const demoFilter = includeDemo ? {} : { isDemo: { $ne: true } };

    const projectFields = {
      _id: 1,
      name: 1,
      description: 1,
      price: 1,
      category: 1,
      image: 1,
    };

    let matches = [];
    let searchMethod = "none";

    // 1. Try vector search first
    try {
      const queryEmbedding = await getEmbedding(message);

      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 8,
          },
        },
        { $match: demoFilter },
        { $project: { ...projectFields, score: { $meta: "vectorSearchScore" } } },
      ];

      const vectorResults = await Product.aggregate(pipeline);

      // Only trust vector results with a decent similarity score
      matches = vectorResults.filter((p) => (p.score ?? 0) > 0.3);
      if (matches.length > 0) searchMethod = "vector";
    } catch (err) {
      console.warn("Vector search unavailable:", err.message);
    }

    // 2. Fallback: text / regex search across name, description, category
    if (matches.length === 0) {
      try {
        // Build tokens from the message (words 3+ chars, deduplicated)
        const tokens = [...new Set(
          message
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((w) => w.length >= 3)
        )];

        if (tokens.length > 0) {
          // OR across all tokens, each token searched across multiple fields
          const orClauses = tokens.flatMap((token) => [
            { name: { $regex: token, $options: "i" } },
            { description: { $regex: token, $options: "i" } },
            { category: { $regex: token, $options: "i" } },
          ]);

          matches = await Product.find(
            { $and: [demoFilter, { $or: orClauses }] },
            projectFields
          ).limit(5).lean();

          if (matches.length > 0) searchMethod = "text";
        }

        // 3. Last resort: return a broad sample of products so the AI has context
        if (matches.length === 0) {
          matches = await Product.find(demoFilter, projectFields).limit(8).lean();
          searchMethod = "sample";
        }
      } catch (err) {
        console.error("Fallback search failed:", err.message);
      }
    }

    // 4. Build product context for the LLM
    const productContext = matches.length
      ? matches
          .map(
            (p, i) =>
              `${i + 1}. ${p.name} — $${p.price} (${p.category})\n   ${p.description || "No description."}`
          )
          .join("\n\n")
      : "No products are currently available.";

    const systemPrompt = `You are a friendly, knowledgeable AI shopping assistant for HyperStore — a premium e-commerce store.
We sell: Electronics, Clothes, Books, Sports gear, Home goods, and more.

Below is a list of real products from our database. Use these to answer the customer's question with specific, accurate recommendations.
IMPORTANT: Never say we don't carry a product if it appears in the list below. Never make up products that are not in the list.
If the specific item the customer wants is not in the list, recommend the closest match and suggest they browse the shop page.

Product catalog (search method: ${searchMethod}):
${productContext}`;

    // 5. Ask Mistral for a conversational response
    const completion = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-10),
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({
      reply,
      products: matches.slice(0, 5).map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
      })),
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
