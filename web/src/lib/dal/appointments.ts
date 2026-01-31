import { prisma } from "@/lib/prisma";
import type { Prisma, AppointmentStatus } from "@prisma/client";

export interface AppointmentFilters {
  status?: AppointmentStatus;
  prospectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface AppointmentListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: AppointmentFilters;
}

export async function listAppointments(
  tenantId: string,
  options: AppointmentListOptions = {}
) {
  const {
    page = 1,
    limit = 50,
    sortBy = "startTime",
    sortOrder = "asc",
    filters = {},
  } = options;

  const where: Prisma.AppointmentWhereInput = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.prospectId) where.prospectId = filters.prospectId;
  if (filters.dateFrom || filters.dateTo) {
    where.startTime = {};
    if (filters.dateFrom)
      (where.startTime as Prisma.DateTimeFilter).gte = filters.dateFrom;
    if (filters.dateTo)
      (where.startTime as Prisma.DateTimeFilter).lte = filters.dateTo;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      {
        prospect: {
          OR: [
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const orderBy: Prisma.AppointmentOrderByWithRelationInput = {};
  const validSortFields = ["startTime", "createdAt", "status", "title"];
  if (validSortFields.includes(sortBy)) {
    (orderBy as Record<string, string>)[sortBy] = sortOrder;
  } else {
    orderBy.startTime = "asc";
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
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
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAppointmentById(
  tenantId: string,
  appointmentId: string
) {
  return prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      prospect: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          caseDescription: true,
        },
      },
    },
  });
}

export interface CreateAppointmentData {
  prospectId?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  consultationType?: string;
  location?: string;
  isVirtual?: boolean;
  meetingUrl?: string;
  bookedBy?: "AI" | "MANUAL" | "ONLINE";
  depositRequired?: boolean;
  depositAmount?: number;
}

export async function createAppointment(
  tenantId: string,
  data: CreateAppointmentData
) {
  const {
    prospectId,
    startTime,
    endTime,
    depositAmount,
    ...rest
  } = data;

  return prisma.appointment.create({
    data: {
      tenantId,
      ...rest,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      ...(prospectId ? { prospectId } : {}),
      ...(depositAmount !== undefined
        ? { depositAmount: depositAmount }
        : {}),
    },
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
  });
}

export async function updateAppointment(
  tenantId: string,
  appointmentId: string,
  data: Partial<CreateAppointmentData>
) {
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
  });
  if (!existing) return null;

  const { startTime, endTime, depositAmount, prospectId, ...rest } = data;

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      ...rest,
      ...(startTime ? { startTime: new Date(startTime) } : {}),
      ...(endTime ? { endTime: new Date(endTime) } : {}),
      ...(prospectId !== undefined ? { prospectId } : {}),
      ...(depositAmount !== undefined
        ? { depositAmount: depositAmount }
        : {}),
    },
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
  });
}

export async function updateAppointmentStatus(
  tenantId: string,
  appointmentId: string,
  status: AppointmentStatus
) {
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
  });
  if (!existing) return null;

  const updateData: Prisma.AppointmentUpdateInput = { status };

  if (status === "NO_SHOW") {
    updateData.noShowCount = { increment: 1 };
    updateData.lastNoShowAt = new Date();
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: updateData,
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
  });
}

export async function deleteAppointment(
  tenantId: string,
  appointmentId: string
) {
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
  });
  if (!existing) return null;

  return prisma.appointment.delete({
    where: { id: appointmentId },
  });
}

// ── Availability Slots ──────────────────────────────

export async function listAvailabilitySlots(tenantId: string) {
  return prisma.availabilitySlot.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export interface CreateAvailabilitySlotData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  consultationType?: string;
  slotDuration?: number;
  bufferTime?: number;
  maxBookings?: number;
  specificDate?: string;
  isBlocked?: boolean;
}

export async function createAvailabilitySlot(
  tenantId: string,
  data: CreateAvailabilitySlotData
) {
  const { specificDate, ...rest } = data;

  return prisma.availabilitySlot.create({
    data: {
      tenantId,
      ...rest,
      ...(specificDate ? { specificDate: new Date(specificDate) } : {}),
    },
  });
}

export async function updateAvailabilitySlot(
  tenantId: string,
  slotId: string,
  data: Partial<CreateAvailabilitySlotData>
) {
  const existing = await prisma.availabilitySlot.findFirst({
    where: { id: slotId, tenantId },
  });
  if (!existing) return null;

  const { specificDate, ...rest } = data;

  return prisma.availabilitySlot.update({
    where: { id: slotId },
    data: {
      ...rest,
      ...(specificDate !== undefined
        ? { specificDate: specificDate ? new Date(specificDate) : null }
        : {}),
    },
  });
}

export async function deleteAvailabilitySlot(
  tenantId: string,
  slotId: string
) {
  const existing = await prisma.availabilitySlot.findFirst({
    where: { id: slotId, tenantId },
  });
  if (!existing) return null;

  return prisma.availabilitySlot.update({
    where: { id: slotId },
    data: { isActive: false },
  });
}

// ── Stats ──────────────────────────────

export async function getAppointmentStats(tenantId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [total, today, thisWeek, byStatus, upcoming] = await Promise.all([
    prisma.appointment.count({ where: { tenantId } }),
    prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: startOfDay, lt: endOfDay },
      },
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: startOfWeek, lt: endOfWeek },
      },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: now },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),
  ]);

  return {
    total,
    today,
    thisWeek,
    upcoming,
    byStatus: Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    ),
  };
}

// ── Available time slots for booking ──────────────────

export async function getAvailableSlots(
  tenantId: string,
  date: Date
) {
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
  const dateStr = date.toISOString().split("T")[0];

  // Get availability rules for this day
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { dayOfWeek, specificDate: null },
        { specificDate: new Date(dateStr) },
      ],
    },
    orderBy: { startTime: "asc" },
  });

  // Get existing appointments for this day
  const startOfDay = new Date(dateStr);
  const endOfDay = new Date(dateStr);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      startTime: { gte: startOfDay, lt: endOfDay },
      status: { notIn: ["CANCELLED"] },
    },
    select: { startTime: true, endTime: true },
  });

  // Generate time slots from availability rules
  const availableSlots: { start: string; end: string }[] = [];

  for (const slot of slots) {
    if (slot.isBlocked) continue;

    const [startH, startM] = slot.startTime.split(":").map(Number);
    const [endH, endM] = slot.endTime.split(":").map(Number);
    const slotDuration = slot.slotDuration;
    const bufferTime = slot.bufferTime;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + slotDuration <= endMinutes) {
      const slotStart = new Date(dateStr);
      slotStart.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      // Check if this slot conflicts with existing appointments
      const hasConflict = existingAppointments.some((appt) => {
        return slotStart < appt.endTime && slotEnd > appt.startTime;
      });

      if (!hasConflict) {
        availableSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      currentMinutes += slotDuration + bufferTime;
    }
  }

  return availableSlots;
}
