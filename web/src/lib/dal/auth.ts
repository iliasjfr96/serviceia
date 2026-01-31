import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

export async function requireTenant() {
  const user = await getCurrentUser();
  if (!user.tenantId) {
    if (user.role === "SUPER_ADMIN") {
      return { user, tenantId: null as string | null };
    }
    redirect("/login");
  }
  return { user, tenantId: user.tenantId };
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

export async function getTenantIdFromRequest(
  _request: Request
): Promise<{ userId: string; tenantId: string | null; role: string } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
  };
}

export async function resolveTenantId(
  userTenantId: string | null,
  role: string,
  requestedTenantId?: string | null
): Promise<string | null> {
  if (role === "SUPER_ADMIN") {
    if (requestedTenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: requestedTenantId },
        select: { id: true },
      });
      return tenant?.id ?? null;
    }
    // SUPER_ADMIN with a tenantId assigned
    if (userTenantId) return userTenantId;
    // Fallback: use first tenant (single-tenant dev or agency default)
    const first = await prisma.tenant.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return first?.id ?? null;
  }
  return userTenantId;
}
