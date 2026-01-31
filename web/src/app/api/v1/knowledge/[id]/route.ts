import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  getKnowledgeDocument,
  updateKnowledgeDocument,
  deleteKnowledgeDocument,
} from "@/lib/dal/knowledge";

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
  const doc = await getKnowledgeDocument(tenantId, id);
  if (!doc) {
    return NextResponse.json({ error: "Document non trouve" }, { status: 404 });
  }

  return NextResponse.json(doc);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();
    const doc = await updateKnowledgeDocument(tenantId, id, body);
    if (!doc) {
      return NextResponse.json({ error: "Document non trouve" }, { status: 404 });
    }
    return NextResponse.json(doc);
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

  if (authCtx.role !== "SUPER_ADMIN" && authCtx.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const { id } = await params;
  const doc = await deleteKnowledgeDocument(tenantId, id);
  if (!doc) {
    return NextResponse.json({ error: "Document non trouve" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
