import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const incidents = portalDb.getIncidents(status);
    return NextResponse.json({ incidents });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}
