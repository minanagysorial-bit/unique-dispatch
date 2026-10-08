import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import { cookies } from "next/headers";
import { parseSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const load = portalDb.getLoadById(id);

  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  const messages = portalDb.getMessageLogs(load.id);
  const incidents = portalDb.getIncidents().filter((i) => i.loadId === load.id);

  return NextResponse.json({ load, messages, incidents });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
    const session = token ? parseSessionToken(token) : null;

    const actor = session ? { id: session.userId, name: session.name, role: session.role } : { id: "system", name: "Dispatcher Ops", role: "dispatcher" };

    const body = await req.json();
    const updated = portalDb.updateLoad(id, body, actor);

    if (!updated) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, load: updated });
  } catch (error: any) {
    console.error("PATCH /api/loads/[id] error:", error);
    return NextResponse.json({ error: "Failed to update load" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const success = portalDb.deleteLoad(id, { id: session.userId, name: session.name, role: session.role });

    if (!success) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete load" }, { status: 500 });
  }
}
