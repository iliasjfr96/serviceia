import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
} from "@/lib/dal/appointments";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();
    const slot = await updateAvailabilitySlot(tenantId, id, body);
    if (!slot) {
      return NextResponse.json(
        { error: "Creneau non trouve" },
        { status: 404 }
      );
    }
    return NextResponse.json(slot);
  } catch (err) {
    console.error("Erreur mise a jour creneau:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const result = await deleteAvailabilitySlot(tenantId, id);
  if (!result) {
    return NextResponse.json(
      { error: "Creneau non trouve" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
