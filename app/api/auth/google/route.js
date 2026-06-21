import { NextResponse } from "next/server";

export async function GET(req) {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const origin = req.nextUrl.origin;
  const redirect_uri = `${origin}/api/auth/callback/google`;
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${client_id}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("openid email profile")}` +
    `&prompt=consent` +
    `&access_type=offline`;

  return NextResponse.redirect(googleAuthUrl);
}
