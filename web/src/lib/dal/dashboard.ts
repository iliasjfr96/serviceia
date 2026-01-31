import { prisma } from "@/lib/prisma";

export async function getDashboardKPIs(tenantId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const startOfWeek = new Date(startOfToday);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [
    callsToday,
    callsThisWeek,
    prospectsThisWeek,
    prospectsThisMonth,
    totalProspects,
    convertedThisMonth,
    appointmentsThisWeek,
    appointmentsToday,
    upcomingAppointments,
    callsCompleted,
    emergencies,
  ] = await Promise.all([
    // Calls today
    prisma.call.count({
      where: {
        tenantId,
        createdAt: { gte: startOfToday, lt: endOfToday },
      },
    }),
    // Calls this week
    prisma.call.count({
      where: {
        tenantId,
        createdAt: { gte: startOfWeek, lt: endOfWeek },
      },
    }),
    // New prospects this week
    prisma.prospect.count({
      where: {
        tenantId,
        isActive: true,
        createdAt: { gte: startOfWeek, lt: endOfWeek },
      },
    }),
    // New prospects this month
    prisma.prospect.count({
      where: {
        tenantId,
        isActive: true,
        createdAt: { gte: startOfMonth },
      },
    }),
    // Total active prospects
    prisma.prospect.count({
      where: { tenantId, isActive: true },
    }),
    // Converted to client this month
    prisma.prospect.count({
      where: {
        tenantId,
        isActive: true,
        stage: "CLIENT",
        convertedToClientAt: { gte: startOfMonth },
      },
    }),
    // Appointments this week
    prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: startOfWeek, lt: endOfWeek },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    // Appointments today
    prisma.appointment.count({
      where: {
        tenantId,
        startTime: { gte: startOfToday, lt: endOfToday },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    // Upcoming appointments (next 7 days)
    prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: now, lt: endOfWeek },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      include: {
        prospect: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    // Completed calls this week
    prisma.call.count({
      where: {
        tenantId,
        status: "COMPLETED",
        createdAt: { gte: startOfWeek, lt: endOfWeek },
      },
    }),
    // Emergencies this week
    prisma.call.count({
      where: {
        tenantId,
        isEmergency: true,
        createdAt: { gte: startOfWeek, lt: endOfWeek },
      },
    }),
  ]);

  // Conversion rate this month
  const conversionRate =
    prospectsThisMonth > 0
      ? Math.round((convertedThisMonth / prospectsThisMonth) * 100)
      : 0;

  return {
    callsToday,
    callsThisWeek,
    callsCompleted,
    prospectsThisWeek,
    prospectsThisMonth,
    totalProspects,
    convertedThisMonth,
    conversionRate,
    appointmentsThisWeek,
    appointmentsToday,
    upcomingAppointments,
    emergencies,
  };
}

export async function getDashboardChartData(tenantId: string) {
  const now = new Date();

  // Last 7 days call volume
  const days: { date: string; calls: number; prospects: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [callCount, prospectCount] = await Promise.all([
      prisma.call.count({
        where: {
          tenantId,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      prisma.prospect.count({
        where: {
          tenantId,
          isActive: true,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      }),
    ]);

    days.push({
      date: dayStart.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
      }),
      calls: callCount,
      prospects: prospectCount,
    });
  }

  // Pipeline funnel
  const pipeline = await prisma.prospect.groupBy({
    by: ["stage"],
    where: { tenantId, isActive: true },
    _count: true,
  });

  const pipelineData = [
    "NEW",
    "TO_CALLBACK",
    "QUALIFIED",
    "APPOINTMENT",
    "CLIENT",
    "DOSSIER",
    "CLOSED",
    "LOST",
  ].map((stage) => ({
    stage,
    count: pipeline.find((p) => p.stage === stage)?._count ?? 0,
  }));

  // Calls by status
  const callsByStatus = await prisma.call.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: true,
  });

  return {
    dailyActivity: days,
    pipeline: pipelineData,
    callsByStatus: callsByStatus.map((c) => ({
      status: c.status,
      count: c._count,
    })),
  };
}

export async function getRecentActivity(tenantId: string) {
  // Fetch recent calls, prospects, and appointments
  const [recentCalls, recentProspects, recentAppointments] = await Promise.all([
    prisma.call.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        direction: true,
        status: true,
        callerNumber: true,
        duration: true,
        summary: true,
        isEmergency: true,
        createdAt: true,
        prospect: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.prospect.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        source: true,
        stage: true,
        createdAt: true,
      },
    }),
    prisma.appointment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        startTime: true,
        status: true,
        bookedBy: true,
        createdAt: true,
        prospect: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
  ]);

  // Merge and sort by date
  type ActivityItem = {
    type: "call" | "prospect" | "appointment";
    id: string;
    createdAt: Date;
    data: Record<string, unknown>;
  };

  const activities: ActivityItem[] = [
    ...recentCalls.map((c) => ({
      type: "call" as const,
      id: c.id,
      createdAt: c.createdAt,
      data: c as unknown as Record<string, unknown>,
    })),
    ...recentProspects.map((p) => ({
      type: "prospect" as const,
      id: p.id,
      createdAt: p.createdAt,
      data: p as unknown as Record<string, unknown>,
    })),
    ...recentAppointments.map((a) => ({
      type: "appointment" as const,
      id: a.id,
      createdAt: a.createdAt,
      data: a as unknown as Record<string, unknown>,
    })),
  ];

  activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return activities.slice(0, 10);
}
