import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import { createSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = portalDb.getUserByEmail(email);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials or account is deactivated" },
        { status: 401 }
      );
    }

    // In demo environment, standard passwords or demo accounts work seamlessly
    const token = createSessionToken(user);

    // Update last login
    portalDb.updateUser(user.id, {
      lastLoginAt: new Date().toISOString(),
    }, { id: user.id, name: user.name, role: user.role });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedShift: user.assignedShift,
      },
      redirectUrl: user.role === "super_admin" ? "/portal/admin" : "/portal/dispatcher",
    });

    // Set cookie
    response.cookies.set({
      name: PORTAL_SESSION_COOKIE,
      value: token,
      httpOnly: false, // Accessible in client for instant hydration
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
