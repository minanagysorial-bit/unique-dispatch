import { NextResponse } from "next/server";
import { PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(PORTAL_SESSION_COOKIE);
  return response;
}
