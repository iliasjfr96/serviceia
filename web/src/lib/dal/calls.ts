import { prisma } from "@/lib/prisma";
import type { Prisma, CallStatus, CallDirection } from "@prisma/client";

export interface CallFilters {
  status?: CallStatus;
  direction?: CallDirection;
  isEmergency?: boolean;
  prospectId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CallListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: CallFilters;
}

export async function listCalls(
  tenantId: string,
  options: CallListOptions = {}
) {
  const {
    page = 1,
    limit = 25,
    sortBy = "createdAt",
    sortOrder = "desc",
    filters = {},
  } = options;

  const where: Prisma.CallWhereInput = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.direction) where.direction = filters.direction;
  if (filters.isEmergency !== undefined)
    where.isEmergency = filters.isEmergency;
  if (filters.prospectId) where.prospectId = filters.prospectId;
  if (filters.search) {
    where.OR = [
      { callerNumber: { contains: filters.search, mode: "insensitive" } },
      { callerName: { contains: filters.search, mode: "insensitive" } },
      { summary: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom)
      (where.createdAt as Prisma.DateTimeFilter).gte = filters.dateFrom;
    if (filters.dateTo)
      (where.createdAt as Prisma.DateTimeFilter).lte = filters.dateTo;
  }

  const orderBy: Prisma.CallOrderByWithRelationInput = {};
  const validSortFields = [
    "createdAt",
    "duration",
    "status",
    "direction",
    "startedAt",
  ];
  if (validSortFields.includes(sortBy)) {
    (orderBy as Record<string, string>)[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = "desc";
  }

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
        prospect: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.call.count({ where }),
  ]);

  return {
    calls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCallById(tenantId: string, callId: string) {
  return prisma.call.findFirst({
    where: { id: callId, tenantId },
    include: {
      prospect: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          stage: true,
        },
      },
    },
  });
}

export async function createCallFromWebhook(
  tenantId: string,
  data: {
    vapiCallId: string;
    direction?: CallDirection;
    callerNumber?: string;
    callerName?: string;
    destinationNumber?: string;
    status?: CallStatus;
  }
) {
  // Find or match prospect by phone number
  let prospectId: string | undefined;
  if (data.callerNumber) {
    const prospect = await prisma.prospect.findFirst({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { phone: data.callerNumber },
          { alternatePhone: data.callerNumber },
        ],
      },
      select: { id: true },
    });
    if (prospect) prospectId = prospect.id;
  }

  return prisma.call.create({
    data: {
      tenantId,
      prospectId,
      vapiCallId: data.vapiCallId,
      direction: data.direction || "INBOUND",
      status: data.status || "RINGING",
      callerNumber: data.callerNumber,
      callerName: data.callerName,
      destinationNumber: data.destinationNumber,
      startedAt: new Date(),
    },
  });
}

export async function updateCallStatus(
  vapiCallId: string,
  data: {
    status?: CallStatus;
    transcriptRaw?: string;
    transcriptJson?: unknown;
    summary?: string;
    summaryJson?: unknown;
    duration?: number;
    endedAt?: Date;
    isEmergency?: boolean;
    emergencyType?: string;
    extractedData?: unknown;
    consentRecorded?: boolean;
    consentTimestamp?: Date;
    costAmount?: number;
    detectedLanguage?: string;
    sentiment?: string;
    recordingUrl?: string;
  }
) {
  const { transcriptJson, summaryJson, extractedData, ...rest } = data;
  return prisma.call.update({
    where: { vapiCallId },
    data: {
      ...rest,
      ...(transcriptJson !== undefined
        ? { transcriptJson: transcriptJson as Prisma.InputJsonValue }
        : {}),
      ...(summaryJson !== undefined
        ? { summaryJson: summaryJson as Prisma.InputJsonValue }
        : {}),
      ...(extractedData !== undefined
        ? { extractedData: extractedData as Prisma.InputJsonValue }
        : {}),
    },
  });
}

export async function getCallStats(tenantId: string) {
  const [total, byStatus, byDirection, avgDuration, emergencies] =
    await Promise.all([
      prisma.call.count({ where: { tenantId } }),
      prisma.call.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: true,
      }),
      prisma.call.groupBy({
        by: ["direction"],
        where: { tenantId },
        _count: true,
      }),
      prisma.call.aggregate({
        where: { tenantId, duration: { not: null } },
        _avg: { duration: true },
      }),
      prisma.call.count({
        where: { tenantId, isEmergency: true },
      }),
    ]);

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    byDirection: Object.fromEntries(
      byDirection.map((d) => [d.direction, d._count])
    ),
    avgDuration: Math.round(avgDuration._avg.duration ?? 0),
    emergencies,
  };
}
