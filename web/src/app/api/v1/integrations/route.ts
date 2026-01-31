import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  listIntegrations,
  createIntegration,
  getIntegrationStatus,
} from "@/lib/dal/integrations";

export async function GET(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;

  if (searchParams.get("status") === "true") {
    const status = await getIntegrationStatus(tenantId);
    return NextResponse.json(status);
  }

  const integrations = await listIntegrations(tenantId);
  return NextResponse.json(integrations);
}

export async function POST(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  if (authCtx.role !== "SUPER_ADMIN" && authCtx.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const integration = await createIntegration(tenantId, body);
    return NextResponse.json(integration, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur creation integration" },
      { status: 500 }
    );
  }
}
