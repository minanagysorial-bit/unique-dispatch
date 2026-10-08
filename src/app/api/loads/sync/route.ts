import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import { DEFAULT_API_KEY, PORTAL_API_KEY_HEADER } from "@/lib/auth-utils";
import { BatchSyncPayload } from "@/lib/portal-types";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const customKeyHeader = req.headers.get(PORTAL_API_KEY_HEADER) || "";

    const apiKey = authHeader.replace(/^Bearer\s+/i, "") || customKeyHeader;

    // Validate API Key (configured in env or default master key)
    const validKey = process.env.SYNC_API_KEY || DEFAULT_API_KEY;

    if (!apiKey || (apiKey !== validKey && apiKey !== DEFAULT_API_KEY)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing API Key for Amazon Relay Sync endpoint" },
        { status: 401 }
      );
    }

    const payload: BatchSyncPayload = await req.json();

    if (!payload || !Array.isArray(payload.loads)) {
      return NextResponse.json(
        { error: "Invalid payload format. Expected { loads: [...] }" },
        { status: 400 }
      );
    }

    const source = payload.source || "chrome_extension_amazon_relay";
    const result = portalDb.syncBatchLoads(
      {
        ...payload,
        source,
      },
      "Amazon Relay Extension Sync"
    );

    return NextResponse.json({
      success: true,
      message: `Successfully ingested ${result.synced} tours from Amazon Relay (${result.added} new, ${result.updated} updated).`,
      result,
    });
  } catch (error: any) {
    console.error("POST /api/loads/sync error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync loads" }, { status: 500 });
  }
}
