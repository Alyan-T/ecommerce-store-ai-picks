import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

// DELETE /api/admin/users/[id]
export async function DELETE(req, { params }) {
  const requester = getUserFromRequest(req);
  if (!requester || requester.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (params.id === requester.id) {
    return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
  }

  await connectToDatabase();

  try {
    const user = await User.findByIdAndDelete(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] -> update user role
export async function PATCH(req, { params }) {
  const requester = getUserFromRequest(req);
  if (!requester || requester.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role } = await req.json();
  const allowedRoles = ["customer", "seller"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role. Can only set customer or seller." }, { status: 400 });
  }

  if (params.id === requester.id) {
    return NextResponse.json({ error: "Cannot change your own admin role" }, { status: 400 });
  }

  await connectToDatabase();

  try {
    const user = await User.findByIdAndUpdate(params.id, { role }, { new: true }).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
