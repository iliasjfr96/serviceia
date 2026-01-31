import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ── Consent Records ──────────────────────────────

export async function listConsentRecords(
  tenantId: string,
  options: {
    prospectId?: string;
    consentType?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { prospectId, consentType, page = 1, limit = 25 } = options;

  const where: Prisma.ConsentRecordWhereInput = { tenantId };
  if (prospectId) where.prospectId = prospectId;
  if (consentType) where.consentType = consentType;

  const [records, total] = await Promise.all([
    prisma.consentRecord.findMany({
      where,
      orderBy: { grantedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.consentRecord.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createConsentRecord(
  tenantId: string,
  data: {
    prospectId?: string;
    consentType: string;
    granted: boolean;
    method: string;
    ipAddress?: string;
    proofType?: string;
    proofData?: Record<string, unknown>;
  }
) {
  const { proofData, ...rest } = data;

  return prisma.consentRecord.create({
    data: {
      tenantId,
      ...rest,
      ...(proofData
        ? { proofData: proofData as Prisma.InputJsonValue }
        : {}),
    },
  });
}

export async function revokeConsent(tenantId: string, consentId: string) {
  const existing = await prisma.consentRecord.findFirst({
    where: { id: consentId, tenantId },
  });
  if (!existing) return null;

  return prisma.consentRecord.update({
    where: { id: consentId },
    data: { revokedAt: new Date(), granted: false },
  });
}

// ── Retention Settings ──────────────────────────────

export async function getRetentionSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      dataRetentionDays: true,
      rgpdContactEmail: true,
      dpoName: true,
    },
  });
}

export async function updateRetentionSettings(
  tenantId: string,
  data: {
    dataRetentionDays?: number;
    rgpdContactEmail?: string;
    dpoName?: string;
  }
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data,
    select: {
      dataRetentionDays: true,
      rgpdContactEmail: true,
      dpoName: true,
    },
  });
}

// ── Data Export (portabilite) ──────────────────────────────

export async function exportProspectData(
  tenantId: string,
  prospectId: string
) {
  const prospect = await prisma.prospect.findFirst({
    where: { id: prospectId, tenantId },
    include: {
      notes: {
        select: {
          id: true,
          content: true,
          type: true,
          createdAt: true,
        },
      },
      calls: {
        select: {
          id: true,
          direction: true,
          status: true,
          startedAt: true,
          endedAt: true,
          duration: true,
          summary: true,
          consentRecorded: true,
          createdAt: true,
        },
      },
      appointments: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
          consultationType: true,
          createdAt: true,
        },
      },
      documents: {
        select: {
          id: true,
          name: true,
          mimeType: true,
          sizeBytes: true,
          category: true,
          uploadedAt: true,
        },
      },
      tags: {
        select: {
          id: true,
          tag: true,
        },
      },
    },
  });

  if (!prospect) return null;

  // Build RGPD-compliant export
  return {
    exportDate: new Date().toISOString(),
    format: "RGPD_EXPORT_V1",
    prospect: {
      id: prospect.id,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone,
      address: prospect.address,
      city: prospect.city,
      postalCode: prospect.postalCode,
      source: prospect.source,
      stage: prospect.stage,
      practiceAreaId: prospect.practiceAreaId,
      caseDescription: prospect.caseDescription,
      consentGiven: prospect.consentGiven,
      consentDate: prospect.consentDate,
      consentMethod: prospect.consentMethod,
      createdAt: prospect.createdAt,
      updatedAt: prospect.updatedAt,
    },
    notes: prospect.notes,
    calls: prospect.calls,
    appointments: prospect.appointments,
    documents: prospect.documents.map((d) => ({
      id: d.id,
      name: d.name,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      category: d.category,
      uploadedAt: d.uploadedAt,
    })),
    tags: prospect.tags,
  };
}

// ── Data Erasure (droit a l'oubli) ──────────────────────────────

