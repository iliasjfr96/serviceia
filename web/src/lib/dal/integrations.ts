import { prisma } from "@/lib/prisma";
import { encrypt, safeDecrypt } from "@/lib/encryption";
import type { CalendarProvider } from "@prisma/client";

// ── List Integrations ──────────────────────────────

export async function listIntegrations(tenantId: string) {
  return prisma.calendarIntegration.findMany({
    where: { tenantId },
    select: {
      id: true,
      provider: true,
      accountEmail: true,
      calendarId: true,
      syncEnabled: true,
      lastSyncAt: true,
      syncErrors: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// ── Get Integration ──────────────────────────────

export async function getIntegration(tenantId: string, integrationId: string) {
  return prisma.calendarIntegration.findFirst({
    where: { id: integrationId, tenantId },
    select: {
      id: true,
      provider: true,
      accountEmail: true,
      calendarId: true,
      syncEnabled: true,
      lastSyncAt: true,
      syncErrors: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ── Create Integration ──────────────────────────────

export interface CreateIntegrationData {
  provider: CalendarProvider;
  accountEmail: string;
  accessToken: string;
  refreshToken?: string;
  calendarId?: string;
}

export async function createIntegration(
  tenantId: string,
  data: CreateIntegrationData
) {
  return prisma.calendarIntegration.create({
    data: {
      tenantId,
      provider: data.provider,
      accountEmail: data.accountEmail,
      accessToken: encrypt(data.accessToken),
      refreshToken: data.refreshToken ? encrypt(data.refreshToken) : undefined,
      calendarId: data.calendarId,
      syncEnabled: true,
    },
    select: {
      id: true,
      provider: true,
      accountEmail: true,
      calendarId: true,
      syncEnabled: true,
      lastSyncAt: true,
      syncErrors: true,
      createdAt: true,
    },
  });
}

// ── Update Integration ──────────────────────────────

export async function updateIntegration(
  tenantId: string,
  integrationId: string,
  data: { syncEnabled?: boolean; calendarId?: string }
) {
  const existing = await prisma.calendarIntegration.findFirst({
    where: { id: integrationId, tenantId },
  });
  if (!existing) return null;

  return prisma.calendarIntegration.update({
    where: { id: integrationId },
    data,
    select: {
      id: true,
      provider: true,
      accountEmail: true,
      calendarId: true,
      syncEnabled: true,
      lastSyncAt: true,
      syncErrors: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ── Delete Integration ──────────────────────────────

export async function deleteIntegration(
  tenantId: string,
  integrationId: string
) {
  const existing = await prisma.calendarIntegration.findFirst({
    where: { id: integrationId, tenantId },
  });
  if (!existing) return null;

  return prisma.calendarIntegration.delete({
    where: { id: integrationId },
  });
}

// ── Upsert Integration (for OAuth callbacks) ──────────────────────────────

export interface UpsertIntegrationData {
  provider: CalendarProvider;
  accountEmail: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export async function upsertIntegration(
  tenantId: string,
  data: UpsertIntegrationData
) {
  // Encrypt tokens before storing
  const encryptedAccessToken = encrypt(data.accessToken);
  const encryptedRefreshToken = data.refreshToken
    ? encrypt(data.refreshToken)
    : undefined;

  return prisma.calendarIntegration.upsert({
    where: {
      tenantId_provider: {
        tenantId,
        provider: data.provider,
      },
    },
    create: {
      tenantId,
      provider: data.provider,
      accountEmail: data.accountEmail,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      syncEnabled: true,
      syncErrors: 0,
    },
    update: {
      accountEmail: data.accountEmail,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      syncErrors: 0,
    },
    select: {
      id: true,
      provider: true,
      accountEmail: true,
      calendarId: true,
      syncEnabled: true,
      lastSyncAt: true,
      syncErrors: true,
      createdAt: true,
    },
  });
}

// ── Integration Status ──────────────────────────────

export async function getIntegrationStatus(tenantId: string) {
  const integrations = await prisma.calendarIntegration.findMany({
    where: { tenantId },
    select: {
      provider: true,
      syncEnabled: true,
      lastSyncAt: true,
      syncErrors: true,
    },
  });

  return {
    google: integrations.find((i) => i.provider === "GOOGLE") || null,
    outlook: integrations.find((i) => i.provider === "OUTLOOK") || null,
    totalIntegrations: integrations.length,
    activeSync: integrations.filter((i) => i.syncEnabled).length,
  };
}

// ── Get Integration with Decrypted Tokens ──────────────────────────────

export interface IntegrationTokens {
  id: string;
  provider: CalendarProvider;
  accountEmail: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}

export async function getIntegrationWithTokens(
  tenantId: string,
  provider: CalendarProvider
): Promise<IntegrationTokens | null> {
  const integration = await prisma.calendarIntegration.findFirst({
    where: { tenantId, provider, syncEnabled: true },
    select: {
      id: true,
      provider: true,
      accountEmail: true,
      accessToken: true,
      refreshToken: true,
      tokenExpiresAt: true,
    },
  });

  if (!integration) return null;

  // Decrypt tokens
  return {
    id: integration.id,
    provider: integration.provider,
    accountEmail: integration.accountEmail,
    accessToken: safeDecrypt(integration.accessToken),
    refreshToken: safeDecrypt(integration.refreshToken),
    tokenExpiresAt: integration.tokenExpiresAt,
  };
}

// ── Update Tokens (for refresh) ──────────────────────────────

export async function updateIntegrationTokens(
  integrationId: string,
  tokens: { accessToken: string; refreshToken?: string; tokenExpiresAt?: Date }
) {
  return prisma.calendarIntegration.update({
    where: { id: integrationId },
    data: {
      accessToken: encrypt(tokens.accessToken),
      refreshToken: tokens.refreshToken
        ? encrypt(tokens.refreshToken)
        : undefined,
      tokenExpiresAt: tokens.tokenExpiresAt,
      syncErrors: 0,
    },
  });
}
