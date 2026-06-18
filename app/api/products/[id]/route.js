import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { getUserFromRequest } from "@/lib/auth";
import { getEmbedding } from "@/lib/mistral";

// GET /api/products/[id]
export async function GET(req, context) {
  const { params } = context;
  const { id } = await params;
  
  await connectToDatabase();

  try {
    const product = await Product.findById(id).select("-embedding").lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (err) {
    console.error("Error fetching product:", err);
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

// PUT /api/products/[id] -> update a product
// Admin: can update any product
// Seller: can only update their own products
export async function PUT(req, context) {
  const { params } = context;
  const { id } = await params;
  
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
    const { name, description, price, category, image, stock, featured } = body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price != null) product.price = Number(price);
    if (category) product.category = category;
    if (image !== undefined) product.image = image;
    if (stock != null) product.stock = Number(stock);
    if (featured !== undefined && user.role === "admin") product.featured = Boolean(featured);

    // Regenerate embedding if name, description or category changed
    if (name || description || category) {
      try {
        product.embedding = await getEmbedding(
          `${product.name}. ${product.description}. Category: ${product.category}.`
        );
      } catch (err) {
        console.error("Embedding regeneration failed:", err.message);
      }
    }

    await product.save();

    // Return without embedding
    const updated = product.toObject();
    delete updated.embedding;
    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("Error updating product:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/products/[id]
// Admin: can delete any product
// Seller: can only delete their own products
export async function DELETE(req, context) {
  const { params } = context;
  const { id } = await params;
  
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
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}