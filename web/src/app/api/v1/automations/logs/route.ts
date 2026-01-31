import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { listAutomationLogs } from "@/lib/dal/automations";

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

  const params = request.nextUrl.searchParams;
  const result = await listAutomationLogs(tenantId, {
    ruleId: params.get("ruleId") || undefined,
    status: params.get("status") || undefined,
    page: parseInt(params.get("page") || "1"),
    limit: parseInt(params.get("limit") || "25"),
  });

  return NextResponse.json(result);
}
