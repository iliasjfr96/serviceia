import { prisma } from "@/lib/prisma";
import type { Prisma, ProspectStage, UrgencyLevel, ProspectSource } from "@prisma/client";

export interface ProspectFilters {
  stage?: ProspectStage;
  practiceAreaId?: string;
  urgencyLevel?: UrgencyLevel;
  source?: ProspectSource;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxScore?: number;
  hasRecentCalls?: boolean; // Prospects with calls in last 24h
}

export interface ProspectListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: ProspectFilters;
}

export async function listProspects(
  tenantId: string,
  options: ProspectListOptions = {}
) {
  const {
    page = 1,
    limit = 25,
    sortBy = "createdAt",
    sortOrder = "desc",
    filters = {},
  } = options;

  const where: Prisma.ProspectWhereInput = {
    tenantId,
    isActive: true,
  };

  if (filters.stage) where.stage = filters.stage;
  if (filters.practiceAreaId) where.practiceAreaId = filters.practiceAreaId;
  if (filters.urgencyLevel) where.urgencyLevel = filters.urgencyLevel;
  if (filters.source) where.source = filters.source;
  if (filters.minScore !== undefined || filters.maxScore !== undefined) {
    where.leadScore = {};
    if (filters.minScore !== undefined)
      (where.leadScore as Prisma.IntFilter).gte = filters.minScore;
    if (filters.maxScore !== undefined)
      (where.leadScore as Prisma.IntFilter).lte = filters.maxScore;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom)
      (where.createdAt as Prisma.DateTimeFilter).gte = filters.dateFrom;
    if (filters.dateTo)
      (where.createdAt as Prisma.DateTimeFilter).lte = filters.dateTo;
  }
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search, mode: "insensitive" } },
      { caseDescription: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.hasRecentCalls) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    where.calls = {
      some: {
        createdAt: { gte: oneDayAgo },
      },
    };
  }

  const orderBy: Prisma.ProspectOrderByWithRelationInput = {};
  const validSortFields = [
    "createdAt",
    "updatedAt",
    "firstName",
    "lastName",
    "leadScore",
    "stage",
    "stageChangedAt",
    "lastContactedAt",
  ];
  if (validSortFields.includes(sortBy)) {
    (orderBy as Record<string, string>)[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = "desc";
  }

  const [prospects, total] = await Promise.all([
    prisma.prospect.findMany({
      where,
      include: {
        practiceArea: { select: { id: true, code: true, name: true, color: true } },
        tags: { select: { id: true, tag: true } },
        calls: {
          select: { id: true, createdAt: true, isEmergency: true, summary: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { calls: true, appointments: true, notes: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.prospect.count({ where }),
  ]);

  return {
    prospects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProspectById(tenantId: string, prospectId: string) {
  return prisma.prospect.findFirst({
    where: { id: prospectId, tenantId, isActive: true },
    include: {
      practiceArea: true,
      tags: true,
      calls: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          direction: true,
          status: true,
          callerNumber: true,
          duration: true,
          summary: true,
          isEmergency: true,
          createdAt: true,
        },
      },
      appointments: {
        orderBy: { startTime: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
          bookedBy: true,
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
      _count: {
        select: { calls: true, appointments: true, notes: true, documents: true },
      },
    },
  });
}

export interface CreateProspectData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  practiceAreaId?: string;
  source?: ProspectSource;
  referralSource?: string;
  urgencyLevel?: UrgencyLevel;
  caseDescription?: string;
  tags?: string[];
}

export async function createProspect(
  tenantId: string,
  data: CreateProspectData
) {
  const { tags, ...prospectData } = data;

  const prospect = await prisma.prospect.create({
    data: {
      tenantId,
      ...prospectData,
      stage: "PROSPECT",
      lastContactedAt: new Date(),
      ...(tags && tags.length > 0
        ? {
            tags: {
              create: tags.map((tag) => ({ tag })),
            },
          }
        : {}),
    },
    include: {
      practiceArea: true,
      tags: true,
    },
  });

  return prospect;
}

export async function updateProspect(
  tenantId: string,
  prospectId: string,
  data: Partial<CreateProspectData>
) {
  const existing = await prisma.prospect.findFirst({
    where: { id: prospectId, tenantId },
  });
  if (!existing) return null;

  const { tags, ...updateData } = data;

  const prospect = await prisma.prospect.update({
    where: { id: prospectId },
    data: updateData,
    include: { practiceArea: true, tags: true },
  });

  return prospect;
}

export async function updateProspectStage(
  tenantId: string,
  prospectId: string,
  stage: ProspectStage
) {
  const existing = await prisma.prospect.findFirst({
    where: { id: prospectId, tenantId },
  });
  if (!existing) return null;

  const updateData: Prisma.ProspectUpdateInput = {
    stage,
    stageChangedAt: new Date(),
  };

  if (stage === "CLIENT") {
    updateData.convertedToClientAt = new Date();
  }
  if (stage === "CLOSED" && !existing.convertedToClientAt) {
    updateData.lostAt = new Date();
  }

  return prisma.prospect.update({
    where: { id: prospectId },
    data: updateData,
    include: { practiceArea: true, tags: true },
  });
}

export async function deleteProspect(tenantId: string, prospectId: string) {
  const existing = await prisma.prospect.findFirst({
    where: { id: prospectId, tenantId },
  });
  if (!existing) return null;

  return prisma.prospect.update({
    where: { id: prospectId },
    data: { isActive: false },
  });
}

export async function getProspectsByStage(tenantId: string) {
  const stages: ProspectStage[] = [
    "PROSPECT",
    "QUALIFIED",
    "APPOINTMENT",
    "CLIENT",
    "DOSSIER",
    "CLOSED",
  ];

  const result: Record<string, Awaited<ReturnType<typeof prisma.prospect.findMany>>> = {};

  for (const stage of stages) {
    result[stage] = await prisma.prospect.findMany({
      where: { tenantId, stage, isActive: true },
      include: {
        practiceArea: { select: { id: true, code: true, name: true, color: true } },
        tags: { select: { id: true, tag: true } },
        _count: { select: { calls: true, appointments: true } },
      },
      orderBy: { stageChangedAt: "desc" },
      take: 50,
    });
  }

  return result;
}

export async function addNote(
  tenantId: string,
  prospectId: string,
  authorId: string | null,
  content: string,
  type: "MANUAL" | "AI_SUMMARY" | "SYSTEM" | "FOLLOW_UP" = "MANUAL"
) {
  const prospect = await prisma.prospect.findFirst({
    where: { id: prospectId, tenantId },
  });
  if (!prospect) return null;

  const note = await prisma.note.create({
    data: {
      prospectId,
      authorId,
      content,
      type,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { totalInteractions: { increment: 1 } },
  });

  return note;
}

export async function bulkUpdateStage(
  tenantId: string,
  prospectIds: string[],
  stage: ProspectStage
) {
  return prisma.prospect.updateMany({
    where: { id: { in: prospectIds }, tenantId, isActive: true },
    data: {
      stage,
      stageChangedAt: new Date(),
      ...(stage === "CLIENT" ? { convertedToClientAt: new Date() } : {}),
    },
  });
}

export async function bulkDelete(tenantId: string, prospectIds: string[]) {
  return prisma.prospect.updateMany({
    where: { id: { in: prospectIds }, tenantId },
    data: { isActive: false },
  });
}

export async function exportProspects(tenantId: string) {
  return prisma.prospect.findMany({
    where: { tenantId, isActive: true },
    include: {
      practiceArea: { select: { name: true } },
      _count: { select: { calls: true, appointments: true, notes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProspectStats(tenantId: string) {
  const [total, byStage, byUrgency, avgScore] = await Promise.all([
    prisma.prospect.count({ where: { tenantId, isActive: true } }),
    prisma.prospect.groupBy({
      by: ["stage"],
      where: { tenantId, isActive: true },
      _count: true,
    }),
    prisma.prospect.groupBy({
      by: ["urgencyLevel"],
      where: { tenantId, isActive: true },
      _count: true,
    }),
    prisma.prospect.aggregate({
      where: { tenantId, isActive: true },
      _avg: { leadScore: true },
    }),
  ]);

  return {
    total,
    byStage: Object.fromEntries(byStage.map((s) => [s.stage, s._count])),
    byUrgency: Object.fromEntries(byUrgency.map((u) => [u.urgencyLevel, u._count])),
    avgScore: Math.round(avgScore._avg.leadScore ?? 0),
  };
}
