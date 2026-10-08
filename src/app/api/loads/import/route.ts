import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import { cookies } from "next/headers";
import { parseSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
    const session = token ? parseSessionToken(token) : null;

    const actorName = session ? session.name : "Manual Import Desk";

    const body = await req.json();
    const { loads, shift } = body;

    if (!Array.isArray(loads) || loads.length === 0) {
      return NextResponse.json({ error: "Empty or invalid loads list" }, { status: 400 });
    }

    const result = portalDb.syncBatchLoads(
      {
        apiKey: "manual-session",
        source: "csv_import",
        shift: shift || "morning",
        loads,
      },
      actorName
    );

    return NextResponse.json({
      success: true,
      message: `Imported ${result.synced} loads successfully.`,
      result,
    });
  } catch (error: any) {
    console.error("POST /api/loads/import error:", error);
    return NextResponse.json({ error: "Failed to import loads" }, { status: 500 });
  }
}
