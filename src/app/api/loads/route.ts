import { NextResponse } from "next/server";
import { portalDb } from "@/lib/portal-db";
import { cookies } from "next/headers";
import { parseSessionToken, PORTAL_SESSION_COOKIE } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const shift = (searchParams.get("shift") as any) || undefined;
    const dispatcherId = searchParams.get("dispatcherId") || undefined;
    const search = searchParams.get("search") || undefined;
    const criticalOnly = searchParams.get("critical") === "true";
    const sort = searchParams.get("sort") || "screen";

    const loads = portalDb.getLoads({
      status,
      shift,
      dispatcherId,
      search,
      criticalOnly,
      sort,
    });

    const syncHealth = portalDb.getSyncHealth();

    return NextResponse.json({ loads, syncHealth });
  } catch (error: any) {
    console.error("GET /api/loads error:", error);
    return NextResponse.json({ error: "Failed to fetch loads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
    const session = token ? parseSessionToken(token) : null;

    const actor = session ? { id: session.userId, name: session.name, role: session.role } : { id: "system", name: "Dispatcher Ops", role: "dispatcher" };

    const body = await req.json();

    if (!body.vrid || !body.originCity || !body.destCity || !body.pickupTime || !body.deliveryTime) {
      return NextResponse.json(
        { error: "Missing required load fields (vrid, originCity, destCity, pickupTime, deliveryTime)" },
        { status: 400 }
      );
    }

    const load = portalDb.createLoad(
      {
        vrid: body.vrid,
        source: body.source || "amazon_relay",
        equipment: body.equipment || "Dry Van (53')",
        rateUSD: Number(body.rateUSD) || 3000.0,
        weightLbs: Number(body.weightLbs) || 38000,
        originCity: body.originCity,
        originState: body.originState || "NY",
        originAddress: body.originAddress,
        originFacilityCode: body.originFacilityCode,
        pickupTime: body.pickupTime,
        destCity: body.destCity,
        destState: body.destState || "IL",
        destAddress: body.destAddress,
        destFacilityCode: body.destFacilityCode,
        deliveryTime: body.deliveryTime,
        driverName: body.driverName || "Assigned Driver",
        driverPhone: body.driverPhone || "+1 (555) 000-0000",
        tractorNumber: body.tractorNumber || "UD-TBD",
        trailerNumber: body.trailerNumber || "TR-TBD",
        carrierName: body.carrierName || "Unique Dispatch Fleet",
        carrierMcDot: body.carrierMcDot || "MC-ACTIVE",
        status: body.status || "upcoming",
        currentShift: body.currentShift || "morning",
        assignedDispatcherId: body.assignedDispatcherId || actor.id,
        assignedDispatcherName: body.assignedDispatcherName || actor.name,
        pickupCheckinSent: false,
        deliveryCheckinSent: false,
        isCriticalAlert: false,
        hasActiveIncident: false,
        incidentCount: 0,
        notes: body.notes || "Created manually via Dispatcher Board",
      },
      actor
    );

    return NextResponse.json({ success: true, load });
  } catch (error: any) {
    console.error("POST /api/loads error:", error);
    return NextResponse.json({ error: "Failed to create load" }, { status: 500 });
  }
}
