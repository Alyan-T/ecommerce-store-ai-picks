import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/admin/orders -> all orders with user info (admin only)
export async function GET(req) {
  const requester = getUserFromRequest(req);
  if (!requester || requester.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const orders = await Order.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ orders });
}

// PATCH /api/admin/orders -> update order status (admin only)
export async function PATCH(req) {
  const requester = getUserFromRequest(req);
  if (!requester || requester.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const { orderId, status } = await req.json();
  const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Fetch the current order before updating so we know the previous status
  const existingOrder = await Order.findById(orderId);
  if (!existingOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const previousStatus = existingOrder.status;

  // Update the order status
  existingOrder.status = status;
  await existingOrder.save();

  // ── Stock reconciliation ──────────────────────────────────────────────────
  // If the order is being CANCELLED and it wasn't already cancelled,
  // restore stock for all items in the order.
  if (status === "cancelled" && previousStatus !== "cancelled") {
    const stockRestores = existingOrder.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } },
      },
    }));

    if (stockRestores.length > 0) {
      await Product.bulkWrite(stockRestores, { ordered: false });
    }
  }

  // If the order is being UN-CANCELLED (moved back from cancelled to an active
  // status), deduct stock again — guard with a stock check.
  if (previousStatus === "cancelled" && status !== "cancelled") {
    const stockDeductions = existingOrder.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product, stock: { $gte: item.quantity } },
        update: { $inc: { stock: -item.quantity } },
      },
    }));

    if (stockDeductions.length > 0) {
      await Product.bulkWrite(stockDeductions, { ordered: false });
    }
  }

  return NextResponse.json({ order: existingOrder.toObject() });
}
