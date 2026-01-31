import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  getCampaign,
  updateCampaign,
  deleteCampaign,
} from "@/lib/dal/automations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const campaign = await getCampaign(tenantId, id);
  if (!campaign) {
    return NextResponse.json(
      { error: "Campagne non trouvee" },
      { status: 404 }
    );
  }

  return NextResponse.json(campaign);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();
    const campaign = await updateCampaign(tenantId, id, body);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne non trouvee" },
        { status: 404 }
      );
    }
    return NextResponse.json(campaign);
  } catch (err) {
    console.error("Erreur mise a jour campagne:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour" },
      { status: 500 }
    );
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

  const tenantId = await resolveTenantId(
    authCtx.tenantId,
    authCtx.role,
    request.nextUrl.searchParams.get("tenantId")
  );
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const { id } = await params;
  const result = await deleteCampaign(tenantId, id);
  if (!result) {
    return NextResponse.json(
      { error: "Campagne non trouvee" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
