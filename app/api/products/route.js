import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { getEmbedding } from "@/lib/mistral";
import { getUserFromRequest } from "@/lib/auth";
import { getProductsCached } from "@/lib/products-cache";
import { revalidateTag } from "next/cache";
import { z } from "zod";

// Zod schema for query parameter validation (NoSQL Injection Defense)
const QuerySchema = z.object({
  category: z.string().nullable().optional(),
  search: z.string().nullable().optional(),
  seller: z.string().nullable().optional(),
  featured: z.string().nullable().optional(),
  minPrice: z.string().nullable().optional(),
  maxPrice: z.string().nullable().optional(),
  sortBy: z.string().nullable().optional(),
  limit: z.string().nullable().optional(),
  skip: z.string().nullable().optional(),
});

// Zod schema for creating a product (Strict Payload Validation)
const ProductCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  image: z.string().optional().default(""),
  stock: z.number().int().nonnegative("Stock cannot be negative").optional().default(100),
});

// GET /api/products -> list paginated, sorted, and filtered products
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Validate query parameters to block NoSQL query objects
    const validatedQuery = QuerySchema.parse({
      category: searchParams.get("category"),
      search: searchParams.get("search"),
      seller: searchParams.get("seller"),
      featured: searchParams.get("featured"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      sortBy: searchParams.get("sortBy"),
      limit: searchParams.get("limit"),
      skip: searchParams.get("skip"),
    });

    const user = getUserFromRequest(req);
    const includeDemo = user?.email === "demo.seller@hyperstore.com";

    const products = await getProductsCached({
      category: validatedQuery.category,
      search: validatedQuery.search,
      sellerId: validatedQuery.seller,
      featured: validatedQuery.featured,
      minPrice: validatedQuery.minPrice,
      maxPrice: validatedQuery.maxPrice,
      sortBy: validatedQuery.sortBy,
      limit: validatedQuery.limit,
      skip: validatedQuery.skip,
      includeDemo,
    });

    return NextResponse.json({ products });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    console.error("GET /api/products failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/products -> create a new product
export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    return NextResponse.json(
      { error: "Only admins and sellers can add products" },
      { status: 403 }
    );
  }

  await connectToDatabase();

  try {
    const body = await req.json();

    // Strict validation using Zod
    const validatedData = ProductCreateSchema.parse({
      name: body.name,
      description: body.description,
      price: body.price != null ? Number(body.price) : undefined,
      category: body.category,
      image: body.image,
      stock: body.stock != null ? Number(body.stock) : undefined,
    });

    // Generate an embedding for semantic search
    let embedding = [];
    try {
      embedding = await getEmbedding(
        `${validatedData.name}. ${validatedData.description}. Category: ${validatedData.category}.`
      );
    } catch (err) {
      console.error("Embedding generation failed:", err.message);
    }

    const product = await Product.create({
      name: validatedData.name,
      description: validatedData.description,
      price: validatedData.price,
      category: validatedData.category,
      image: validatedData.image,
      stock: validatedData.stock,
      embedding,
      createdBy: user.id,
      sellerName: user.name,
      isDemo: user.email === "demo.seller@hyperstore.com",
    });

    // Purge catalog cache tags instantly
    revalidateTag("catalog-products");

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST /api/products failed:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
