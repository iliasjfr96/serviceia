import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest } from "@/lib/dal/auth";
import { listTenants, createTenant } from "@/lib/dal/tenants";

export async function GET(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx || authCtx.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const result = await listTenants({
    search: params.get("search") || undefined,
    plan: params.get("plan") || undefined,
    isActive:
      params.get("isActive") === "true"
        ? true
        : params.get("isActive") === "false"
          ? false
          : undefined,
    page: parseInt(params.get("page") || "1"),
    limit: parseInt(params.get("limit") || "20"),
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx || authCtx.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (!body.name || !body.slug || !body.email) {
      return NextResponse.json(
        { error: "name, slug et email requis" },
        { status: 400 }
      );
    }

    const tenant = await createTenant(body);
    return NextResponse.json(tenant, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.message.includes("Unique constraint")
        ? "Ce slug est deja utilise"
        : "Erreur lors de la creation";
    console.error("Erreur creation tenant:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
