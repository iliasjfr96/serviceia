import { prisma } from "@/lib/prisma";
import { SYSTEM_LISTS } from "@/lib/constants/pipeline";

// ── Get or Create System List ──────────────────────────────

const SYSTEM_LIST_COLORS: Record<string, string> = {
  [SYSTEM_LISTS.TO_CALLBACK]: "#f97316", // orange
  [SYSTEM_LISTS.APPOINTMENT_CONFIRMED]: "#8b5cf6", // purple
  [SYSTEM_LISTS.CANCELLED]: "#ef4444", // red
};

export async function getOrCreateSystemList(
  tenantId: string,
  listName: string
) {
  // Try to find existing list
  let list = await prisma.prospectList.findFirst({
    where: { tenantId, name: listName },
  });

  // Create if doesn't exist
  if (!list) {
    list = await prisma.prospectList.create({
      data: {
        tenantId,
        name: listName,
        description: `Liste systeme: ${listName}`,
        color: SYSTEM_LIST_COLORS[listName] || "#6b7280",
      },
    });
  }

  return list;
}

// ── Add Single Prospect to List ──────────────────────────────

export async function addProspectToList(
  tenantId: string,
  listId: string,
  prospectId: string
) {
  // Verify list and prospect belong to tenant
  const [list, prospect] = await Promise.all([
    prisma.prospectList.findFirst({ where: { id: listId, tenantId } }),
    prisma.prospect.findFirst({ where: { id: prospectId, tenantId } }),
  ]);

  if (!list || !prospect) return null;

  // Check if already member
  const existing = await prisma.prospectListMember.findUnique({
    where: { listId_prospectId: { listId, prospectId } },
  });

  if (existing) return existing;

  return prisma.prospectListMember.create({
    data: { listId, prospectId },
  });
}

// ── Remove Prospect from System List by Name ──────────────────────────────

export async function removeProspectFromSystemList(
  tenantId: string,
  listName: string,
  prospectId: string
) {
  const list = await prisma.prospectList.findFirst({
    where: { tenantId, name: listName },
  });

  if (!list) return null;

  return prisma.prospectListMember.deleteMany({
    where: { listId: list.id, prospectId },
  });
}

// ── List Prospect Lists ──────────────────────────────

export async function listProspectLists(tenantId: string) {
  return prisma.prospectList.findMany({
    where: { tenantId },
    include: {
      _count: { select: { members: true, campaigns: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ── Get Prospect List ──────────────────────────────

export async function getProspectList(tenantId: string, listId: string) {
  return prisma.prospectList.findFirst({
    where: { id: listId, tenantId },
    include: {
      _count: { select: { members: true, campaigns: true } },
      members: {
        include: {
          prospect: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              stage: true,
              leadScore: true,
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });
}

// ── Create Prospect List ──────────────────────────────

export async function createProspectList(
  tenantId: string,
  data: { name: string; description?: string; color?: string }
) {
  return prisma.prospectList.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description,
      color: data.color,
    },
    include: {
      _count: { select: { members: true, campaigns: true } },
    },
  });
}

// ── Update Prospect List ──────────────────────────────

export async function updateProspectList(
  tenantId: string,
  listId: string,
  data: { name?: string; description?: string; color?: string }
) {
  const existing = await prisma.prospectList.findFirst({
    where: { id: listId, tenantId },
  });
  if (!existing) return null;

  return prisma.prospectList.update({
    where: { id: listId },
    data,
    include: {
      _count: { select: { members: true, campaigns: true } },
    },
  });
}

// ── Delete Prospect List ──────────────────────────────

export async function deleteProspectList(tenantId: string, listId: string) {
  const existing = await prisma.prospectList.findFirst({
    where: { id: listId, tenantId },
  });
  if (!existing) return null;

  // Members cascade on delete
  return prisma.prospectList.delete({ where: { id: listId } });
}

// ── Add Prospects to List ──────────────────────────────

export async function addProspectsToList(
  tenantId: string,
  listId: string,
  prospectIds: string[]
) {
  // Verify list belongs to tenant
  const list = await prisma.prospectList.findFirst({
    where: { id: listId, tenantId },
  });
  if (!list) return null;

  // Verify prospects belong to tenant
  const prospects = await prisma.prospect.findMany({
    where: { id: { in: prospectIds }, tenantId },
    select: { id: true },
  });

  const validIds = prospects.map((p) => p.id);

  // Upsert members (skip duplicates)
  const results = await Promise.allSettled(
    validIds.map((prospectId) =>
      prisma.prospectListMember.create({
        data: { listId, prospectId },
      })
    )
  );

  const added = results.filter((r) => r.status === "fulfilled").length;
  return { added, total: validIds.length };
}

// ── Remove Prospect from List ──────────────────────────────

export async function removeProspectFromList(
  tenantId: string,
  listId: string,
  prospectId: string
) {
  const list = await prisma.prospectList.findFirst({
    where: { id: listId, tenantId },
  });
  if (!list) return null;

  return prisma.prospectListMember.deleteMany({
    where: { listId, prospectId },
  });
}

// ── Search prospects for adding to list ──────────────────────────────

export async function searchProspectsForList(
  tenantId: string,
  listId: string,
  search: string
) {
  // Get current members to exclude them
  const existingMembers = await prisma.prospectListMember.findMany({
    where: { listId },
    select: { prospectId: true },
  });
  const excludeIds = existingMembers.map((m) => m.prospectId);

  return prisma.prospect.findMany({
    where: {
      tenantId,
      isActive: true,
      id: { notIn: excludeIds },
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      stage: true,
    },
    take: 20,
    orderBy: { lastName: "asc" },
  });
}
