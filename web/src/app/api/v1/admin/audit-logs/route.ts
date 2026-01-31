import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest } from "@/lib/dal/auth";
import { listAuditLogs } from "@/lib/dal/tenants";

export async function GET(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx || authCtx.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const result = await listAuditLogs({
    tenantId: params.get("tenantId") || undefined,
    userId: params.get("userId") || undefined,
    action: params.get("action") || undefined,
    page: parseInt(params.get("page") || "1"),
    limit: parseInt(params.get("limit") || "25"),
  });

  return NextResponse.json(result);
}
