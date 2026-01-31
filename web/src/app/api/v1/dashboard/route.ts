import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import {
  getDashboardKPIs,
  getDashboardChartData,
  getRecentActivity,
} from "@/lib/dal/dashboard";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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

  try {
    const section = request.nextUrl.searchParams.get("section");

    if (section === "charts") {
      const charts = await getDashboardChartData(tenantId);
      return NextResponse.json(charts);
    }

    if (section === "activity") {
      const activity = await getRecentActivity(tenantId);
      return NextResponse.json(activity);
    }

    // Default: KPIs
    const kpis = await getDashboardKPIs(tenantId);
    return NextResponse.json(kpis);
  } catch (err) {
    console.error("Erreur dashboard:", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement du tableau de bord" },
      { status: 500 }
    );
  }
}
