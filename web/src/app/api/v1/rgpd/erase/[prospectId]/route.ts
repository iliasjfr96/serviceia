import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { eraseProspectData } from "@/lib/dal/rgpd";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Only ADMIN or SUPER_ADMIN can erase data
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

  const { prospectId } = await params;
  const result = await eraseProspectData(tenantId, prospectId);
  if (!result) {
    return NextResponse.json(
      { error: "Prospect non trouve" },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
