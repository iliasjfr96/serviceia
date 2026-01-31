import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  getProspectById,
  updateProspect,
  deleteProspect,
} from "@/lib/dal/prospects";

export async function GET(
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
  const prospect = await getProspectById(tenantId, id);

  if (!prospect) {
    return NextResponse.json(
      { error: "Prospect non trouve" },
      { status: 404 }
    );
  }

  return NextResponse.json(prospect);
}

export async function PUT(
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
  const body = await request.json();
  const prospect = await updateProspect(tenantId, id, body);

  if (!prospect) {
    return NextResponse.json(
      { error: "Prospect non trouve" },
      { status: 404 }
    );
  }

  return NextResponse.json(prospect);
}

export async function DELETE(
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
  const result = await deleteProspect(tenantId, id);

  if (!result) {
    return NextResponse.json(
      { error: "Prospect non trouve" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
