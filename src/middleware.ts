import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseEdgeSessionToken } from "@/lib/session-edge";
import { PORTAL_SESSION_COOKIE } from "@/lib/auth-constants";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Global CORS Preflight & Headers for all API Endpoints
  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-unique-dispatch-key",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
  }

  // 2. Only protect /portal/admin and /portal/dispatcher
  if (pathname.startsWith("/portal/admin") || pathname.startsWith("/portal/dispatcher")) {
    const token = req.cookies.get(PORTAL_SESSION_COOKIE)?.value;

    if (!token) {
      const loginUrl = new URL("/portal/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const payload = parseEdgeSessionToken(token);
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

  const response = NextResponse.next();

  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-unique-dispatch-key");
  }

  return response;
}

export const config = {
  matcher: ["/portal/admin/:path*", "/portal/dispatcher/:path*", "/api/:path*"],
};
