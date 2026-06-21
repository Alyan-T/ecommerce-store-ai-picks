import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const origin = req.nextUrl.origin;
  const redirect_uri = `${origin}/api/auth/callback/google`;

  if (error || !code) {
    console.error("Google authentication error:", error);
    return NextResponse.redirect(new URL("/login?error=Google authentication failed", req.url));
  }

  try {
    // 1. Exchange OAuth code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("Token exchange failed:", tokens.error_description || tokens.error);
      return NextResponse.redirect(new URL("/login?error=Failed to retrieve tokens", req.url));
    }

    // 2. Fetch user information using the access token
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfo || !userInfo.email) {
      return NextResponse.redirect(new URL("/login?error=Failed to retrieve user info", req.url));
    }

    await connectToDatabase();

    // 3. Find or create the user in the database
    let user = await User.findOne({ email: userInfo.email.toLowerCase() });

    if (!user) {
      // Create user with a random dummy password (since schema requires one)
      const dummyPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      user = await User.create({
        name: userInfo.name || userInfo.given_name || "Google User",
        email: userInfo.email.toLowerCase(),
        password: dummyPassword,
        role: "customer", // Default role for OAuth signups
      });
    }

    // 4. Sign our custom JWT token (exactly like credentials login)
    const token = signToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // 5. Create redirect response and set the httpOnly "token" cookie
    const res = NextResponse.redirect(new URL("/", req.url));
    
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err) {
    console.error("Error in Google Auth callback:", err);
    return NextResponse.redirect(new URL("/login?error=An unexpected error occurred during login", req.url));
  }
}
