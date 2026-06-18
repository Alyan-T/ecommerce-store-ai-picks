import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  await connectToDatabase();

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "name, email and password are required" },
      { status: 400 }
    );
  }

  // Validate role
  const allowedRoles = ["customer", "seller", "admin"];
  const userRole = allowedRoles.includes(role) ? role : "customer";

  // Enforce single admin rule
  if (userRole === "admin") {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin account already exists. Only one admin is allowed." },
        { status: 409 }
      );
    }
  }

  // Check for duplicate email
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const user = await User.create({ name, email, password, role: userRole });

  const token = signToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });

  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
