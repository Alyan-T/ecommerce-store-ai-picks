import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { getUserFromRequest } from "@/lib/auth";

function adminOnly(user) {
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET /api/admin/coupons -> list all coupons
export async function GET(req) {
  const user = getUserFromRequest(req);
  const err = adminOnly(user);
  if (err) return err;

  await connectToDatabase();
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ coupons });
}

// POST /api/admin/coupons -> create a coupon
export async function POST(req) {
  const user = getUserFromRequest(req);
  const err = adminOnly(user);
  if (err) return err;

  await connectToDatabase();

  const { code, discountPercent, maxUses, expiresAt } = await req.json();

  if (!code || !discountPercent) {
    return NextResponse.json({ error: "code and discountPercent are required" }, { status: 400 });
  }

  try {
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountPercent: Number(discountPercent),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: user.id,
      sellerOwner: null,
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (e) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Coupon code already exists." }, { status: 409 });
    }
    throw e;
  }
}

// PATCH /api/admin/coupons -> toggle active
export async function PATCH(req) {
  const user = getUserFromRequest(req);
  const err = adminOnly(user);
  if (err) return err;

  await connectToDatabase();

  const { id, active } = await req.json();
  const coupon = await Coupon.findByIdAndUpdate(id, { active }, { new: true }).lean();
  if (!coupon) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ coupon });
}

// DELETE /api/admin/coupons?id= -> delete a coupon
export async function DELETE(req) {
  const user = getUserFromRequest(req);
  const err = adminOnly(user);
  if (err) return err;

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await Coupon.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
