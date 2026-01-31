import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  listAppointments,
  createAppointment,
  getAppointmentStats,
  type AppointmentFilters,
} from "@/lib/dal/appointments";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { validateBody, createAppointmentSchema } from "@/lib/validations";
import type { AppointmentStatus } from "@prisma/client";

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

  // Stats mode
  if (params.get("stats") === "true") {
    const stats = await getAppointmentStats(tenantId);
    return NextResponse.json(stats);
  }

  const filters: AppointmentFilters = {};
  if (params.get("status"))
    filters.status = params.get("status") as AppointmentStatus;
  if (params.get("prospectId"))
    filters.prospectId = params.get("prospectId")!;
  if (params.get("dateFrom"))
    filters.dateFrom = new Date(params.get("dateFrom")!);
  if (params.get("dateTo"))
    filters.dateTo = new Date(params.get("dateTo")!);
  if (params.get("search"))
    filters.search = params.get("search")!;

  const result = await listAppointments(tenantId, {
    page: parseInt(params.get("page") || "1"),
    limit: parseInt(params.get("limit") || "50"),
    sortBy: params.get("sortBy") || "startTime",
    sortOrder: (params.get("sortOrder") as "asc" | "desc") || "asc",
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

    // Validate input with Zod schema
    const validation = validateBody(createAppointmentSchema, body);
    if (!validation.success) return validation.error;

    const appointment = await createAppointment(tenantId, validation.data);
    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    console.error("Erreur creation RDV:", err);
    return NextResponse.json(
      { error: "Erreur lors de la creation du RDV" },
      { status: 500 }
    );
  }
}
