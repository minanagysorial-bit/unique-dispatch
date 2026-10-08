import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /portal/admin and /portal/dispatcher
  if (pathname.startsWith("/portal/admin") || pathname.startsWith("/portal/dispatcher")) {
    const token = req.cookies.get(PORTAL_SESSION_COOKIE)?.value;

    if (!token) {
      const loginUrl = new URL("/portal/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const payload = parseSessionToken(token);
    if (!payload) {
      const loginUrl = new URL("/portal/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based protection: /portal/admin is strictly for super_admin
    if (pathname.startsWith("/portal/admin") && payload.role !== "super_admin") {
      const dispatcherUrl = new URL("/portal/dispatcher", req.url);
      return NextResponse.redirect(dispatcherUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/admin/:path*", "/portal/dispatcher/:path*"],
};
