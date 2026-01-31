import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  addProspectsToList,
  removeProspectFromList,
  searchProspectsForList,
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
  const search = request.nextUrl.searchParams.get("search") || "";

  if (search) {
    const prospects = await searchProspectsForList(tenantId, id, search);
    return NextResponse.json(prospects);
  }

  return NextResponse.json([]);
}

export async function POST(
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
    const { prospectIds } = await request.json();

    if (!Array.isArray(prospectIds) || prospectIds.length === 0) {
      return NextResponse.json(
        { error: "prospectIds requis" },
        { status: 400 }
      );
    }

    const result = await addProspectsToList(tenantId, id, prospectIds);
    if (!result) {
      return NextResponse.json(
        { error: "Liste non trouvee" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Erreur ajout prospects" },
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

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const { id } = await params;
  const { prospectId } = await request.json();

  if (!prospectId) {
    return NextResponse.json(
      { error: "prospectId requis" },
      { status: 400 }
    );
  }

  const result = await removeProspectFromList(tenantId, id, prospectId);
  if (!result) {
    return NextResponse.json({ error: "Liste non trouvee" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
