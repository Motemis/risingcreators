import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const user = await currentUser();
  
  if (!user) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/youtube/callback`;
  
  const scope = encodeURIComponent("https://www.googleapis.com/auth/youtube.readonly");
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${user.id}`;

  return NextResponse.redirect(authUrl);
}



