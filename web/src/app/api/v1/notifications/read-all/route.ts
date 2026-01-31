import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveTenantId } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";

// POST - Mark all notifications as read
export async function POST() {
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

  await prisma.notification.updateMany({
    where: {
      tenantId,
      OR: [{ userId: session.user.id }, { userId: null }],
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
