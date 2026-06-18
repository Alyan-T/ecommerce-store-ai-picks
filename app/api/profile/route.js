import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest, signToken } from "@/lib/auth";

// PATCH /api/profile -> update name and email
export async function PATCH(req) {
  const requester = getUserFromRequest(req);
  if (!requester) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const { name, email } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Check email uniqueness
  const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: requester.id } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use by another account" }, { status: 409 });
  }

  const user = await User.findByIdAndUpdate(
    requester.id,
    { name, email: email.toLowerCase() },
    { new: true }
  ).select("-password").lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Re-issue token with updated info
  const newToken = signToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });

  res.cookies.set("token", newToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
