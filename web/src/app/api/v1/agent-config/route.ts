import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { getAgentConfig, updateAgentConfig } from "@/lib/dal/agent-config";

export async function GET(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const config = await getAgentConfig(tenantId);
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const body = await request.json();
  const config = await updateAgentConfig(tenantId, body);
  return NextResponse.json(config);
}
