import { prisma } from "@/lib/prisma";
import type {
  Prisma,
  AutomationType,
  AutomationAction,
  CampaignType,
  CampaignStatus,
} from "@prisma/client";

// ── Automation Rules ──────────────────────────────

export async function listAutomationRules(tenantId: string) {
  return prisma.automationRule.findMany({
    where: { tenantId },
    include: {
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAutomationRule(tenantId: string, ruleId: string) {
  return prisma.automationRule.findFirst({
    where: { id: ruleId, tenantId },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          prospect: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      _count: {
        select: { logs: true },
      },
    },
  });
}

export interface CreateAutomationRuleData {
  name: string;
  description?: string;
  type: AutomationType;
  triggerConfig: Record<string, unknown>;
  actionType: AutomationAction;
  actionConfig: Record<string, unknown>;
  isActive?: boolean;
}

export async function createAutomationRule(
  tenantId: string,
  data: CreateAutomationRuleData
) {
  const { triggerConfig, actionConfig, ...rest } = data;

  return prisma.automationRule.create({
    data: {
      tenantId,
      ...rest,
      triggerConfig: triggerConfig as Prisma.InputJsonValue,
      actionConfig: actionConfig as Prisma.InputJsonValue,
    },
    include: {
      _count: { select: { logs: true } },
    },
  });
}

export async function updateAutomationRule(
  tenantId: string,
  ruleId: string,
  data: Partial<CreateAutomationRuleData>
) {
  const existing = await prisma.automationRule.findFirst({
    where: { id: ruleId, tenantId },
  });
  if (!existing) return null;

  const { triggerConfig, actionConfig, ...rest } = data;

  return prisma.automationRule.update({
    where: { id: ruleId },
    data: {
      ...rest,
      ...(triggerConfig !== undefined
        ? { triggerConfig: triggerConfig as Prisma.InputJsonValue }
        : {}),
      ...(actionConfig !== undefined
        ? { actionConfig: actionConfig as Prisma.InputJsonValue }
        : {}),
    },
    include: {
      _count: { select: { logs: true } },
    },
  });
}

export async function toggleAutomationRule(
  tenantId: string,
  ruleId: string,
  isActive: boolean
) {
  const existing = await prisma.automationRule.findFirst({
    where: { id: ruleId, tenantId },
  });
  if (!existing) return null;

  return prisma.automationRule.update({
    where: { id: ruleId },
    data: { isActive },
    include: {
      _count: { select: { logs: true } },
    },
  });
}

export async function deleteAutomationRule(tenantId: string, ruleId: string) {
  const existing = await prisma.automationRule.findFirst({
    where: { id: ruleId, tenantId },
  });
  if (!existing) return null;

  // Delete logs first, then the rule
  await prisma.automationLog.deleteMany({ where: { ruleId } });
  return prisma.automationRule.delete({ where: { id: ruleId } });
}

// ── Automation Logs ──────────────────────────────

export async function listAutomationLogs(
  tenantId: string,
  options: {
    ruleId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { ruleId, status, page = 1, limit = 25 } = options;

  const where: Prisma.AutomationLogWhereInput = {
    rule: { tenantId },
  };

  if (ruleId) where.ruleId = ruleId;
  if (status) where.status = status as Prisma.EnumAutomationLogStatusFilter["equals"];

  const [logs, total] = await Promise.all([
    prisma.automationLog.findMany({
      where,
      include: {
        rule: { select: { id: true, name: true, type: true } },
        prospect: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.automationLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Campaigns ──────────────────────────────

export async function listCampaigns(tenantId: string) {
  return prisma.campaign.findMany({
    where: { tenantId },
    include: {
      prospectList: {
        select: { id: true, name: true, _count: { select: { members: true } } },
      },
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCampaign(tenantId: string, campaignId: string) {
  return prisma.campaign.findFirst({
    where: { id: campaignId, tenantId },
    include: {
      prospectList: {
        select: { id: true, name: true, _count: { select: { members: true } } },
      },
      recipients: {
        include: {
          prospect: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { recipients: true } },
    },
  });
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  type: CampaignType;
  channel?: "EMAIL" | "SMS" | "EMAIL_SMS";
  targetCriteria: Record<string, unknown>;
  prospectListId?: string;
  emailSubject?: string;
  emailBody?: string;
  smsMessage?: string;
  startDate?: string;
  endDate?: string;
}

export async function createCampaign(
  tenantId: string,
  data: CreateCampaignData
) {
  const { targetCriteria, startDate, endDate, prospectListId, ...rest } = data;

  const campaign = await prisma.campaign.create({
    data: {
      tenantId,
      ...rest,
      targetCriteria: targetCriteria as Prisma.InputJsonValue,
      ...(prospectListId ? { prospectListId } : {}),
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
    },
    include: {
      prospectList: {
        select: { id: true, name: true, _count: { select: { members: true } } },
      },
      _count: { select: { recipients: true } },
    },
  });

  // Auto-populate recipients from prospect list
  if (prospectListId) {
    const members = await prisma.prospectListMember.findMany({
      where: { listId: prospectListId },
      select: { prospectId: true },
    });

    if (members.length > 0) {
      const channel = data.channel || "EMAIL";
      const channels: ("EMAIL" | "SMS")[] =
        channel === "EMAIL_SMS" ? ["EMAIL", "SMS"] : [channel as "EMAIL" | "SMS"];

      for (const ch of channels) {
        await prisma.campaignRecipient.createMany({
          data: members.map((m) => ({
            campaignId: campaign.id,
            prospectId: m.prospectId,
            channel: ch,
          })),
          skipDuplicates: true,
        });
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { totalTargeted: members.length },
      });
    }
  }

  return campaign;
}

export async function updateCampaign(
  tenantId: string,
  campaignId: string,
  data: Partial<CreateCampaignData> & { status?: CampaignStatus }
) {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, tenantId },
  });
  if (!existing) return null;

  const { targetCriteria, startDate, endDate, prospectListId, ...rest } = data;

  return prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...rest,
      ...(targetCriteria !== undefined
        ? { targetCriteria: targetCriteria as Prisma.InputJsonValue }
        : {}),
      ...(prospectListId !== undefined
        ? { prospectListId: prospectListId || null }
        : {}),
      ...(startDate !== undefined
        ? { startDate: startDate ? new Date(startDate) : null }
        : {}),
      ...(endDate !== undefined
        ? { endDate: endDate ? new Date(endDate) : null }
        : {}),
    },
    include: {
      prospectList: {
        select: { id: true, name: true, _count: { select: { members: true } } },
      },
      _count: { select: { recipients: true } },
    },
  });
}

export async function deleteCampaign(tenantId: string, campaignId: string) {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, tenantId },
  });
  if (!existing) return null;

  return prisma.campaign.delete({ where: { id: campaignId } });
}

// ── Stats ──────────────────────────────

export async function getAutomationStats(tenantId: string) {
  const [
    totalRules,
    activeRules,
    totalLogs,
    pendingLogs,
    successLogs,
    failedLogs,
    totalCampaigns,
    activeCampaigns,
  ] = await Promise.all([
    prisma.automationRule.count({ where: { tenantId } }),
    prisma.automationRule.count({ where: { tenantId, isActive: true } }),
    prisma.automationLog.count({ where: { rule: { tenantId } } }),
    prisma.automationLog.count({
      where: { rule: { tenantId }, status: "PENDING" },
    }),
    prisma.automationLog.count({
      where: { rule: { tenantId }, status: "SUCCESS" },
    }),
    prisma.automationLog.count({
      where: { rule: { tenantId }, status: "FAILED" },
    }),
    prisma.campaign.count({ where: { tenantId } }),
    prisma.campaign.count({
      where: { tenantId, status: "ACTIVE" },
    }),
  ]);

  return {
    totalRules,
    activeRules,
    totalLogs,
    pendingLogs,
    successLogs,
    failedLogs,
    totalCampaigns,
    activeCampaigns,
  };
}
