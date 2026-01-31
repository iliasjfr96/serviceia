import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { addNote } from "@/lib/dal/prospects";

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

  const { id } = await params;
  const { content, type } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Le contenu est requis" },
      { status: 400 }
    );
  }

  const note = await addNote(tenantId, id, authCtx.userId, content, type);

  if (!note) {
    return NextResponse.json(
      { error: "Prospect non trouve" },
      { status: 404 }
    );
  }

  return NextResponse.json(note, { status: 201 });
}
