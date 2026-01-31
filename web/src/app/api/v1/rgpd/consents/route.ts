import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { listConsentRecords, createConsentRecord } from "@/lib/dal/rgpd";

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

  const params = request.nextUrl.searchParams;
  const result = await listConsentRecords(tenantId, {
    prospectId: params.get("prospectId") || undefined,
    consentType: params.get("consentType") || undefined,
    page: parseInt(params.get("page") || "1"),
    limit: parseInt(params.get("limit") || "25"),
  });

  return NextResponse.json(result);
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
    if (!body.consentType || !body.method) {
      return NextResponse.json(
        { error: "consentType et method requis" },
        { status: 400 }
      );
    }

    const record = await createConsentRecord(tenantId, body);
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("Erreur creation consentement:", err);
    return NextResponse.json(
      { error: "Erreur lors de la creation" },
      { status: 500 }
    );
  }
}
