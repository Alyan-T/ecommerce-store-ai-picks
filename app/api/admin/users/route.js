import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/admin/users -> list all users (admin only)
export async function GET(req) {
  const requester = getUserFromRequest(req);
  if (!requester || requester.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const users = await User.find({})
    .select("-password -__v")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ users });
}
