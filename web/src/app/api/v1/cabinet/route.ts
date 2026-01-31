import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { getTenant, updateTenant } from "@/lib/dal/tenants";

export async function GET(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const tenant = await getTenant(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PUT(request: NextRequest) {
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
    const updated = await updateTenant(tenantId, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur mise a jour" }, { status: 500 });
  }
}