export async function eraseProspectData(
  tenantId: string,
  prospectId: string
) {
  const prospect = await prisma.prospect.findFirst({
    where: { id: prospectId, tenantId },
  });
  if (!prospect) return null;

  // Anonymize instead of hard delete to preserve audit trail
  await prisma.$transaction(async (tx) => {
    // Delete related data
    await tx.note.deleteMany({ where: { prospectId } });
    await tx.document.deleteMany({ where: { prospectId } });
    await tx.prospectTag.deleteMany({ where: { prospectId } });
    await tx.automationLog.deleteMany({ where: { prospectId } });

    // Anonymize calls (keep for stats but remove PII)
    await tx.call.updateMany({
      where: { prospectId },
      data: {
        callerNumber: "ANONYMIZED",
        callerName: null,
        transcriptRaw: null,
        recordingUrl: null,
        summary: null,
      },
    });

    // Cancel future appointments
    await tx.appointment.updateMany({
      where: {
        prospectId,
        startTime: { gt: new Date() },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      data: { status: "CANCELLED" },
    });

    // Anonymize past appointments
    await tx.appointment.updateMany({
      where: { prospectId },
      data: {
        description: null,
        meetingUrl: null,
      },
    });

    // Anonymize prospect
    await tx.prospect.update({
      where: { id: prospectId },
      data: {
        firstName: "ANONYMIZED",
        lastName: "ANONYMIZED",
        email: `erased-${prospectId.slice(0, 8)}@anonymized.local`,
        phone: null,
        alternatePhone: null,
        address: null,
        city: null,
        postalCode: null,
        caseDescription: null,
        opposingParty: null,
        consentGiven: false,
        dataRetainUntil: new Date(),
      },
    });

    // Log the erasure in audit log
    await tx.auditLog.create({
      data: {
        tenantId,
        action: "RGPD_ERASURE",
        entityType: "Prospect",
        entityId: prospectId,
        newValues: {
          erasedAt: new Date().toISOString(),
          reason: "Droit a l'oubli - RGPD",
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { success: true, prospectId };
}

// ── RGPD Stats ──────────────────────────────

export async function getRgpdStats(tenantId: string) {
  const now = new Date();
  const retentionSettings = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { dataRetentionDays: true },
  });

  const retentionDays = retentionSettings?.dataRetentionDays ?? 730;
  const retentionThreshold = new Date(
    now.getTime() - retentionDays * 24 * 60 * 60 * 1000
  );

  const [
    totalProspects,
    withConsent,
    withoutConsent,
    expiredRetention,
    totalConsents,
    activeConsents,
    revokedConsents,
    totalAuditEntries,
  ] = await Promise.all([
    prisma.prospect.count({ where: { tenantId } }),
    prisma.prospect.count({ where: { tenantId, consentGiven: true } }),
    prisma.prospect.count({ where: { tenantId, consentGiven: false } }),
    prisma.prospect.count({
      where: {
        tenantId,
        createdAt: { lt: retentionThreshold },
        firstName: { not: "ANONYMIZED" },
      },
    }),
    prisma.consentRecord.count({ where: { tenantId } }),
    prisma.consentRecord.count({
      where: { tenantId, granted: true, revokedAt: null },
    }),
    prisma.consentRecord.count({
      where: { tenantId, revokedAt: { not: null } },
    }),
    prisma.auditLog.count({ where: { tenantId } }),
  ]);

  return {
    totalProspects,
    withConsent,
    withoutConsent,
    consentRate:
      totalProspects > 0
        ? Math.round((withConsent / totalProspects) * 100)
        : 0,
    expiredRetention,
    retentionDays,
    totalConsents,
    activeConsents,
    revokedConsents,
    totalAuditEntries,
  };
}

// ── Cleanup Expired Data ──────────────────────────────

export async function cleanupExpiredData(tenantId: string) {
  const settings = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { dataRetentionDays: true },
  });

  if (!settings) return { cleaned: 0 };

  const threshold = new Date(
    Date.now() - settings.dataRetentionDays * 24 * 60 * 60 * 1000
  );

  // Find prospects that have exceeded retention period and aren't already anonymized
  const expired = await prisma.prospect.findMany({
    where: {
      tenantId,
      createdAt: { lt: threshold },
      firstName: { not: "ANONYMIZED" },
    },
    select: { id: true },
  });

  let cleaned = 0;
  for (const prospect of expired) {
    await eraseProspectData(tenantId, prospect.id);
    cleaned++;
  }

  return { cleaned };
}
