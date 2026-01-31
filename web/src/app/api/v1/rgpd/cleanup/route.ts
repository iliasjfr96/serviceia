import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { cleanupExpiredData } from "@/lib/dal/rgpd";

export async function POST(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Only ADMIN or SUPER_ADMIN can trigger cleanup
  if (authCtx.role !== "ADMIN" && authCtx.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Droits insuffisants" },
      { status: 403 }
    );
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
    const result = await cleanupExpiredData(tenantId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Erreur nettoyage RGPD:", err);
    return NextResponse.json(
      { error: "Erreur lors du nettoyage" },
      { status: 500 }
    );
  }
}
