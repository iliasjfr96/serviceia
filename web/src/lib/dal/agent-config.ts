import { prisma } from "@/lib/prisma";

export async function getAgentConfig(tenantId: string) {
  return prisma.agentConfig.findUnique({
    where: { tenantId },
  });
}

export async function updateAgentConfig(
  tenantId: string,
  data: {
    agentName?: string;
    greetingMessage?: string;
    personality?: string;
    voiceId?: string;
    voiceProvider?: string;
    llmModel?: string;
    temperature?: number;
    maxTokens?: number;
    primaryLanguage?: string;
    supportedLanguages?: string[];
    maxCallDuration?: number;
    silenceTimeout?: number;
    enableRecording?: boolean;
    requireConsent?: boolean;
    emergencyTransferNumber?: string;
    enableEmergencyDetection?: boolean;
    neverGiveLegalAdvice?: boolean;
    alwaysIdentifyAsAI?: boolean;
  }
) {
  return prisma.agentConfig.upsert({
    where: { tenantId },
    update: data,
    create: { tenantId, ...data },
  });
}

export async function listIntakeScripts(tenantId: string) {
  return prisma.intakeScript.findMany({
    where: { tenantId, isActive: true },
    include: {
      practiceArea: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getIntakeScript(tenantId: string, scriptId: string) {
  return prisma.intakeScript.findFirst({
    where: { id: scriptId, tenantId },
    include: {
      practiceArea: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function createIntakeScript(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    steps: unknown;
    practiceAreaId?: string;
    isDefault?: boolean;
    language?: string;
  }
) {
  if (data.isDefault) {
    await prisma.intakeScript.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.intakeScript.create({
    data: { tenantId, ...data, steps: data.steps as object },
    include: {
      practiceArea: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function updateIntakeScript(
  tenantId: string,
  scriptId: string,
  data: {
    name?: string;
    description?: string;
    steps?: unknown;
    practiceAreaId?: string;
    isDefault?: boolean;
    language?: string;
    isActive?: boolean;
  }
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

  const { practiceAreaId, steps, ...rest } = data;

  return prisma.intakeScript.update({
    where: { id: scriptId },
    data: {
      ...rest,
      ...(steps !== undefined ? { steps: steps as object } : {}),
      ...(practiceAreaId !== undefined
        ? { practiceArea: { connect: { id: practiceAreaId } } }
        : {}),
    },
    include: {
      practiceArea: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function deleteIntakeScript(tenantId: string, scriptId: string) {
  const existing = await prisma.intakeScript.findFirst({
    where: { id: scriptId, tenantId },
  });
  if (!existing) return null;

  return prisma.intakeScript.update({
    where: { id: scriptId },
    data: { isActive: false },
  });
}
