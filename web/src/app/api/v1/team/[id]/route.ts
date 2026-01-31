import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromRequest, resolveTenantId } from "@/lib/dal/auth";
import { updateUserRole, toggleUserActive } from "@/lib/dal/tenants";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  if (authCtx.role !== "SUPER_ADMIN" && authCtx.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouve" },
        { status: 404 }
      );
    }

    // Prevent self-demotion
    if (id === authCtx.userId && body.role && body.role !== user.role) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre role" },
        { status: 400 }
      );
    }

    if (body.role) {
      const updated = await updateUserRole(id, body.role);
      return NextResponse.json(updated);
    }

    if (body.isActive !== undefined) {
      // Prevent self-deactivation
      if (id === authCtx.userId) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas vous desactiver vous-meme" },
          { status: 400 }
        );
      }
      const updated = await toggleUserActive(id, body.isActive);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur mise a jour" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCtx = await getTenantIdFromRequest(request);
  if (!authCtx) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  if (authCtx.role !== "SUPER_ADMIN" && authCtx.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = await resolveTenantId(authCtx.tenantId, authCtx.role);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant non trouve" }, { status: 404 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === authCtx.userId) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: { id, tenantId },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Utilisateur non trouve" },
      { status: 404 }
    );
  }

  // Soft delete: deactivate instead of deleting
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
