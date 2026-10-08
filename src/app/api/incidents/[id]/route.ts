import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import { cookies } from "next/headers";
import { parseSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
    const session = token ? parseSessionToken(token) : null;

    const body = await req.json();
    const { status, resolutionNotes } = body;

    const resolvedBy = session ? session.name : "Super Admin Desk";
    const resolvedById = session ? session.userId : "usr-admin-01";

    const updated = portalDb.resolveIncident(id, {
      status: status || "resolved",
      resolutionNotes: resolutionNotes || "Reviewed and updated by management",
      resolvedBy,
      resolvedById,
    });

    if (!updated) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, incident: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }
}
