import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest } from "@/lib/dal/auth";
import { onboardTenant } from "@/lib/dal/tenants";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx || authCtx.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const tenant = await onboardTenant(id);
    return NextResponse.json(tenant);
  } catch (err) {
    console.error("Erreur onboarding tenant:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'onboarding" },
      { status: 500 }
    );
  }
}
