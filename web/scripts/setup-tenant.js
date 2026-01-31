#!/usr/bin/env node

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ServiceIA - Script de Configuration Initiale
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Ce script cree le tenant initial et l'utilisateur administrateur
 * lors du premier deploiement.
 *
 * Variables d'environnement requises:
 * - SETUP_ADMIN_EMAIL
 * - SETUP_ADMIN_PASSWORD
 * - SETUP_CABINET_NAME
 *
 * Usage: node scripts/setup-tenant.js
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

// Dynamically import bcryptjs (ESM compatibility)
async function hashPassword(password) {
  const bcrypt = require("bcryptjs");
  return bcrypt.hash(password, 12);
}

// Create Prisma client with pg adapter (Prisma 7 pattern)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Configuration from environment
const config = {
  cabinet: {
    name: process.env.SETUP_CABINET_NAME || "Mon Cabinet",
    slug: process.env.SETUP_CABINET_SLUG || slugify(process.env.SETUP_CABINET_NAME || "mon-cabinet"),
    email: process.env.SETUP_CABINET_EMAIL || process.env.SETUP_ADMIN_EMAIL,
    phone: process.env.SETUP_CABINET_PHONE || null,
  },
  admin: {
    email: process.env.SETUP_ADMIN_EMAIL,
    name: process.env.SETUP_ADMIN_NAME || "Administrateur",
    password: process.env.SETUP_ADMIN_PASSWORD,
  },
};

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║           ServiceIA - Configuration Initiale                      ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝");
  console.log("");

  // Validate required config
  if (!config.admin.email || !config.admin.password) {
    console.log("⚠ Variables SETUP_ADMIN_EMAIL et SETUP_ADMIN_PASSWORD non definies");
    console.log("  Configuration initiale ignoree.");
    return;
  }

  try {
    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: { slug: config.cabinet.slug },
    });

    if (existingTenant) {
      console.log(`✓ Tenant "${config.cabinet.name}" existe deja`);

      // Check if admin user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: config.admin.email },
      });

      if (existingUser) {
        console.log(`✓ Utilisateur "${config.admin.email}" existe deja`);
        console.log("");
        console.log("Configuration initiale deja effectuee.");
        return;
      }
    }

    // Create tenant
    console.log(`▶ Creation du tenant "${config.cabinet.name}"...`);

    const tenant = await prisma.tenant.upsert({
      where: { slug: config.cabinet.slug },
      update: {},
      create: {
        name: config.cabinet.name,
        slug: config.cabinet.slug,
        email: config.cabinet.email,
        phone: config.cabinet.phone,
        plan: "PROFESSIONAL",
        isActive: true,
        onboardedAt: new Date(),
        timezone: "Europe/Paris",
        locale: "fr",
        country: "FR",
      },
    });
    console.log(`✓ Tenant cree: ${tenant.name} (${tenant.id})`);

    // Create admin user
    console.log(`▶ Creation de l'administrateur "${config.admin.email}"...`);

    const passwordHash = await hashPassword(config.admin.password);

    const user = await prisma.user.upsert({
      where: { email: config.admin.email },
      update: {},
      create: {
        email: config.admin.email,
        name: config.admin.name,
        passwordHash,
        role: "ADMIN",
        tenantId: tenant.id,
        isActive: true,
      },
    });
    console.log(`✓ Administrateur cree: ${user.name} (${user.email})`);

    // Create agent config
    console.log("▶ Configuration de l'agent IA...");

    await prisma.agentConfig.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        agentName: "Sophie",
        voiceProvider: "elevenlabs",
        llmProvider: "anthropic",
        llmModel: "claude-sonnet-4-20250514",
        temperature: 0.3,
        maxTokens: 1000,
        primaryLanguage: "fr",
        supportedLanguages: ["fr", "en"],
        maxCallDuration: 600,
        silenceTimeout: 30,
        enableRecording: true,
        requireConsent: true,
        enableEmergencyDetection: true,
        neverGiveLegalAdvice: true,
        alwaysIdentifyAsAI: true,
      },
    });
    console.log("✓ Agent IA configure");

    // Create practice areas
    console.log("▶ Creation des domaines juridiques...");

    const practiceAreas = [
      { code: "PI", name: "Prejudice Corporel", color: "#ef4444", sortOrder: 0 },
      { code: "FAMILY", name: "Droit de la Famille", color: "#f97316", sortOrder: 1 },
      { code: "IMMIGRATION", name: "Droit des Etrangers", color: "#eab308", sortOrder: 2 },
      { code: "CRIMINAL", name: "Droit Penal", color: "#84cc16", sortOrder: 3 },
      { code: "BUSINESS", name: "Droit des Affaires", color: "#22c55e", sortOrder: 4 },
      { code: "REAL_ESTATE", name: "Droit Immobilier", color: "#14b8a6", sortOrder: 5 },
      { code: "LABOR", name: "Droit du Travail", color: "#3b82f6", sortOrder: 6 },
      { code: "OTHER", name: "Autre", color: "#6b7280", sortOrder: 7 },
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
          isActive: true,
        },
      });
    }
    console.log(`✓ ${practiceAreas.length} domaines juridiques crees`);

    // Create availability slots (Mon-Fri, 9-12 and 14-18)
    console.log("▶ Configuration des creneaux de disponibilite...");

    const existingSlots = await prisma.availabilitySlot.count({
      where: { tenantId: tenant.id },
    });

    if (existingSlots === 0) {
      const slots = [];
      for (let day = 1; day <= 5; day++) {
        slots.push(
          {
            tenantId: tenant.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "12:00",
            slotDuration: 30,
            bufferTime: 15,
            maxBookings: 1,
            isActive: true,
          },
          {
            tenantId: tenant.id,
            dayOfWeek: day,
            startTime: "14:00",
            endTime: "18:00",
            slotDuration: 30,
            bufferTime: 15,
            maxBookings: 1,
            isActive: true,
          }
        );
      }
      await prisma.availabilitySlot.createMany({ data: slots });
      console.log("✓ Creneaux de disponibilite configures (Lun-Ven, 9h-12h et 14h-18h)");
    } else {
      console.log("✓ Creneaux de disponibilite existants conserves");
    }

    // Create default automation rules
    console.log("▶ Configuration des automatisations...");

    const existingRules = await prisma.automationRule.count({
      where: { tenantId: tenant.id },
    });

    if (existingRules === 0) {
      await prisma.automationRule.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: "Relance J+1",
            description: "Relance automatique 24h apres premier contact",
            triggerType: "FOLLOW_UP",
            action: "SEND_EMAIL",
            isActive: true,
            config: { delayHours: 24 },
          },
          {
            tenantId: tenant.id,
            name: "Rappel RDV J-1",
            description: "Rappel de rendez-vous 24h avant",
            triggerType: "APPOINTMENT_REMINDER",
            action: "SEND_EMAIL",
            isActive: true,
            config: { beforeHours: 24 },
          },
          {
            tenantId: tenant.id,
            name: "Rappel RDV H-2",
            description: "Rappel de rendez-vous 2h avant",
            triggerType: "APPOINTMENT_REMINDER",
            action: "SEND_SMS",
            isActive: true,
            config: { beforeHours: 2 },
          },
        ],
      });
      console.log("✓ 3 regles d'automatisation creees");
    } else {
      console.log("✓ Regles d'automatisation existantes conservees");
    }

    // Create default intake script
    console.log("▶ Configuration du script d'accueil...");

    const existingScript = await prisma.intakeScript.findFirst({
      where: { tenantId: tenant.id, isDefault: true },
    });

    if (!existingScript) {
      await prisma.intakeScript.create({
        data: {
          tenantId: tenant.id,
          name: "Script d'accueil standard",
          description: "Script de qualification des appels entrants",
          isDefault: true,
          isActive: true,
          language: "fr",
          steps: [
            {
              order: 1,
              type: "greeting",
              content: "Bonjour, vous etes bien chez {cabinet_name}. Je suis Sophie, l'assistante virtuelle. Comment puis-je vous aider ?",
            },
            {
              order: 2,
              type: "collect",
              field: "name",
              question: "Puis-je avoir votre nom complet ?",
            },
            {
              order: 3,
              type: "collect",
              field: "phone",
              question: "A quel numero puis-je vous rappeler si necessaire ?",
            },
            {
              order: 4,
              type: "collect",
              field: "email",
              question: "Avez-vous une adresse email ?",
              optional: true,
            },
            {
              order: 5,
              type: "collect",
              field: "case_description",
              question: "Pouvez-vous me decrire brievement votre situation juridique ?",
            },
            {
              order: 6,
              type: "collect",
              field: "urgency",
              question: "Est-ce que votre situation est urgente ? Y a-t-il des delais particuliers ?",
            },
          ],
        },
      });
      console.log("✓ Script d'accueil cree");
    } else {
      console.log("✓ Script d'accueil existant conserve");
    }

    console.log("");
    console.log("╔═══════════════════════════════════════════════════════════════════╗");
    console.log("║           Configuration Initiale Terminee !                       ║");
    console.log("╚═══════════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`Cabinet:       ${tenant.name}`);
    console.log(`Admin:         ${user.email}`);
    console.log(`Plan:          PROFESSIONAL`);
    console.log("");

  } catch (error) {
    console.error("✗ Erreur lors de la configuration:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
