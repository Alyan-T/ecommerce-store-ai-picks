import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { getEmbedding } from "@/lib/mistral";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/products  -> list all products (optional ?category=&search=&seller=)
export async function GET(req) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sellerId = searchParams.get("seller"); // filter by seller
  const featured = searchParams.get("featured"); // filter by featured

  const query = {};
  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: "i" };
  if (sellerId) query.createdBy = sellerId;
  if (featured === "true") query.featured = true;

  const products = await Product.find(query)
    .select("-embedding")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ products });
}

// POST /api/products -> create a new product (admin or seller only)
export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    return NextResponse.json(
      { error: "Only admins and sellers can add products" },
      { status: 403 }
    );
  }

  await connectToDatabase();

  const body = await req.json();
  const { name, description, price, category, image, stock } = body;

  if (!name || !description || price == null || !category) {
    return NextResponse.json(
      { error: "name, description, price and category are required" },
      { status: 400 }
    );
  }

  // Generate an embedding for semantic search from the product's text
  let embedding = [];
  try {
    embedding = await getEmbedding(`${name}. ${description}. Category: ${category}.`);
  } catch (err) {
    console.error("Embedding generation failed:", err.message);
  }

  const product = await Product.create({
    name,
    description,
    price: Number(price),
    category,
    image: image || "",
    stock: stock != null ? Number(stock) : 100,
    embedding,
    createdBy: user.id,
    sellerName: user.name,
  });

  return NextResponse.json({ product }, { status: 201 });
}
