import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Auth
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Encryption (optional - falls back to NEXTAUTH_SECRET)
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // Redis (optional in dev)
  REDIS_URL: z.string().optional(),

  // External services (optional - features degrade gracefully)
  ANTHROPIC_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(
      `\n[ENV] Missing or invalid environment variables:\n${formatted}\n`
    );

    // In production, fail hard
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration");
    }
  }

  _env = (result.success ? result.data : envSchema.parse({
    ...process.env,
    // Provide defaults for dev
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5433/serviceia",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-prod",
  })) as Env;

  return _env;
}
