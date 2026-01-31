import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveTenantId } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z
    .enum(["GENERAL", "FOLLOW_UP", "REMINDER", "CONFIRMATION", "REACTIVATION"])
    .default("GENERAL"),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  isDefault: z.boolean().optional(),
});

// GET - List email templates
export async function GET(request: NextRequest) {
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

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");

  const templates = await prisma.emailTemplate.findMany({
    where: {
      tenantId,
      ...(category ? { category: category as never } : {}),
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(templates);
}

// POST - Create email template
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const result = createTemplateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, category, subject, body: content, isDefault } = result.data;

  // If setting as default, unset other defaults in same category
  if (isDefault) {
    await prisma.emailTemplate.updateMany({
      where: { tenantId, category, isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.emailTemplate.create({
    data: {
      tenantId,
      name,
      description,
      category,
      subject,
      body: content,
      isDefault: isDefault ?? false,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
