import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";

export async function GET() {
  const handovers = portalDb.getShiftHandovers();
  return NextResponse.json({ handovers });
}
