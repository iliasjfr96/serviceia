import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  listKnowledgeDocuments,
  createKnowledgeDocument,
  getKnowledgeStats,
} from "@/lib/dal/knowledge";

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

  if (searchParams.get("stats") === "true") {
    const stats = await getKnowledgeStats(tenantId);
    return NextResponse.json(stats);
  }

  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const result = await listKnowledgeDocuments(tenantId, { search, page, limit });
  return NextResponse.json(result);
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
    const doc = await createKnowledgeDocument(tenantId, body);
    return NextResponse.json(doc, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur creation document" }, { status: 500 });
  }
}
