import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { getAvailableSlots } from "@/lib/dal/appointments";

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

  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json(
      { error: "Parametre date requis (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const date = new Date(dateParam);
  if (isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "Format de date invalide" },
      { status: 400 }
    );
  }

  const slots = await getAvailableSlots(tenantId, date);
  return NextResponse.json(slots);
}
