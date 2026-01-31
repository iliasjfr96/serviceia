import { prisma } from "@/lib/prisma";
import type { Prisma, TenantPlan } from "@prisma/client";

// ── List Tenants ──────────────────────────────

export async function listTenants(options: {
  search?: string;
  plan?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
} = {}) {
  const { search, plan, isActive, page = 1, limit = 20 } = options;

  const where: Prisma.TenantWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  if (plan) {
    where.plan = plan as TenantPlan;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            prospects: true,
            calls: true,
            appointments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    tenants,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Get Tenant ──────────────────────────────

export async function getTenant(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: {
          users: true,
          prospects: true,
          calls: true,
          appointments: true,
          automationRules: true,
          campaigns: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// ── Create Tenant ──────────────────────────────

export interface CreateTenantData {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  siret?: string;
  website?: string;
  plan?: TenantPlan;
  setupFee?: number;
  monthlyFee?: number;
  perCallFee?: number;
}

export async function createTenant(data: CreateTenantData) {
  const { setupFee, monthlyFee, perCallFee, ...rest } = data;

  return prisma.tenant.create({
    data: {
      ...rest,
      ...(setupFee !== undefined ? { setupFee } : {}),
      ...(monthlyFee !== undefined ? { monthlyFee } : {}),
      ...(perCallFee !== undefined ? { perCallFee } : {}),
    },
    include: {
      _count: {
        select: {
          users: true,
          prospects: true,
          calls: true,
          appointments: true,
        },
      },
    },
  });
}

// ── Update Tenant ──────────────────────────────

export async function updateTenant(
  tenantId: string,
  data: Partial<CreateTenantData> & { isActive?: boolean }
) {
  const existing = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });
  if (!existing) return null;

  const { setupFee, monthlyFee, perCallFee, ...rest } = data;

  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...rest,
      ...(setupFee !== undefined ? { setupFee } : {}),
      ...(monthlyFee !== undefined ? { monthlyFee } : {}),
      ...(perCallFee !== undefined ? { perCallFee } : {}),
    },
    include: {
      _count: {
        select: {
          users: true,
          prospects: true,
          calls: true,
          appointments: true,
        },
      },
    },
  });
}

// ── Onboard Tenant ──────────────────────────────

export async function onboardTenant(tenantId: string) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { onboardedAt: new Date() },
  });
}

// ── Tenant Stats (for admin dashboard) ──────────────────

export async function getAdminStats() {
  const [
    totalTenants,
    activeTenants,
    totalUsers,
    totalProspects,
    totalCalls,
    totalAppointments,
    planCounts,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.prospect.count(),
    prisma.call.count(),
    prisma.appointment.count(),
    prisma.tenant.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),
  ]);

  const planDistribution: Record<string, number> = {};
  for (const p of planCounts) {
    planDistribution[p.plan] = p._count.plan;
  }

  return {
    totalTenants,
    activeTenants,
    inactiveTenants: totalTenants - activeTenants,
    totalUsers,
    totalProspects,
    totalCalls,
    totalAppointments,
    planDistribution,
  };
}

// ── Tenant Users Management ──────────────────

export async function listTenantUsers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateUserRole(
  userId: string,
  role: "ADMIN" | "MEMBER"
) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
}

// ── Audit Logs ──────────────────────────────

export async function listAuditLogs(options: {
  tenantId?: string;
  userId?: string;
  action?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { tenantId, userId, action, page = 1, limit = 25 } = options;

  const where: Prisma.AuditLogWhereInput = {};
  if (tenantId) where.tenantId = tenantId;
  if (userId) where.userId = userId;
  if (action) where.action = { contains: action, mode: "insensitive" };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
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
