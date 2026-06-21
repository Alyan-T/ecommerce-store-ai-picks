import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { getUserFromRequest } from "@/lib/auth";
import { getEmbedding } from "@/lib/mistral";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import mongoose from "mongoose";

// Zod schema for product updates (Strict Payload Validation)
const ProductUpdateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100).optional(),
  description: z.string().min(1, "Description cannot be empty").optional(),
  price: z.number().positive("Price must be a positive number").optional(),
  category: z.string().min(1, "Category cannot be empty").optional(),
  image: z.string().optional(),
  stock: z.number().int().nonnegative("Stock cannot be negative").optional(),
  featured: z.boolean().optional(),
});

// GET /api/products/[id]
export async function GET(req, context) {
  const { params } = context;
  const { id } = await params;

  // Sanitize path parameter to block NoSQL query object injections
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
  }
  
  await connectToDatabase();

  try {
    const product = await Product.findById(id).select("-embedding").lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.isDemo) {
      const user = getUserFromRequest(req);
      if (user?.email !== "demo.seller@hyperstore.com") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ product });
  } catch (err) {
    console.error("Error fetching product:", err);
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

// PUT /api/products/[id] -> update a product
export async function PUT(req, context) {
  const { params } = context;
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
  }
  
  const user = getUserFromRequest(req);
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    return NextResponse.json(
      { error: "Only admins and sellers can update products" },
      { status: 403 }
    );
  }

  await connectToDatabase();

  try {
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Sellers can only edit their own products
    if (user.role === "seller" && product.createdBy?.toString() !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own products" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Strict validation using Zod
    const validatedData = ProductUpdateSchema.parse({
      name: body.name,
      description: body.description,
      price: body.price != null ? Number(body.price) : undefined,
      category: body.category,
      image: body.image,
      stock: body.stock != null ? Number(body.stock) : undefined,
      featured: body.featured,
    });

    if (validatedData.name) product.name = validatedData.name;
    if (validatedData.description) product.description = validatedData.description;
    if (validatedData.price != null) product.price = validatedData.price;
    if (validatedData.category) product.category = validatedData.category;
    if (validatedData.image !== undefined) product.image = validatedData.image;
    if (validatedData.stock != null) product.stock = validatedData.stock;
    if (validatedData.featured !== undefined && user.role === "admin") product.featured = validatedData.featured;

    // Regenerate embedding if name, description or category changed
    if (validatedData.name || validatedData.description || validatedData.category) {
      try {
        product.embedding = await getEmbedding(
          `${product.name}. ${product.description}. Category: ${product.category}.`
        );
      } catch (err) {
        console.error("Embedding regeneration failed:", err.message);
      }
    }

    await product.save();

    // Purge catalog cache tags instantly
    revalidateTag("catalog-products");

    // Return without embedding
    const updated = product.toObject();
    delete updated.embedding;
    return NextResponse.json({ product: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(req, context) {
  const { params } = context;
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
  }
  
  const user = getUserFromRequest(req);
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    return NextResponse.json(
      { error: "Only admins and sellers can delete products" },
      { status: 403 }
    );
  }

  await connectToDatabase();

  try {
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Sellers can only delete their own products
    if (user.role === "seller" && product.createdBy?.toString() !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own products" },
        { status: 403 }
      );
    }

    await product.deleteOne();

    // Purge catalog cache tags instantly
    revalidateTag("catalog-products");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}