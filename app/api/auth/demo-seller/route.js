import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  try {
    await connectToDatabase();

    const email = "demo.seller@hyperstore.com";

    // Find or create the demo seller user
    let user = await User.findOne({ email });

    if (!user) {
      const dummyPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      user = await User.create({
        name: "Demo Seller",
        email,
        password: dummyPassword,
        role: "seller",
      });
    }

    // Sign the token
    const token = signToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error("Demo seller login failed:", error);
    return NextResponse.json({ error: "Failed to authenticate demo seller" }, { status: 500 });
  }
}
