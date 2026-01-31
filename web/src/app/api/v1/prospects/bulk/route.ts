import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { bulkUpdateStage, bulkDelete } from "@/lib/dal/prospects";
import type { ProspectStage } from "@prisma/client";

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

  const body = await request.json();
  const { action, prospectIds, stage } = body as {
    action: string;
    prospectIds: string[];
    stage?: string;
  };

  if (!Array.isArray(prospectIds) || prospectIds.length === 0) {
    return NextResponse.json(
      { error: "prospectIds requis" },
      { status: 400 }
    );
  }

  switch (action) {
    case "updateStage": {
      if (!stage) {
        return NextResponse.json(
          { error: "stage requis" },
          { status: 400 }
        );
      }
      const result = await bulkUpdateStage(
        tenantId,
        prospectIds,
        stage as ProspectStage
      );
      return NextResponse.json({ updated: result.count });
    }
    case "delete": {
      const result = await bulkDelete(tenantId, prospectIds);
      return NextResponse.json({ deleted: result.count });
    }
    default:
      return NextResponse.json(
        { error: "Action inconnue" },
        { status: 400 }
      );
  }
}
