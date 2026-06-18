import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { getUserFromRequest } from "@/lib/auth";

function sellerOnly(user) {
  if (!user || user.role !== "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET /api/seller/coupons -> seller's own coupons
export async function GET(req) {
  const user = getUserFromRequest(req);
  const err = sellerOnly(user);
  if (err) return err;

  await connectToDatabase();
  const coupons = await Coupon.find({ sellerOwner: user.id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ coupons });
}

// POST /api/seller/coupons -> create a seller-scoped coupon
export async function POST(req) {
  const user = getUserFromRequest(req);
  const err = sellerOnly(user);
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
      sellerOwner: user.id,
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (e) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Coupon code already exists." }, { status: 409 });
    }
    throw e;
  }
}

// PATCH /api/seller/coupons -> toggle active
export async function PATCH(req) {
  const user = getUserFromRequest(req);
  const err = sellerOnly(user);
  if (err) return err;

  await connectToDatabase();

  const { id, active } = await req.json();
  // Ensure seller owns this coupon
  const coupon = await Coupon.findOneAndUpdate(
    { _id: id, sellerOwner: user.id },
    { active },
    { new: true }
  ).lean();
  if (!coupon) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  return NextResponse.json({ coupon });
}

// DELETE /api/seller/coupons?id= -> delete a coupon
export async function DELETE(req) {
  const user = getUserFromRequest(req);
  const err = sellerOnly(user);
  if (err) return err;

  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await Coupon.findOneAndDelete({ _id: id, sellerOwner: user.id });
  return NextResponse.json({ success: true });
}
