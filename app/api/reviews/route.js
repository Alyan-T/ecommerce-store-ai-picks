import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Review from "@/models/Review";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/reviews?productId= -> list reviews + average rating for a product
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  await connectToDatabase();

  const reviews = await Review.find({ product: productId })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .lean();

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return NextResponse.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, count: reviews.length });
}

// POST /api/reviews -> submit a review (authenticated customers only)
export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const { productId, rating, comment } = await req.json();

  if (!productId || !rating || !comment?.trim()) {
    return NextResponse.json({ error: "productId, rating, and comment are required" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  try {
    const review = await Review.create({
      product: productId,
      user: user.id,
      rating: Number(rating),
      comment: comment.trim(),
    });

    const populated = await Review.findById(review._id).populate("user", "name").lean();
    return NextResponse.json({ review: populated }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key — user already reviewed this product
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 409 }
      );
    }
    throw err;
  }
}

// DELETE /api/reviews?id= -> admin can delete any review
export async function DELETE(req) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await connectToDatabase();
  await Review.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
