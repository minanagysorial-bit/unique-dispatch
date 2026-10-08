import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import { cookies } from "next/headers";
import { parseSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
    const session = token ? parseSessionToken(token) : null;

    const body = await req.json();
    const { fromShift, toShift, watchItems, generalNotes } = body;

    const fromDispatcherId = session ? session.userId : "usr-disp-01";
    const fromDispatcherName = session ? session.name : "Alex Reed";

    const handover = portalDb.createShiftHandover({
      fromDispatcherId,
      fromDispatcherName,
      fromShift: fromShift || "morning",
      toShift: toShift || "night",
      watchItems: Array.isArray(watchItems) ? watchItems : [watchItems].filter(Boolean),
      generalNotes: generalNotes || "Shift handover completed smoothly.",
    });

    return NextResponse.json({ success: true, handover });
  } catch (error: any) {
    console.error("POST /api/shifts/handover error:", error);
    return NextResponse.json({ error: "Failed to submit shift handover" }, { status: 500 });
  }
}
