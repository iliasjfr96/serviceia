import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest } from "@/lib/dal/auth";
import { getAdminStats } from "@/lib/dal/tenants";

export async function GET(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx || authCtx.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
