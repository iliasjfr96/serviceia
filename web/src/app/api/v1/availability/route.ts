import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  listAvailabilitySlots,
  createAvailabilitySlot,
} from "@/lib/dal/appointments";

export async function GET(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(
    authCtx.tenantId,
    authCtx.role,
    request.nextUrl.searchParams.get("tenantId")
  );
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const slots = await listAvailabilitySlots(tenantId);
  return NextResponse.json(slots);
}

export async function POST(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(
    authCtx.tenantId,
    authCtx.role,
    request.nextUrl.searchParams.get("tenantId")
  );
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  try {
    const body = await request.json();

    if (body.dayOfWeek === undefined || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: "dayOfWeek, startTime et endTime requis" },
        { status: 400 }
      );
    }

    const slot = await createAvailabilitySlot(tenantId, body);
    return NextResponse.json(slot, { status: 201 });
  } catch (err) {
    console.error("Erreur creation creneau:", err);
    return NextResponse.json(
      { error: "Erreur lors de la creation du creneau" },
      { status: 500 }
    );
  }
}
