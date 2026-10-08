import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 100;

    const auditLogs = portalDb.getAuditLogs(limit);
    return NextResponse.json({ auditLogs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
