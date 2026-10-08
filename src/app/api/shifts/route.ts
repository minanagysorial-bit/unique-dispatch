import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import { cookies } from "next/headers";
import { parseSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export async function GET() {
  try {
    const shifts = portalDb.getShifts();
    return NextResponse.json({ shifts });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
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
    const { name, startTime, endTime, timezone, color, description } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Shift name, start time, and end time are required" },
        { status: 400 }
      );
    }

    const newShift = portalDb.createShift(
      {
        name: name.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        timezone: timezone || "EST",
        color: color || "amber",
        description: description || `Custom operational shift from ${startTime} to ${endTime} ${timezone || "EST"}.`,
      },
      { id: session.userId, name: session.name, role: session.role }
    );

    return NextResponse.json({ success: true, shift: newShift });
  } catch (error: any) {
    console.error("POST /api/shifts error:", error);
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 });
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
    let shiftId = searchParams.get("id");

    if (!shiftId) {
      try {
        const body = await req.json();
        shiftId = body.id;
      } catch (e) {
        // query fallback
      }
    }

    if (!shiftId) {
      return NextResponse.json({ error: "Shift ID is required" }, { status: 400 });
    }

    const success = portalDb.deleteShift(shiftId, {
      id: session.userId,
      name: session.name,
      role: session.role,
    });

    if (!success) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Shift removed successfully" });
  } catch (error: any) {
    console.error("DELETE /api/shifts error:", error);
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 });
  }
}
