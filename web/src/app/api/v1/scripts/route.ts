import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { listScripts, createScript, listPracticeAreas } from "@/lib/dal/scripts";

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

  if (searchParams.get("practiceAreas") === "true") {
    const areas = await listPracticeAreas(tenantId);
    return NextResponse.json(areas);
  }

  const scripts = await listScripts(tenantId);
  return NextResponse.json(scripts);
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
    const script = await createScript(tenantId, body);
    return NextResponse.json(script, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur creation script" }, { status: 500 });
  }
}
