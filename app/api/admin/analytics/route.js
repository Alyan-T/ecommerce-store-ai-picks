import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/admin/analytics -> platform analytics (admin only)
export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const orders = await Order.find({}).lean();

  // ── Revenue by month (last 6 months) ────────────────────────────────────
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

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const d = new Date(order.createdAt);
    const slot = months.find(
      (m) => m.year === d.getFullYear() && m.month === d.getMonth()
    );
    if (slot) {
      slot.revenue += order.total || 0;
      slot.orderCount += 1;
    }
  }

  // ── Top 5 selling products by quantity ──────────────────────────────────
  const productTotals = {};
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items || []) {
      const key = item.product?.toString();
      if (!key) continue;
      if (!productTotals[key]) {
        productTotals[key] = { name: item.name, image: item.image, qty: 0, revenue: 0 };
      }
      productTotals[key].qty += item.quantity;
      productTotals[key].revenue += item.price * item.quantity;
    }
  }
  const topProducts = Object.values(productTotals)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // ── Orders by status ─────────────────────────────────────────────────────
  const statusCounts = { pending: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 };
  for (const order of orders) {
    if (statusCounts[order.status] !== undefined) statusCounts[order.status]++;
  }

  // ── Low stock products ───────────────────────────────────────────────────
  // (handled client-side from existing product data; no extra query needed)

  return NextResponse.json({
    revenueByMonth: months,
    topProducts,
    statusCounts,
    totalRevenue: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + (o.total || 0), 0),
  });
}
