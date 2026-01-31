import { prisma } from "@/lib/prisma";

// ── List Scripts ──────────────────────────────

export async function listScripts(tenantId: string) {
  return prisma.intakeScript.findMany({
    where: { tenantId },
    include: {
      practiceArea: {
        select: { id: true, name: true, code: true, color: true },
      },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

// ── Get Script ──────────────────────────────

export async function getScript(tenantId: string, scriptId: string) {
  return prisma.intakeScript.findFirst({
    where: { id: scriptId, tenantId },
    include: {
      practiceArea: {
        select: { id: true, name: true, code: true, color: true },
      },
    },
  });
}

// ── Create Script ──────────────────────────────

export interface CreateScriptData {
  name: string;
  description?: string;
  steps: unknown[];
  practiceAreaId?: string;
  isDefault?: boolean;
  isActive?: boolean;
  language?: string;
}

export async function createScript(tenantId: string, data: CreateScriptData) {
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.intakeScript.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.intakeScript.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description,
      steps: data.steps as never,
      practiceAreaId: data.practiceAreaId || null,
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
      language: data.language ?? "fr",
    },
    include: {
      practiceArea: {
        select: { id: true, name: true, code: true, color: true },
      },
    },
  });
}

// ── Update Script ──────────────────────────────

export async function updateScript(
  tenantId: string,
  scriptId: string,
  data: Partial<CreateScriptData>
) {
  const existing = await prisma.intakeScript.findFirst({
    where: { id: scriptId, tenantId },
  });
  if (!existing) return null;

  if (data.isDefault) {
    await prisma.intakeScript.updateMany({
      where: { tenantId, isDefault: true, id: { not: scriptId } },
      data: { isDefault: false },
    });
  }

  return prisma.intakeScript.update({
    where: { id: scriptId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.steps !== undefined ? { steps: data.steps as never } : {}),
      ...(data.practiceAreaId !== undefined
        ? { practiceAreaId: data.practiceAreaId || null }
        : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
    },
    include: {
      practiceArea: {
        select: { id: true, name: true, code: true, color: true },
      },
    },
  });
}

// ── Delete Script ──────────────────────────────

export async function deleteScript(tenantId: string, scriptId: string) {
  const existing = await prisma.intakeScript.findFirst({
    where: { id: scriptId, tenantId },
  });
  if (!existing) return null;

  return prisma.intakeScript.delete({
    where: { id: scriptId },
  });
}

// ── List Practice Areas ──────────────────────────────

export async function listPracticeAreas(tenantId: string) {
  return prisma.tenantPracticeArea.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
}
