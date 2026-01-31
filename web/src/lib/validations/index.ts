import { z } from "zod";

// ── Common Schemas ──────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const idParamSchema = z.object({
  id: z.string().min(1, "ID requis"),
});

// ── Prospect Schemas ──────────────────────────────

export const createProspectSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email("Email invalide").max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  alternatePhone: z.string().max(20).optional(),
  notes: z.string().max(5000).optional(),
  source: z.enum([
    "WEBSITE", "PHONE", "REFERRAL", "SOCIAL_MEDIA",
    "ADVERTISING", "CALL_AI", "OTHER"
  ]).optional(),
  urgencyLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  practiceAreaId: z.string().optional(),
});

export const updateProspectSchema = createProspectSchema.partial().extend({
  stage: z.enum([
    "NEW", "CONTACTED", "QUALIFIED", "CONSULTATION_SCHEDULED",
    "CONSULTATION_DONE", "PROPOSAL_SENT", "NEGOTIATION",
    "CONVERTED", "LOST"
  ]).optional(),
  isActive: z.boolean().optional(),
});

export const prospectFilterSchema = z.object({
  search: z.string().max(200).optional(),
  stage: z.string().optional(),
  urgencyLevel: z.string().optional(),
  source: z.string().optional(),
  practiceAreaId: z.string().optional(),
  hasRecentCalls: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["createdAt", "updatedAt", "leadScore", "lastName"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ── Appointment Schemas ──────────────────────────────

const appointmentBaseSchema = z.object({
  prospectId: z.string().optional(),
  title: z.string().min(1, "Titre requis").max(200),
  description: z.string().max(2000).optional(),
  startTime: z.string().datetime("Date de debut invalide"),
  endTime: z.string().datetime("Date de fin invalide"),
  duration: z.number().int().positive().optional(),
  consultationType: z.string().max(100).optional(),
  location: z.string().max(500).optional(),
  isVirtual: z.boolean().optional(),
  meetingUrl: z.string().url().max(500).optional().or(z.literal("")),
  bookedBy: z.enum(["AI", "MANUAL", "ONLINE"]).optional(),
  depositRequired: z.boolean().optional(),
  depositAmount: z.number().min(0).optional(),
});

export const createAppointmentSchema = appointmentBaseSchema
  .refine(
    (data) => new Date(data.endTime) > new Date(data.startTime),
    { message: "La date de fin doit etre apres la date de debut", path: ["endTime"] }
  )
  .transform((data) => ({
    ...data,
    // Calculate duration in minutes if not provided
    duration: data.duration ?? Math.round(
      (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000
    ),
  }));

export const updateAppointmentSchema = appointmentBaseSchema.partial();

// ── Campaign Schemas ──────────────────────────────

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Nom requis").max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["EMAIL", "SMS", "MIXED"]),
  channel: z.enum(["EMAIL", "SMS"]).optional(),
  prospectListId: z.string().optional(),
  emailSubject: z.string().max(200).optional(),
  emailBody: z.string().max(50000).optional(),
  smsBody: z.string().max(1600).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED"]).optional(),
});

// ── Prospect List Schemas ──────────────────────────────

export const createProspectListSchema = z.object({
  name: z.string().min(1, "Nom requis").max(200),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hex invalide").optional(),
});

export const updateProspectListSchema = createProspectListSchema.partial();

export const addToListSchema = z.object({
  prospectIds: z.array(z.string()).min(1, "Au moins un prospect requis"),
});

export const removeFromListSchema = z.object({
  prospectId: z.string().min(1, "Prospect ID requis"),
});

// ── User/Team Schemas ──────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email("Email invalide").max(255),
  name: z.string().min(1, "Nom requis").max(200),
  password: z.string().min(8, "Mot de passe: 8 caracteres minimum").max(100),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const updateUserSchema = z.object({
  name: z.string().max(200).optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  isActive: z.boolean().optional(),
});

// ── Agent Config Schemas ──────────────────────────────

export const updateAgentConfigSchema = z.object({
  agentName: z.string().max(100).optional(),
  greetingMessage: z.string().max(2000).optional(),
  personality: z.string().max(5000).optional(),
  voiceId: z.string().max(200).optional(),
  voiceProvider: z.string().max(50).optional(),
  elevenLabsAgentId: z.string().max(100).optional(), // ID agent conversationnel ElevenLabs
  llmModel: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(100).max(8000).optional(),
  primaryLanguage: z.string().max(10).optional(),
  supportedLanguages: z.array(z.string().max(10)).optional(),
  maxCallDuration: z.number().int().min(60).max(3600).optional(),
  silenceTimeout: z.number().int().min(1).max(60).optional(),
  enableRecording: z.boolean().optional(),
  requireConsent: z.boolean().optional(),
  emergencyTransferNumber: z.string().max(20).optional(),
  enableEmergencyDetection: z.boolean().optional(),
  neverGiveLegalAdvice: z.boolean().optional(),
  alwaysIdentifyAsAI: z.boolean().optional(),
});

// ── Automation/Rules Schemas ──────────────────────────────

export const createAutomationSchema = z.object({
  name: z.string().min(1, "Nom requis").max(200),
  description: z.string().max(1000).optional(),
  triggerType: z.enum([
    "APPOINTMENT_REMINDER", "FOLLOW_UP", "STAGE_CHANGE",
    "NO_RESPONSE", "CUSTOM"
  ]),
  action: z.enum(["SEND_EMAIL", "SEND_SMS", "CREATE_TASK", "CHANGE_STAGE"]),
  config: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

// ── Integration Schemas ──────────────────────────────

export const updateIntegrationSchema = z.object({
  syncEnabled: z.boolean().optional(),
  calendarId: z.string().max(500).optional(),
});

// ── Bulk Action Schemas ──────────────────────────────

export const bulkActionSchema = z.object({
  action: z.enum(["updateStage", "delete", "assignTo", "addTag"]),
  prospectIds: z.array(z.string()).min(1).max(100),
  stage: z.string().optional(),
  assignToId: z.string().optional(),
  tagId: z.string().optional(),
});

// ── Helper function ──────────────────────────────

import { NextResponse } from "next/server";

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: NextResponse } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return {
      success: false,
      error: NextResponse.json(
        { error: "Donnees invalides", details: errors },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; error: NextResponse } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validateBody(schema, params);
}
