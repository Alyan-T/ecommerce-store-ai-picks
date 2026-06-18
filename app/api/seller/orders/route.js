import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/seller/orders -> orders containing this seller's products
export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  // Find all products belonging to this seller
  const myProducts = await Product.find({ createdBy: user.id }).select("_id name").lean();
  const myProductIds = myProducts.map((p) => p._id.toString());

  if (myProductIds.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  // Find all orders that contain at least one of this seller's products
  const allOrders = await Order.find({}).sort({ createdAt: -1 }).lean();

  const relevantOrders = allOrders
    .map((order) => {
      // Annotate each item with sellerName if it belongs to this seller
      const annotatedItems = order.items.map((item) => {
        const isMyProduct = myProductIds.includes(item.product?.toString());
        return {
          ...item,
          sellerName: isMyProduct ? user.name : null,
        };
      });
      const hasMyProducts = annotatedItems.some((i) => i.sellerName === user.name);
      return hasMyProducts ? { ...order, items: annotatedItems } : null;
    })
    .filter(Boolean);

  return NextResponse.json({ orders: relevantOrders });
}

// PATCH /api/seller/orders -> update order status (sellers can update orders
// that contain at least one of their products)
export async function PATCH(req) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const { orderId, status } = await req.json();

  const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify the order contains at least one product belonging to this seller
  const myProducts = await Product.find({ createdBy: user.id }).select("_id").lean();
  const myProductIds = new Set(myProducts.map((p) => p._id.toString()));

  const order = await Order.findById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const sellerOwnsItem = order.items.some((item) =>
    myProductIds.has(item.product?.toString())
  );

  if (!sellerOwnsItem) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const previousStatus = order.status;
  order.status = status;
  await order.save();

  // ── Stock reconciliation (mirrors admin route logic) ──────────────────────
  // Cancelling: restore stock for ALL items in the order (not just seller's),
  // because the order is one unit — the seller controls its fulfilment status.
  if (status === "cancelled" && previousStatus !== "cancelled") {
    const stockRestores = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } },
      },
    }));
    if (stockRestores.length > 0) {
      await Product.bulkWrite(stockRestores, { ordered: false });
    }
  }

  // Un-cancelling: re-deduct stock
  if (previousStatus === "cancelled" && status !== "cancelled") {
    const stockDeductions = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product, stock: { $gte: item.quantity } },
        update: { $inc: { stock: -item.quantity } },
      },
    }));
    if (stockDeductions.length > 0) {
      await Product.bulkWrite(stockDeductions, { ordered: false });
    }
  }

  return NextResponse.json({ order: order.toObject() });
}
