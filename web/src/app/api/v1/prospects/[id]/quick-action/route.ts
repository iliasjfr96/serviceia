import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  getOrCreateSystemList,
  addProspectToList,
  removeProspectFromSystemList,
} from "@/lib/dal/prospect-lists";
import { SYSTEM_LISTS } from "@/lib/constants/pipeline";

const quickActionSchema = z.object({
  action: z.enum(["CANCELLED", "APPOINTMENT_CONFIRMED"]),
  appointmentDate: z.string().optional(), // ISO date string for RDV
  appointmentTime: z.string().optional(), // HH:mm format
  notes: z.string().optional(),
});

// POST /api/v1/prospects/[id]/quick-action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: prospectId } = await params;

  try {
    const body = await request.json();
    const data = quickActionSchema.parse(body);

    // Get prospect with tenant
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      select: {
        id: true,
        tenantId: true,
        firstName: true,
        lastName: true,
        phone: true,
        stage: true,
      },
    });

    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    const tenantId = prospect.tenantId;
    const prospectName =
      [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") ||
      prospect.phone ||
      "Prospect";

    if (data.action === "CANCELLED") {
      // ── Mark as Cancelled ──────────────────────────────

      // Update stage to LOST
      await prisma.prospect.update({
        where: { id: prospectId },
        data: {
          stage: "LOST",
          stageChangedAt: new Date(),
        },
      });

      // Remove from "À rappeler" list
      await removeProspectFromSystemList(tenantId, SYSTEM_LISTS.TO_CALLBACK, prospectId);

      // Add to "Annulés" list
      const cancelledList = await getOrCreateSystemList(tenantId, SYSTEM_LISTS.CANCELLED);
      await addProspectToList(tenantId, cancelledList.id, prospectId);

      // Add note
      await prisma.note.create({
        data: {
          prospectId,
          content: data.notes || "Prospect annule apres rappel",
          type: "SYSTEM",
        },
      });

      // Cancel any pending callback appointments
      await prisma.appointment.updateMany({
        where: {
          prospectId,
          status: "SCHEDULED",
          bookedBy: "AI",
        },
        data: {
          status: "CANCELLED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Prospect marqué comme annulé",
        newStage: "LOST",
      });
    }

    if (data.action === "APPOINTMENT_CONFIRMED") {
      // ── Confirm Appointment ──────────────────────────────

      if (!data.appointmentDate || !data.appointmentTime) {
        return NextResponse.json(
          { error: "Date et heure du RDV requis" },
          { status: 400 }
        );
      }

      // Parse appointment datetime
      const appointmentStart = new Date(
        `${data.appointmentDate}T${data.appointmentTime}:00`
      );
      const appointmentEnd = new Date(appointmentStart.getTime() + 60 * 60000); // 1h

      // Update stage to APPOINTMENT
      await prisma.prospect.update({
        where: { id: prospectId },
        data: {
          stage: "APPOINTMENT",
          stageChangedAt: new Date(),
        },
      });

      // Remove from "À rappeler" list
      await removeProspectFromSystemList(tenantId, SYSTEM_LISTS.TO_CALLBACK, prospectId);

      // Add to "RDV confirmés" list
      const appointmentList = await getOrCreateSystemList(
        tenantId,
        SYSTEM_LISTS.APPOINTMENT_CONFIRMED
      );
      await addProspectToList(tenantId, appointmentList.id, prospectId);

      // Cancel any pending callback appointments
      await prisma.appointment.updateMany({
        where: {
          prospectId,
          status: "SCHEDULED",
          bookedBy: "AI",
        },
        data: {
          status: "CANCELLED",
        },
      });

      // Create the real appointment
      const appointment = await prisma.appointment.create({
        data: {
          tenantId,
          prospectId,
          title: `RDV: ${prospectName}`,
          description: data.notes || "Rendez-vous confirmé après rappel",
          startTime: appointmentStart,
          endTime: appointmentEnd,
          duration: 60,
          status: "SCHEDULED",
          bookedBy: "MANUAL",
          consultationType: "FIRST_CONSULTATION",
        },
      });

      // Add note
      await prisma.note.create({
        data: {
          prospectId,
          content: `RDV confirme pour le ${appointmentStart.toLocaleDateString("fr-FR")} a ${data.appointmentTime}`,
          type: "SYSTEM",
        },
      });

      return NextResponse.json({
        success: true,
        message: "RDV confirmé",
        newStage: "APPOINTMENT",
        appointmentId: appointment.id,
      });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("[Quick Action] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
