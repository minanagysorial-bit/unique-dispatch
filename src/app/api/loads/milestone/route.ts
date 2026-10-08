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
    const { loadId, milestone, messageContent, channel } = body;

    if (!loadId || !milestone) {
      return NextResponse.json({ error: "loadId and milestone are required" }, { status: 400 });
    }

    const dispatcherId = session?.userId || "usr-disp-01";
    const dispatcherName = session?.name || "Alex Reed";

    const log = portalDb.logMilestoneMessage({
      loadId,
      dispatcherId,
      dispatcherName,
      milestone,
      messageContent: messageContent || `Milestone ${milestone} checked by ${dispatcherName}`,
      channel: channel || "sms",
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error("POST /api/loads/milestone error:", error);
    return NextResponse.json({ error: error.message || "Failed to log milestone" }, { status: 500 });
  }
}
