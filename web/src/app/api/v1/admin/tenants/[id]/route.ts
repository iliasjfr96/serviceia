import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest } from "@/lib/dal/auth";
import { getTenant, updateTenant } from "@/lib/dal/tenants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx || authCtx.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx || authCtx.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const tenant = await updateTenant(id, body);
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant non trouve" },
        { status: 404 }
      );
    }
    return NextResponse.json(tenant);
  } catch (err) {
    console.error("Erreur mise a jour tenant:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour" },
      { status: 500 }
    );
  }
}
