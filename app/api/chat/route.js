import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { mistral, getEmbedding } from "@/lib/mistral";

// POST /api/chat
// body: { message: string, history: [{ role, content }] }
export async function POST(req) {
  await connectToDatabase();

  const { message, history = [] } = await req.json();

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // 1. Turn the user's message into a vector
  const queryEmbedding = await getEmbedding(message);

  // 2. Run a vector search against the "vector_index" defined in Atlas
  //    on the Product collection's "embedding" field.
  let matches = [];
  try {
    matches = await Product.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 5,
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          category: 1,
          image: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
  } catch (err) {
    // If the vector index doesn't exist yet, fall back gracefully
    console.error("Vector search failed:", err.message);
    matches = [];
  }

  // 3. Build context from the matched products for the LLM
  const productContext = matches.length
    ? matches
        .map(
          (p, i) =>
            `${i + 1}. ${p.name} - $${p.price} (${p.category})\n   ${p.description}`
        )
        .join("\n")
    : "No matching products were found in the catalog.";

  const systemPrompt = `You are a friendly, helpful shopping assistant for HyperStore (our fashion and lifestyle e-commerce store).
We offer high-quality products across multiple categories, including:
- Electronics (gadgets, devices)
- Clothes (fashion, apparel, accessories)
- Books (literature, guides, educational)
- Sports (gear, activewear, outdoor equipment)
- Home (decor, furniture, essentials)
- Other general goods

Use the product matches below to answer the customer's question and make recommendations.
Only recommend products from the provided list of matches.
If no matching products are found or if they do not suit the customer's query well, say so honestly and suggest they browse the shop page for other categories. Keep responses concise, warm, editorial, and conversational.

Relevant product matches:
${productContext}`;

  // 4. Ask the LLM for a conversational response
  const completion = await mistral.chat.complete({
    model: "mistral-small-latest",
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ],
  });

  const reply = completion.choices[0].message.content;

  return NextResponse.json({
    reply,
    products: matches.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
    })),
  });
}
