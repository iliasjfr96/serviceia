import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { updateProspectStage } from "@/lib/dal/prospects";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const { id } = await params;
  const { stage } = await request.json();

  const prospect = await updateProspectStage(tenantId, id, stage);

  if (!prospect) {
    return NextResponse.json(
      { error: "Prospect non trouve" },
      { status: 404 }
    );
  }

  return NextResponse.json(prospect);
}
