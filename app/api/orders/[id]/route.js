import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/orders/[id] -> single order (must belong to current user or admin)
export async function GET(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const order = await Order.findById(params.id).lean();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Customers can only see their own orders; admins can see all
  if (user.role !== "admin" && order.user.toString() !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order });
}
