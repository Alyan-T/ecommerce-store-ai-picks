import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import Coupon from "@/models/Coupon";

// GET /api/orders -> orders for the logged-in user
export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const orders = await Order.find({ user: user.id }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ orders });
}

// POST /api/orders -> create a new order from the cart
export async function POST(req) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const { items, shippingAddress, couponCode, paymentMethod, paymentDetails } = await req.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // ── 1. Validate stock for every item before touching anything ──────────────
  const productIds = items.map((item) => item._id);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  for (const item of items) {
    const product = productMap[item._id];
    if (!product) {
      return NextResponse.json(
        { error: `Product "${item.name}" no longer exists.` },
        { status: 400 }
      );
    }
    if (product.isDemo && user.email !== "demo.seller@hyperstore.com") {
      return NextResponse.json(
        { error: `Product "${item.name}" is not available.` },
        { status: 400 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `"${product.name}" only has ${product.stock} unit${product.stock === 1 ? "" : "s"} left in stock.`,
        },
        { status: 400 }
      );
    }
  }

  // ── 2. Decrement stock atomically with bulkWrite ───────────────────────────
  const stockUpdates = items.map((item) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(item._id), stock: { $gte: Number(item.quantity) } }, // safety re-check
      update: { $inc: { stock: -Number(item.quantity) } },
    },
  }));

  const bulkResult = await Product.bulkWrite(stockUpdates, { ordered: false });

  // If any update didn't match (race condition / stock ran out between steps)
  if (bulkResult.modifiedCount < items.length) {
    return NextResponse.json(
      { error: "One or more items went out of stock just now. Please refresh your cart." },
      { status: 409 }
    );
  }

  // ── 3. Handle Coupon & Address ─────────────────────────────────────────────
  let subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount = 0;
  let coupon = null;

  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
    if (coupon && coupon.active) {
      const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
      const limitReached = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
      if (!isExpired && !limitReached) {
        discount = (subtotal * coupon.discountPercent) / 100;
        // Increment coupon count
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }
  }

  const finalTotal = subtotal - discount;

  // Persist User Shipping Address if provided
  if (shippingAddress) {
    await User.findByIdAndUpdate(user.id, { address: shippingAddress });
  }

  // ── 4. Create the order ───────────────────────────────────────────────────
  const orderItems = items.map((item) => ({
    product: item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  }));

  const order = await Order.create({
    user: user.id,
    items: orderItems,
    total: finalTotal,
    shippingAddress,
    status: "paid", // simplified - no real payment gateway wired up yet
    paymentMethod: paymentMethod || "Demo",
    paymentDetails: paymentDetails || {},
  });

  return NextResponse.json({ order }, { status: 201 });
}
