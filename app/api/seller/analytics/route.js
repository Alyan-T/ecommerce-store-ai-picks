import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/seller/analytics -> seller-scoped analytics
export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  // Get all this seller's products
  const myProducts = await Product.find({ createdBy: user.id }).select("_id name image").lean();
  const myProductIds = new Set(myProducts.map((p) => p._id.toString()));

  if (myProductIds.size === 0) {
    return NextResponse.json({
      revenueByMonth: [],
      topProducts: [],
      statusCounts: { pending: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 },
      totalRevenue: 0,
      avgOrderValue: 0,
    });
  }

  // Fetch all orders that contain at least one of this seller's products
  const allOrders = await Order.find({}).lean();
  const relevantOrders = allOrders.filter((o) =>
    o.items.some((item) => myProductIds.has(item.product?.toString()))
  );

  // ── Revenue by month (last 6 months) ──────────────────────────────────
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString("default", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      revenue: 0,
      orderCount: 0,
    });
  }

  const productTotals = {};
  const statusCounts = { pending: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 };
  let totalRevenue = 0;

  for (const order of relevantOrders) {
    // Status counts
    if (statusCounts[order.status] !== undefined) statusCounts[order.status]++;

    // Only count revenue from non-cancelled orders
    if (order.status === "cancelled") continue;

    const d = new Date(order.createdAt);
    const slot = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());

    let orderRevenue = 0;
    for (const item of order.items || []) {
      if (!myProductIds.has(item.product?.toString())) continue;
      const lineRevenue = item.price * item.quantity;
      orderRevenue += lineRevenue;
      totalRevenue += lineRevenue;

      const key = item.product.toString();
      if (!productTotals[key]) {
        productTotals[key] = { name: item.name, image: item.image, qty: 0, revenue: 0 };
      }
      productTotals[key].qty += item.quantity;
      productTotals[key].revenue += lineRevenue;
    }

    if (slot && orderRevenue > 0) {
      slot.revenue += orderRevenue;
      slot.orderCount += 1;
    }
  }

  const topProducts = Object.values(productTotals)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const nonCancelledOrders = relevantOrders.filter((o) => o.status !== "cancelled");
  const avgOrderValue =
    nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0;

  return NextResponse.json({
    revenueByMonth: months,
    topProducts,
    statusCounts,
    totalRevenue,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
  });
}
