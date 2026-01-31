import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  listAutomationRules,
  createAutomationRule,
  getAutomationStats,
} from "@/lib/dal/automations";

export async function GET(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(
    authCtx.tenantId,
    authCtx.role,
    request.nextUrl.searchParams.get("tenantId")
  );
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  if (request.nextUrl.searchParams.get("stats") === "true") {
    const stats = await getAutomationStats(tenantId);
    return NextResponse.json(stats);
  }

  const rules = await listAutomationRules(tenantId);
  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(
    authCtx.tenantId,
    authCtx.role,
    request.nextUrl.searchParams.get("tenantId")
  );
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  try {
    const body = await request.json();

    if (!body.name || !body.type || !body.actionType) {
      return NextResponse.json(
        { error: "name, type et actionType requis" },
        { status: 400 }
      );
    }

    const rule = await createAutomationRule(tenantId, {
      ...body,
      triggerConfig: body.triggerConfig || {},
      actionConfig: body.actionConfig || {},
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (err) {
    console.error("Erreur creation regle:", err);
    return NextResponse.json(
      { error: "Erreur lors de la creation" },
      { status: 500 }
    );
  }
}
