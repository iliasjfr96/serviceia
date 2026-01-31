import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveTenantId } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// GET notifications
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitError = await enforceRateLimit(request, RATE_LIMITS.api);
  if (rateLimitError) return rateLimitError;

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

  const { searchParams } = request.nextUrl;
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const where = {
    tenantId,
    OR: [{ userId: session.user.id }, { userId: null }],
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    }),
  ]);

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}
