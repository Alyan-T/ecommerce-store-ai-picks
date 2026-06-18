import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

// GET /api/coupons?code= -> validate a coupon code (public)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  await connectToDatabase();

  const coupon = await Coupon.findOne({ code }).lean();

  if (!coupon) {
    return NextResponse.json({ error: "Invalid coupon code." }, { status: 404 });
  }
  if (!coupon.active) {
    return NextResponse.json({ error: "This coupon is no longer active." }, { status: 400 });
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    discountPercent: coupon.discountPercent,
    code: coupon.code,
  });
}
