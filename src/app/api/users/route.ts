import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import { cookies } from "next/headers";
import { parseSessionToken, hashPassword, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
    const session = token ? parseSessionToken(token) : null;
    const isSuperAdmin = session?.role === "super_admin";

    const users = portalDb.getUsers();

    // If Super Admin, return users with rawPassword for credentials distribution
    const sanitized = users.map(({ passwordHash, rawPassword, ...u }) => ({
      ...u,
      ...(isSuperAdmin && rawPassword ? { rawPassword } : {}),
    }));

    return NextResponse.json({ users: sanitized });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      email,
      role,
      assignedShift,
      shiftStartTime,
      shiftEndTime,
      shiftTimeRange,
      phone,
      password,
    } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = portalDb.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const initialPassword =
      password && password.trim()
        ? password.trim()
        : role === "super_admin"
        ? "UniqueAdmin2026!"
        : `UD-Disp-${Math.floor(1000 + Math.random() * 9000)}!`;

    const passwordHash = hashPassword(initialPassword);

    const newUser = portalDb.createUser(
      {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        rawPassword: initialPassword,
        role,
        assignedShift: assignedShift || "morning",
        shiftStartTime: shiftStartTime || undefined,
        shiftEndTime: shiftEndTime || undefined,
        shiftTimeRange: shiftTimeRange || undefined,
        phone: phone || "+1 (332) 244-5532",
        isActive: true,
      },
      { id: session.userId, name: session.name, role: session.role }
    );

    const { passwordHash: _, ...sanitizedUser } = newUser;
    return NextResponse.json({ success: true, user: sanitizedUser });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("id");

    if (!userId) {
      try {
        const body = await req.json();
        userId = body.id;
      } catch (e) {
        // query param fallback
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required for deletion" }, { status: 400 });
    }

    const result = portalDb.deleteUser(userId, {
      id: session.userId,
      name: session.name,
      role: session.role,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete user" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/users error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
