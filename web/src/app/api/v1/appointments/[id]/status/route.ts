import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { updateAppointmentStatus } from "@/lib/dal/appointments";
import type { AppointmentStatus } from "@prisma/client";

export async function PATCH(
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
    const { status } = body as { status: AppointmentStatus };

    if (!status) {
      return NextResponse.json(
        { error: "status requis" },
        { status: 400 }
      );
    }

    const appointment = await updateAppointmentStatus(tenantId, id, status);
    if (!appointment) {
      return NextResponse.json({ error: "RDV non trouve" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (err) {
    console.error("Erreur changement statut RDV:", err);
    return NextResponse.json(
      { error: "Erreur lors du changement de statut" },
      { status: 500 }
    );
  }
}
