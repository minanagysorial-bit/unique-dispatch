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
    const { loadId, category, severity, description, location, actionsTaken, detentionHours, claimAmountUSD } = body;

    if (!loadId || !category || !description) {
      return NextResponse.json(
        { error: "loadId, category, and description are required" },
        { status: 400 }
      );
    }

    const reportedById = session?.userId || "usr-disp-01";
    const reportedBy = session?.name || "Alex Reed";

    const incident = portalDb.reportIncident({
      loadId,
      category,
      severity: severity || "medium",
      description,
      location,
      actionsTaken,
      detentionHours: detentionHours ? Number(detentionHours) : undefined,
      claimAmountUSD: claimAmountUSD ? Number(claimAmountUSD) : undefined,
      reportedBy,
      reportedById,
    });

    return NextResponse.json({ success: true, incident });
  } catch (error: any) {
    console.error("POST /api/loads/escalate error:", error);
    return NextResponse.json({ error: error.message || "Failed to escalate incident" }, { status: 500 });
  }
}
