import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import { getUserFromRequest } from "@/lib/auth";

// Add wishlist field to User schema dynamically if not present
// We'll use a simple approach: store wishlist as an array on a separate collection or
// piggyback as a sparse JSON on the User. Simplest: we store it in-memory via a Map
// and use the me endpoint to load. For a real implementation we add to User model.
// Here we use a lightweight approach: wishlist stored as product IDs in User.wishlist

// GET /api/wishlist
export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const dbUser = await User.findById(user.id).select("wishlist").lean();
  if (!dbUser) return NextResponse.json({ products: [] });

  const wishlistIds = dbUser.wishlist || [];
  if (wishlistIds.length === 0) return NextResponse.json({ products: [] });

  const query = { _id: { $in: wishlistIds } };
  if (user.email !== "demo.seller@hyperstore.com") {
    query.isDemo = { $ne: true };
  }
  const products = await Product.find(query)
    .select("-embedding")
    .lean();

  return NextResponse.json({ products });
}

// POST /api/wishlist — toggle a product in/out of wishlist
export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const dbUser = await User.findById(user.id);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!dbUser.wishlist) dbUser.wishlist = [];

  const idx = dbUser.wishlist.findIndex((id) => id.toString() === productId);
  let added;
  if (idx === -1) {
    dbUser.wishlist.push(productId);
    added = true;
  } else {
    dbUser.wishlist.splice(idx, 1);
    added = false;
  }

  // Use updateOne to avoid re-hashing password via pre-save hook
  await User.updateOne({ _id: user.id }, { $set: { wishlist: dbUser.wishlist } });

  return NextResponse.json({ added, wishlist: dbUser.wishlist });
}
