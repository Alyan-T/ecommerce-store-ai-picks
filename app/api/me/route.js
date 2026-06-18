import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  const payload = getUserFromRequest(req);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  await connectToDatabase();
  const userObj = await User.findById(payload.id).select("-password").lean();
  if (!userObj) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: userObj._id.toString(),
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      address: userObj.address || null,
    },
  });
}
