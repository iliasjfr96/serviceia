import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveTenantId } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = await resolveTenantId(
    session.user.tenantId,
    session.user.role
  );
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { id } = await params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      tenantId,
      OR: [{ userId: session.user.id }, { userId: null }],
    },
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
