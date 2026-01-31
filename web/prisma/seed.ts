import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "cabinet-demo" },
    update: {},
    create: {
      name: "Cabinet Demo & Associes",
      slug: "cabinet-demo",
      email: "contact@cabinet-demo.fr",
      phone: "+33 1 23 45 67 89",
      address: "12 rue de la Paix",
      city: "Paris",
      postalCode: "75002",
      country: "FR",
      siret: "12345678901234",
      website: "https://cabinet-demo.fr",
      timezone: "Europe/Paris",
      locale: "fr",
      plan: "PROFESSIONAL",
      dataRetentionDays: 730,
      isActive: true,
      onboardedAt: new Date(),
    },
  });

  console.log(`Tenant created: ${tenant.name} (${tenant.id})`);

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@serviceia.fr" },
    update: {},
    create: {
      email: "admin@serviceia.fr",
      name: "Admin ServiceIA",
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`Super Admin created: ${adminUser.email}`);

  // Create firm admin user
  const firmAdminHash = await bcrypt.hash("avocat123", 12);
  const firmAdmin = await prisma.user.upsert({
    where: { email: "avocat@cabinet-demo.fr" },
    update: {},
    create: {
      email: "avocat@cabinet-demo.fr",
      name: "Me Jean Dupont",
      passwordHash: firmAdminHash,
      role: "ADMIN",
      tenantId: tenant.id,
      isActive: true,
    },
  });

  console.log(`Firm Admin created: ${firmAdmin.email}`);

  // Create practice areas
  const practiceAreas = [
    {
      code: "PI",
      name: "Prejudice Corporel",
      color: "#ef4444",
      sortOrder: 1,
    },
    {
      code: "FAMILY",
      name: "Droit de la Famille",
      color: "#f97316",
      sortOrder: 2,
    },
    {
      code: "IMMIGRATION",
      name: "Droit de l'Immigration",
      color: "#3b82f6",
      sortOrder: 3,
    },
    {
      code: "CRIMINAL",
      name: "Droit Penal",
      color: "#8b5cf6",
      sortOrder: 4,
    },
    {
      code: "BUSINESS",
      name: "Droit des Affaires",
      color: "#10b981",
      sortOrder: 5,
    },
    {
      code: "REAL_ESTATE",
      name: "Droit Immobilier",
      color: "#f59e0b",
      sortOrder: 6,
    },
    {
      code: "LABOR",
      name: "Droit du Travail",
      color: "#06b6d4",
      sortOrder: 7,
    },
    {
      code: "OTHER",
      name: "Autre",
      color: "#6b7280",
      sortOrder: 99,
    },
  ];

  for (const area of practiceAreas) {
    await prisma.tenantPracticeArea.upsert({
      where: {
        tenantId_code: { tenantId: tenant.id, code: area.code },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...area,
      },
    });
  }

  console.log(`${practiceAreas.length} practice areas created`);

  // Create agent config
  await prisma.agentConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      agentName: "Sophie",
      greetingMessage:
        "Bonjour, vous etes bien au Cabinet Demo et Associes. Je suis Sophie, l'assistante virtuelle du cabinet. Je suis une intelligence artificielle et je suis la pour vous aider. Cet appel sera enregistre pour ameliorer nos services. Confirmez-vous votre accord pour l'enregistrement de cet appel ?",
      personality:
        "Professionnelle, empathique et bienveillante. Parle un francais soutenu mais accessible.",
      voiceProvider: "elevenlabs",
      llmProvider: "anthropic",
      llmModel: "claude-sonnet-4-20250514",
      temperature: 0.3,
      maxTokens: 1000,
      primaryLanguage: "fr",
      supportedLanguages: ["fr", "en", "ar", "es"],
      maxCallDuration: 600,
      silenceTimeout: 30,
      enableRecording: true,
      requireConsent: true,
      enableEmergencyDetection: true,
      neverGiveLegalAdvice: true,
      alwaysIdentifyAsAI: true,
    },
  });

  console.log("Agent config created");

  // Create default intake script
  await prisma.intakeScript.upsert({
    where: { id: "default-script" },
    update: {},
    create: {
      id: "default-script",
      tenantId: tenant.id,
      name: "Script d'accueil general",
      description:
        "Script par defaut pour la qualification des nouveaux prospects",
      isDefault: true,
      isActive: true,
      language: "fr",
      steps: [
        {
          order: 1,
          question:
            "Pourriez-vous me donner votre nom et prenom s'il vous plait ?",
          type: "open",
          required: true,
          fieldMapping: "fullName",
        },
        {
          order: 2,
          question:
            "Quel est le meilleur numero pour vous joindre ?",
          type: "open",
          required: true,
          fieldMapping: "phone",
        },
        {
          order: 3,
          question:
            "Avez-vous une adresse email pour que nous puissions vous envoyer des informations ?",
          type: "open",
          required: false,
          fieldMapping: "email",
        },
        {
          order: 4,
          question:
            "Pourriez-vous me decrire brievement votre situation juridique ?",
          type: "open",
          required: true,
          fieldMapping: "caseDescription",
        },
        {
          order: 5,
          question: "Y a-t-il une urgence ou un delai particulier a respecter ?",
          type: "choice",
          options: ["Oui, c'est urgent", "Non, pas d'urgence particuliere"],
          required: true,
          fieldMapping: "urgency",
        },
        {
          order: 6,
          question:
            "Souhaitez-vous prendre rendez-vous avec un avocat du cabinet ?",
          type: "choice",
          options: [
            "Oui, je souhaite prendre RDV",
            "Non, je voulais juste des informations",
          ],
          required: true,
          fieldMapping: "wantsAppointment",
        },
      ],
    },
  });

  console.log("Default intake script created");

  // Create availability slots (Monday to Friday, 9h-12h and 14h-18h)
  const days = [0, 1, 2, 3, 4]; // Monday to Friday
  for (const day of days) {
    await prisma.availabilitySlot.create({
      data: {
        tenantId: tenant.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "12:00",
        slotDuration: 30,
        bufferTime: 15,
        maxBookings: 1,
        isActive: true,
      },
    });
    await prisma.availabilitySlot.create({
      data: {
        tenantId: tenant.id,
        dayOfWeek: day,
        startTime: "14:00",
        endTime: "18:00",
        slotDuration: 30,
        bufferTime: 15,
        maxBookings: 1,
        isActive: true,
      },
    });
  }

  console.log("Availability slots created (Mon-Fri, 9h-12h & 14h-18h)");

  // Create default automation rules
  await prisma.automationRule.create({
    data: {
      tenantId: tenant.id,
      name: "Relance J+1",
      description:
        "Email de suivi automatique 24h apres le premier contact",
      type: "FOLLOW_UP",
      triggerConfig: {
        event: "prospect_created",
        conditions: { stage: "PROSPECT" },
        delay: { days: 1 },
      },
      actionType: "SEND_EMAIL",
      actionConfig: {
        subject: "Suite a votre appel - Cabinet Demo & Associes",
        template: "follow_up_j1",
      },
      isActive: true,
    },
  });

  await prisma.automationRule.create({
    data: {
      tenantId: tenant.id,
      name: "Rappel RDV J-1",
      description: "SMS de rappel la veille du rendez-vous",
      type: "REMINDER",
      triggerConfig: {
        event: "appointment_scheduled",
        delay: { hours: -24 },
      },
      actionType: "SEND_SMS",
      actionConfig: {
        template: "reminder_j1",
      },
      isActive: true,
    },
  });

  await prisma.automationRule.create({
    data: {
      tenantId: tenant.id,
      name: "Rappel RDV H-2",
      description: "SMS de rappel 2h avant le rendez-vous",
      type: "REMINDER",
      triggerConfig: {
        event: "appointment_scheduled",
        delay: { hours: -2 },
      },
      actionType: "SEND_SMS",
      actionConfig: {
        template: "reminder_h2",
      },
      isActive: true,
    },
  });

  console.log("Default automation rules created");

  console.log("\n--- Seed completed ---");
  console.log("Comptes de test:");
  console.log("  Super Admin: admin@serviceia.fr / admin123");
  console.log("  Avocat:      avocat@cabinet-demo.fr / avocat123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
