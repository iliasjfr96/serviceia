import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay, format, parse, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

// GET - Get available slots for a tenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Find tenant by slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      practiceAreas: {
        where: { isActive: true },
        select: { name: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Cabinet not found" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const dateParam = searchParams.get("date");
  const weeksAhead = parseInt(searchParams.get("weeks") || "2");

  const startDate = dateParam ? new Date(dateParam) : startOfDay(new Date());
  const endDate = addDays(startDate, weeksAhead * 7);

  // Get availability slots
  const availabilitySlots = await prisma.availabilitySlot.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
      isBlocked: false,
    },
  });

  // Get existing appointments in the date range
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      startTime: { gte: startDate, lte: endDate },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Generate available time slots for each day
  const slots: {
    date: string;
    dayOfWeek: number;
    slots: { startTime: string; endTime: string; available: boolean }[];
  }[] = [];

  for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dateStr = format(d, "yyyy-MM-dd");

    // Find availability for this day
    const daySlots = availabilitySlots.filter(
      (slot) =>
        slot.dayOfWeek === dayOfWeek ||
        (slot.specificDate && format(slot.specificDate, "yyyy-MM-dd") === dateStr)
    );

    if (daySlots.length === 0) continue;

    const dayAvailableSlots: { startTime: string; endTime: string; available: boolean }[] = [];

    for (const slot of daySlots) {
      // Parse start and end times
      const slotStart = parse(slot.startTime, "HH:mm", d);
      const slotEnd = parse(slot.endTime, "HH:mm", d);
      const duration = slot.slotDuration;
      const buffer = slot.bufferTime;

      // Generate individual time slots
      let current = slotStart;
      while (current < slotEnd) {
        const slotEndTime = new Date(current.getTime() + duration * 60000);
        if (slotEndTime > slotEnd) break;

        const slotStartStr = format(current, "HH:mm");
        const slotEndStr = format(slotEndTime, "HH:mm");

        // Check if this slot conflicts with existing appointments
        const isBooked = existingAppointments.some((appt) => {
          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(appt.endTime);
          const slotStartDateTime = parse(
            `${dateStr} ${slotStartStr}`,
            "yyyy-MM-dd HH:mm",
            new Date()
          );
          const slotEndDateTime = parse(
            `${dateStr} ${slotEndStr}`,
            "yyyy-MM-dd HH:mm",
            new Date()
          );

          return (
            (slotStartDateTime >= apptStart && slotStartDateTime < apptEnd) ||
            (slotEndDateTime > apptStart && slotEndDateTime <= apptEnd) ||
            (slotStartDateTime <= apptStart && slotEndDateTime >= apptEnd)
          );
        });

        // Check if the slot is in the past
        const slotDateTime = parse(
          `${dateStr} ${slotStartStr}`,
          "yyyy-MM-dd HH:mm",
          new Date()
        );
        const isPast = isBefore(slotDateTime, new Date());

        dayAvailableSlots.push({
          startTime: slotStartStr,
          endTime: slotEndStr,
          available: !isBooked && !isPast,
        });

        // Move to next slot with buffer
        current = new Date(slotEndTime.getTime() + buffer * 60000);
      }
    }

    if (dayAvailableSlots.length > 0) {
      slots.push({
        date: dateStr,
        dayOfWeek,
        slots: dayAvailableSlots,
      });
    }
  }

  return NextResponse.json({
    tenant: {
      name: tenant.name,
      slug: tenant.slug,
      practiceAreas: tenant.practiceAreas.map((pa) => pa.name),
    },
    slots,
  });
}

const bookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  practiceArea: z.string().optional(),
  description: z.string().max(1000).optional(),
  consent: z.boolean().refine((v) => v === true, {
    message: "Le consentement est requis",
  }),
});

// POST - Create a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Find tenant by slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Cabinet not found" }, { status: 404 });
  }

  const body = await request.json();
  const result = bookingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const {
    date,
    startTime,
    endTime,
    firstName,
    lastName,
    email,
    phone,
    practiceArea,
    description,
  } = result.data;

  // Parse date and times
  const startDateTime = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
  const endDateTime = parse(`${date} ${endTime}`, "yyyy-MM-dd HH:mm", new Date());
  const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);

  // Check if slot is still available
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      OR: [
        {
          startTime: { lte: startDateTime },
          endTime: { gt: startDateTime },
        },
        {
          startTime: { lt: endDateTime },
          endTime: { gte: endDateTime },
        },
        {
          startTime: { gte: startDateTime },
          endTime: { lte: endDateTime },
        },
      ],
    },
  });

  if (conflictingAppointment) {
    return NextResponse.json(
      { error: "Ce creneau n'est plus disponible" },
      { status: 409 }
    );
  }

  // Check if the slot is in the past
  if (isBefore(startDateTime, new Date())) {
    return NextResponse.json(
      { error: "Impossible de reserver un creneau passe" },
      { status: 400 }
    );
  }

  // Find practice area if provided
  let practiceAreaRecord = null;
  if (practiceArea) {
    practiceAreaRecord = await prisma.tenantPracticeArea.findFirst({
      where: {
        tenantId: tenant.id,
        name: practiceArea,
        isActive: true,
      },
    });
  }

  // Create or find prospect
  let prospect = await prisma.prospect.findFirst({
    where: {
      tenantId: tenant.id,
      email,
    },
  });

  if (!prospect) {
    prospect = await prisma.prospect.create({
      data: {
        tenantId: tenant.id,
        firstName,
        lastName,
        email,
        phone,
        ...(practiceAreaRecord ? { practiceAreaId: practiceAreaRecord.id } : {}),
        source: "WEBSITE",
        stage: "PROSPECT",
        consentGiven: true,
        consentDate: new Date(),
      },
    });

    // Record consent
    await prisma.consentRecord.create({
      data: {
        tenantId: tenant.id,
        prospectId: prospect.id,
        consentType: "BOOKING",
        granted: true,
        method: "FORM",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
  } else {
    // Update prospect info
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        firstName,
        lastName,
        phone,
        ...(practiceAreaRecord ? { practiceAreaId: practiceAreaRecord.id } : {}),
      },
    });
  }

  // Create appointment
  const appointment = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      prospectId: prospect.id,
      title: `RDV avec ${firstName} ${lastName}`,
      description,
      startTime: startDateTime,
      endTime: endDateTime,
      duration,
      consultationType: practiceArea,
      bookedBy: "ONLINE",
      status: "SCHEDULED",
    },
  });

  // Create notification for the tenant
  await prisma.notification.create({
    data: {
      tenantId: tenant.id,
      type: "APPOINTMENT_BOOKED",
      title: "Nouveau RDV reserve",
      message: `${firstName} ${lastName} a reserve un RDV le ${format(startDateTime, "EEEE d MMMM 'a' HH:mm", { locale: fr })}`,
      data: { appointmentId: appointment.id, prospectId: prospect.id },
    },
  });

  return NextResponse.json(
    {
      success: true,
      appointment: {
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      },
    },
    { status: 201 }
  );
}
