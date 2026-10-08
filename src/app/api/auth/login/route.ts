import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import {
  createSessionToken,
  verifyPassword,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  PORTAL_SESSION_COOKIE,
} from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Both Corporate Email and Secure Password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Brute-Force Rate Limiting Check
    const rateLimit = checkLoginRateLimit(cleanEmail);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Security Lockout: Too many failed login attempts for this account. Please wait ${rateLimit.retryAfterSeconds || 900} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Fetch User Record
    const user = portalDb.getUserByEmail(cleanEmail);

    if (!user || !user.isActive) {
      recordFailedLogin(cleanEmail);
      return NextResponse.json(
        { error: "Invalid corporate credentials or unauthorized account." },
        { status: 401 }
      );
    }

    // 3. High-Grade Cryptographic Password Verification
    if (!user.passwordHash) {
      recordFailedLogin(cleanEmail);
      return NextResponse.json(
        { error: "Account credentials misconfigured. Contact Super Admin." },
        { status: 401 }
      );
    }

    const isPasswordValid = verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      const lockStatus = recordFailedLogin(cleanEmail);
      if (lockStatus.locked) {
        return NextResponse.json(
          {
            error: "Maximum failed attempts exceeded. Account locked for 15 minutes to protect system security.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          error: "Invalid email or password. Failed authentication attempt has been recorded.",
        },
        { status: 401 }
      );
    }

    // 4. Successful Authentication: Reset Rate Limiter
    resetLoginAttempts(cleanEmail);

    // 5. Generate HMAC-Signed Session Token
    const token = createSessionToken(user);

    // 6. Update Last Login Timestamp & Audit Log
    portalDb.updateUser(
      user.id,
      {
        lastLoginAt: new Date().toISOString(),
      },
      { id: user.id, name: user.name, role: user.role }
    );

    portalDb.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "AUTH_LOGIN_SUCCESS",
      targetType: "user",
      targetId: user.id,
      details: `User ${user.name} (${user.email}) logged in successfully as '${user.role}'.`,
    });

    const redirectUrl = user.role === "super_admin" ? "/portal/admin" : "/portal/dispatcher";

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedShift: user.assignedShift,
      },
      redirectUrl,
    });

    // 7. Secure Cookie Configuration
    response.cookies.set({
      name: PORTAL_SESSION_COOKIE,
      value: token,
      httpOnly: false, // Allows Next.js client & middleware fast verification
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
