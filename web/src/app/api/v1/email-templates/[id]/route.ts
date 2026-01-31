import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveTenantId } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  category: z
    .enum(["GENERAL", "FOLLOW_UP", "REMINDER", "CONFIRMATION", "REACTIVATION"])
    .optional(),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

// GET - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(
    session.user.tenantId,
    session.user.role
  );
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { id } = await params;

  const template = await prisma.emailTemplate.findFirst({
    where: { id, tenantId },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(
    session.user.tenantId,
    session.user.role
  );
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { id } = await params;

  const existing = await prisma.emailTemplate.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const body = await request.json();
  const result = updateTemplateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { isDefault, category, ...data } = result.data;

  // If setting as default, unset other defaults in same category
  if (isDefault) {
    const targetCategory = category ?? existing.category;
    await prisma.emailTemplate.updateMany({
      where: {
        tenantId,
        category: targetCategory,
        isDefault: true,
        id: { not: id },
      },
      data: { isDefault: false },
    });
  }

  const template = await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...data,
      ...(category !== undefined ? { category } : {}),
      ...(isDefault !== undefined ? { isDefault } : {}),
    },
  });

  return NextResponse.json(template);
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(
    session.user.tenantId,
    session.user.role
  );
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { id } = await params;

  const existing = await prisma.emailTemplate.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  await prisma.emailTemplate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
