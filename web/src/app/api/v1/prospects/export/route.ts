import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { exportProspects } from "@/lib/dal/prospects";
import {
  STAGE_LABELS,
  URGENCY_LABELS,
  SOURCE_LABELS,
} from "@/lib/constants/pipeline";

export async function GET(request: NextRequest) {
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

  const prospects = await exportProspects(tenantId);

  const headers = [
    "Prenom",
    "Nom",
    "Email",
    "Telephone",
    "Ville",
    "Code postal",
    "Statut",
    "Urgence",
    "Source",
    "Score",
    "Domaine juridique",
    "Description",
    "Appels",
    "RDV",
    "Notes",
    "Date creation",
  ];

  const rows = prospects.map((p) => [
    p.firstName || "",
    p.lastName || "",
    p.email || "",
    p.phone || "",
    p.city || "",
    p.postalCode || "",
    STAGE_LABELS[p.stage] || p.stage,
    URGENCY_LABELS[p.urgencyLevel] || p.urgencyLevel,
    SOURCE_LABELS[p.source] || p.source,
    String(p.leadScore),
    p.practiceArea?.name || "",
    (p.caseDescription || "").replace(/[\n\r]+/g, " "),
    String(p._count.calls),
    String(p._count.appointments),
    String(p._count.notes),
    new Date(p.createdAt).toLocaleDateString("fr-FR"),
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")
    ),
  ].join("\n");

  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";

  return new NextResponse(bom + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prospects_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
