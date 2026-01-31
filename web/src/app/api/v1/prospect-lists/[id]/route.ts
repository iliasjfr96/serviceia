import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  getProspectList,
  updateProspectList,
  deleteProspectList,
} from "@/lib/dal/prospect-lists";

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
  const list = await getProspectList(tenantId, id);
  if (!list) {
    return NextResponse.json({ error: "Liste non trouvee" }, { status: 404 });
  }

  return NextResponse.json(list);
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

  try {
    const { id } = await params;
    const body = await request.json();
    const list = await updateProspectList(tenantId, id, body);
    if (!list) {
      return NextResponse.json(
        { error: "Liste non trouvee" },
        { status: 404 }
      );
    }
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: "Erreur mise a jour" }, { status: 500 });
  }
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
  const list = await deleteProspectList(tenantId, id);
  if (!list) {
    return NextResponse.json({ error: "Liste non trouvee" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
