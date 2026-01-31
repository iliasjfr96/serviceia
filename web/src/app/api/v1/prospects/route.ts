import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  listProspects,
  createProspect,
  type ProspectFilters,
} from "@/lib/dal/prospects";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  validateBody,
  validateQuery,
  createProspectSchema,
  prospectFilterSchema,
} from "@/lib/validations";
import type { ProspectStage, UrgencyLevel, ProspectSource } from "@prisma/client";

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

  // Validate query params
  const validation = validateQuery(
    prospectFilterSchema,
    request.nextUrl.searchParams
  );
  if (!validation.success) return validation.error;

  const { page, limit, sortBy, sortOrder, ...filterParams } = validation.data;
  const filters: ProspectFilters = {};

  if (filterParams.stage) filters.stage = filterParams.stage as ProspectStage;
  if (filterParams.practiceAreaId)
    filters.practiceAreaId = filterParams.practiceAreaId;
  if (filterParams.urgencyLevel)
    filters.urgencyLevel = filterParams.urgencyLevel as UrgencyLevel;
  if (filterParams.source) filters.source = filterParams.source as ProspectSource;
  if (filterParams.search) filters.search = filterParams.search;
  if (filterParams.hasRecentCalls) filters.hasRecentCalls = filterParams.hasRecentCalls;

  const result = await listProspects(tenantId, {
    page,
    limit,
    sortBy: sortBy || "createdAt",
    sortOrder: sortOrder || "desc",
    filters,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  // Rate limiting (stricter for write operations)
  const rateLimitError = await enforceRateLimit(request, RATE_LIMITS.write);
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

  try {
    const body = await request.json();

    // Validate input
    const validation = validateBody(createProspectSchema, body);
    if (!validation.success) return validation.error;

    // Clean empty strings to undefined so Prisma stores null
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(validation.data)) {
      cleaned[key] =
        typeof value === "string" && value.trim() === "" ? undefined : value;
    }

    const prospect = await createProspect(tenantId, cleaned);
    return NextResponse.json(prospect, { status: 201 });
  } catch (err) {
    console.error("Erreur creation prospect:", err);
    return NextResponse.json(
      { error: "Erreur lors de la creation du prospect" },
      { status: 500 }
    );
  }
}
