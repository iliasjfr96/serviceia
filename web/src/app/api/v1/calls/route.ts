import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { listCalls, getCallStats } from "@/lib/dal/calls";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { CallStatus, CallDirection } from "@prisma/client";

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitError = await enforceRateLimit(request, RATE_LIMITS.api);
  if (rateLimitError) return rateLimitError;

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

  // If requesting stats
  if (params.get("stats") === "true") {
    const stats = await getCallStats(tenantId);
    return NextResponse.json(stats);
  }

  const filters: Record<string, unknown> = {};
  if (params.get("status")) filters.status = params.get("status") as CallStatus;
  if (params.get("direction"))
    filters.direction = params.get("direction") as CallDirection;
  if (params.get("isEmergency"))
    filters.isEmergency = params.get("isEmergency") === "true";
  if (params.get("search")) filters.search = params.get("search");

  const result = await listCalls(tenantId, {
    page: parseInt(params.get("page") || "1"),
    limit: parseInt(params.get("limit") || "25"),
    sortBy: params.get("sortBy") || "createdAt",
    sortOrder: (params.get("sortOrder") as "asc" | "desc") || "desc",
    filters,
  });

  return NextResponse.json(result);
}
