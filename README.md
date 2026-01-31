# ServiceIA - CRM pour Cabinets d'Avocats avec IA Vocale

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.5-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Prisma](https://img.shields.io/badge/Prisma-7.3-2D3748)
![License](https://img.shields.io/badge/license-Proprietary-red)

**CRM multi-tenant pour cabinets d'avocats avec agent vocal IA integre**

[Fonctionnalites](#-fonctionnalites) • [Installation](#-installation) • [Configuration](#%EF%B8%8F-configuration) • [Utilisation](#-utilisation) • [API](#-api) • [Securite](#-securite)

</div>

---

## Vue d'ensemble

**ServiceIA** est une solution CRM complete et moderne concue specifiquement pour les cabinets d'avocats. Elle integre un agent vocal IA capable de gerer automatiquement les appels entrants, qualifier les prospects et planifier des rendez-vous, tout en respectant la reglementation RGPD.

### Pourquoi ServiceIA ?

- **Automatisation des appels** : Agent vocal IA disponible 24/7 pour la prise d'appels
- **Gestion des prospects** : Pipeline commercial avec vue Kanban et tableau
- **Planification intelligente** : Synchronisation calendrier Google/Outlook
- **Conformite RGPD** : Gestion des consentements et retention des donnees
- **Multi-tenant** : Architecture isolee pour chaque cabinet

---

## Fonctionnalites

### Agent Vocal IA
- Prise d'appels automatique avec transcription en temps reel
- Detection d'urgence (violence, garde a vue, etc.)
- Extraction automatique des informations client
- Resume IA des conversations
- Support multilingue (FR, EN, AR, ES)
- Configuration personnalisable (voix, personnalite, scripts)

### Gestion des Prospects
- Vue tableau avec filtres avances et pagination
- Vue Kanban avec drag & drop entre les etapes
- Listes personnalisees de prospects
- Export CSV
- Notes manuelles et automatiques
- Timeline d'activite complete
- Scoring automatique des leads

### Calendrier & Rendez-vous
- Gestion des creneaux de disponibilite
- Synchronisation Google Calendar et Outlook
- Rappels automatiques par email/SMS
- Suivi des acomptes et no-shows
- Statuts multiples (confirme, annule, reporte, etc.)

### Campagnes Marketing
- Campagnes email et SMS
- Templates personnalisables avec editeur riche
- Ciblage par listes de prospects
- Metriques de performance (envois, ouvertures, reponses)
- Planification differee

### Automatisations
- Regles de relance automatique
- Rappels de rendez-vous
- Actions sur changement de statut
- Reactivation des prospects inactifs
- Historique d'execution

### Dashboard & Analytics
- KPIs en temps reel (appels, prospects, RDV, conversion)
- Graphiques d'activite sur 7 jours
- Pipeline commercial visuel
- Alertes d'urgence
- Activite recente

### Administration
- Gestion multi-tenant
- Roles et permissions (Super Admin, Admin, Membre)
- Logs d'audit complets
- Base de connaissances pour le RAG
- Configuration RGPD

---

## Stack Technique

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16.1.5 | Framework React avec App Router |
| React | 19.2.3 | Bibliotheque UI |
| TypeScript | 5 | Typage statique |
| Tailwind CSS | 4 | Styling |
| Radix UI | - | Composants accessibles |
| TanStack Query | 5.90 | Gestion d'etat serveur |
| TipTap | 3.18 | Editeur de texte riche |
| Recharts | 3.7 | Graphiques |
| dnd-kit | 6.3 | Drag & Drop |
| Zod | 4.3 | Validation |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Node.js | 20+ | Runtime |
| NextAuth | 5.0-beta | Authentification |
| Prisma | 7.3 | ORM |
| PostgreSQL | 16 | Base de donnees |
| Redis | 7 | Cache & Rate limiting |
| BullMQ | 5.67 | Queue de jobs |

### Service IA (Python)
| Technologie | Version | Usage |
|-------------|---------|-------|
| FastAPI | 0.115 | Framework API |
| Anthropic SDK | 0.43 | Claude API |
| SQLAlchemy | 2.0 | ORM |
| pgvector | 0.3 | Recherche vectorielle |
| Uvicorn | 0.34 | Serveur ASGI |

### Integrations Externes
- **Vapi.AI** - Plateforme d'appels vocaux
- **ElevenLabs** - Synthese vocale
- **Anthropic Claude** - LLM
- **Twilio** - SMS & Telephonie
- **Resend** - Envoi d'emails
- **Stripe** - Paiements
- **Google/Microsoft** - Calendriers

---

## Installation

### Prerequis

- Docker 24+ et Docker Compose 2.20+
- 4 GB RAM minimum
- 20 GB espace disque

### Installation Rapide (One-Click)

```bash
# Cloner le repository
git clone https://github.com/votre-org/serviceia.git
cd serviceia

# Lancer l'installation guidee
./deploy/setup.sh
```

Le script vous guidera pour configurer :
- Nom du cabinet
- Email et mot de passe administrateur
- Domaine (optionnel)
- Cle API Anthropic (optionnel)

**Windows PowerShell:**
```powershell
.\deploy\setup.ps1
```

### Installation en Ligne de Commande

```bash
./deploy/setup.sh \
  --name "Cabinet Dupont & Associes" \
  --email "admin@cabinet-dupont.fr" \
  --domain "crm.cabinet-dupont.fr"
```

### Installation Manuelle

```bash
# 1. Copier et configurer l'environnement
cp deploy/.env.template .env
# Editez .env avec vos valeurs

# 2. Demarrer les services
docker compose -f deploy/docker-compose.yml up -d

# 3. Verifier l'installation
curl http://localhost:3000/api/health
```

### Installation Developpement

Pour le developpement local sans Docker :

```bash
# Base de donnees PostgreSQL
createdb serviceia
psql serviceia -c "CREATE EXTENSION IF NOT EXISTS pgvector;"

# Demarrer Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Application web
cd web
npm install
cp .env.example .env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

---

## Configuration

### Variables d'Environnement

Creez un fichier `.env` a la racine du dossier `web/` :

```env
# ══════════════════════════════════════════════════════════════
# BASE DE DONNEES
# ══════════════════════════════════════════════════════════════
DATABASE_URL="postgresql://serviceia:password@localhost:5432/serviceia"
POSTGRES_PASSWORD="serviceia_dev_2025"

# ══════════════════════════════════════════════════════════════
# REDIS
# ══════════════════════════════════════════════════════════════
REDIS_URL="redis://localhost:6379"

# ══════════════════════════════════════════════════════════════
# AUTHENTIFICATION
# ══════════════════════════════════════════════════════════════
NEXTAUTH_SECRET="votre-secret-aleatoire-32-caracteres-minimum"
NEXTAUTH_URL="http://localhost:3000"

# ══════════════════════════════════════════════════════════════
# AGENT VOCAL (Vapi.AI)
# ══════════════════════════════════════════════════════════════
VAPI_API_KEY=""
VAPI_WEBHOOK_SECRET=""

# ══════════════════════════════════════════════════════════════
# AGENT VOCAL (ElevenLabs)
# ══════════════════════════════════════════════════════════════
ELEVENLABS_API_KEY=""
ELEVENLABS_WEBHOOK_SECRET=""

# ══════════════════════════════════════════════════════════════
# LLM (Anthropic Claude)
# ══════════════════════════════════════════════════════════════
ANTHROPIC_API_KEY=""

# ══════════════════════════════════════════════════════════════
# COMMUNICATIONS (Twilio)
# ══════════════════════════════════════════════════════════════
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER="+33xxxxxxxxx"

# ══════════════════════════════════════════════════════════════
# EMAIL (Resend)
# ══════════════════════════════════════════════════════════════
RESEND_API_KEY=""
RESEND_FROM_EMAIL="noreply@serviceia.fr"

# ══════════════════════════════════════════════════════════════
# PAIEMENTS (Stripe)
# ══════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# ══════════════════════════════════════════════════════════════
# CALENDRIERS
# ══════════════════════════════════════════════════════════════
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

AZURE_CLIENT_ID=""
AZURE_CLIENT_SECRET=""
AZURE_TENANT_ID=""

# ══════════════════════════════════════════════════════════════
# STOCKAGE FICHIERS (S3-compatible)
# ══════════════════════════════════════════════════════════════
S3_ENDPOINT="https://s3.fr-par.scw.cloud"
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET="serviceia-files"
S3_REGION="fr-par"
```

---

## Scripts NPM

```bash
# Developpement
npm run dev              # Serveur dev sur http://localhost:3000

# Build & Production
npm run build            # Build de production
npm run start            # Demarrer en production
npm run lint             # Linter ESLint

# Base de donnees
npm run db:generate      # Generer le client Prisma
npm run db:migrate       # Appliquer les migrations
npm run db:push          # Push schema sans migration
npm run db:seed          # Donnees de test
npm run db:studio        # Interface Prisma Studio
npm run db:reset         # Reinitialiser la base
```

---

## Structure du Projet

```
serviceia/
├── web/                              # Application Next.js
│   ├── src/
│   │   ├── app/                     # Routes App Router
│   │   │   ├── (auth)/              # Pages d'authentification
│   │   │   ├── (dashboard)/         # Pages protegees
│   │   │   │   ├── admin/           # Administration
│   │   │   │   ├── agenda/          # Calendrier
│   │   │   │   ├── calls/           # Historique appels
│   │   │   │   ├── dashboard/       # Tableau de bord
│   │   │   │   ├── prospects/       # Gestion prospects
│   │   │   │   ├── relances/        # Campagnes
│   │   │   │   └── parametres/      # Parametres
│   │   │   └── api/v1/              # Routes API REST
│   │   ├── components/              # Composants React
│   │   │   ├── ui/                  # Composants de base
│   │   │   ├── layout/              # Layout (sidebar, header)
│   │   │   ├── prospects/           # Composants prospects
│   │   │   ├── dashboard/           # Composants dashboard
│   │   │   └── shared/              # Composants partages
│   │   ├── hooks/                   # Hooks React personnalises
│   │   ├── lib/                     # Utilitaires
│   │   │   ├── dal/                 # Data Access Layer
│   │   │   ├── validations/         # Schemas Zod
│   │   │   ├── auth.ts              # Configuration auth
│   │   │   ├── prisma.ts            # Client Prisma
│   │   │   ├── redis.ts             # Client Redis
│   │   │   ├── rate-limit.ts        # Rate limiting
│   │   │   └── encryption.ts        # Chiffrement
│   │   └── types/                   # Types TypeScript
│   ├── prisma/
│   │   └── schema.prisma            # Schema base de donnees
│   └── public/                      # Assets statiques
│
├── ai-service/                      # Service Python FastAPI
│   ├── app/
│   │   ├── api/v1/endpoints/        # Endpoints API
│   │   ├── services/                # Services metier
│   │   └── prompts/                 # Prompts systeme
│   └── requirements.txt
│
├── docker-compose.yml               # Config Docker dev
├── docker-compose.prod.yml          # Config Docker prod
└── docs/                            # Documentation
```

---

## API

### Authentification

Toutes les routes API (sauf webhooks) necessitent une session NextAuth valide.

### Endpoints Principaux

#### Prospects
```
GET    /api/v1/prospects              # Liste avec filtres
POST   /api/v1/prospects              # Creer un prospect
GET    /api/v1/prospects/:id          # Details d'un prospect
PATCH  /api/v1/prospects/:id          # Modifier un prospect
DELETE /api/v1/prospects/:id          # Supprimer un prospect
GET    /api/v1/prospects/export       # Export CSV
POST   /api/v1/prospects/bulk         # Actions en masse
```

#### Appels
```
GET    /api/v1/calls                  # Liste des appels
GET    /api/v1/calls?stats=true       # Statistiques appels
GET    /api/v1/calls/:id              # Details d'un appel
GET    /api/v1/calls/stream           # Stream SSE temps reel
```

#### Rendez-vous
```
GET    /api/v1/appointments           # Liste des RDV
POST   /api/v1/appointments           # Creer un RDV
PATCH  /api/v1/appointments/:id       # Modifier un RDV
PATCH  /api/v1/appointments/:id/status # Changer le statut
```

#### Configuration Agent
```
GET    /api/v1/agent-config           # Configuration agent IA
PATCH  /api/v1/agent-config           # Modifier configuration
```

#### Campagnes
```
GET    /api/v1/campaigns              # Liste campagnes
POST   /api/v1/campaigns              # Creer une campagne
PATCH  /api/v1/campaigns/:id          # Modifier une campagne
```

#### Dashboard
```
GET    /api/v1/dashboard              # Donnees du dashboard
```

#### Webhooks
```
POST   /api/webhooks/elevenlabs       # Webhook ElevenLabs
```

### Parametres de Filtrage

```typescript
// Exemple: GET /api/v1/prospects?stage=QUALIFIED&urgencyLevel=HIGH&page=1&limit=25

interface ProspectFilters {
  search?: string;           // Recherche texte
  stage?: string;            // Etape du pipeline
  urgencyLevel?: string;     // LOW | MEDIUM | HIGH | CRITICAL
  source?: string;           // Source d'acquisition
  practiceAreaId?: string;   // Domaine juridique
  hasRecentCalls?: boolean;  // Appels recents (< 24h)
  page?: number;             // Pagination
  limit?: number;            // Limite (max 100)
  sortBy?: string;           // Champ de tri
  sortOrder?: 'asc' | 'desc';
}
```

---

## Securite

### Mesures Implementees

| Mesure | Implementation |
|--------|----------------|
| **Rate Limiting** | Redis avec limites par endpoint (auth: 10/15min, api: 100/min, write: 30/min) |
| **Headers Securite** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| **Chiffrement** | AES-256-GCM pour tokens sensibles |
| **Authentification** | NextAuth v5 avec JWT signes |
| **CSRF** | Protection integree NextAuth + SameSite cookies |
| **Validation** | Schemas Zod sur toutes les entrees |
| **Audit** | Logs complets de toutes les actions |
| **Multi-tenancy** | Isolation stricte des donnees par tenant |
| **Webhooks** | Verification signature HMAC-SHA256 |

### Configuration CSP

```javascript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://accounts.google.com https://*.googleapis.com wss:;
  frame-ancestors 'none';
```

---

## RGPD

### Fonctionnalites de Conformite

- **Consentements** : Enregistrement avec horodatage et methode
- **Retention** : Politique configurable (defaut: 730 jours)
- **Droit a l'oubli** : Suppression complete des donnees prospect
- **Audit** : Tracabilite de toutes les operations
- **DPO** : Configuration des contacts RGPD
- **Appels** : Consentement enregistrement obligatoire

---

## Deploiement Production

### Docker Compose

```bash
# Build et demarrage
docker-compose -f docker-compose.prod.yml up -d --build

# Logs
docker-compose -f docker-compose.prod.yml logs -f web

# Arret
docker-compose -f docker-compose.prod.yml down
```

### Services Docker

| Service | Port | Description |
|---------|------|-------------|
| `db` | 5432 | PostgreSQL avec pgvector |
| `redis` | 6379 | Redis pour cache/rate limiting |
| `web` | 3000 | Application Next.js |
| `ai-service` | 8000 | Service FastAPI (optionnel) |

### Health Checks

```bash
# Application web
curl http://localhost:3000/api/health

# Service IA
curl http://localhost:8000/api/v1/health
```

---

## Developpement

### Conventions de Code

- **TypeScript strict** : Typage obligatoire
- **ESLint** : Configuration stricte
- **Prisma** : Migrations versionnes
- **API** : Validation Zod sur toutes les entrees
- **Composants** : Architecture atomique (ui > shared > features)

### Ajouter une Nouvelle Fonctionnalite

1. **Schema Prisma** : Ajouter les modeles dans `prisma/schema.prisma`
2. **Migration** : `npm run db:migrate`
3. **DAL** : Creer les fonctions dans `src/lib/dal/`
4. **Validation** : Ajouter les schemas Zod dans `src/lib/validations/`
5. **API Route** : Creer la route dans `src/app/api/v1/`
6. **Hook** : Creer le hook React Query dans `src/hooks/`
7. **Composants** : Creer les composants UI
8. **Page** : Integrer dans `src/app/(dashboard)/`

### Tests

```bash
# Linting
npm run lint

# Type checking
npm run build
```

---

## Support

### Documentation

- [Configuration Agent Vocal](./docs/exemple-config-agent-vocal.md)
- [Guide API](./docs/api-guide.md)

### Contact

Pour toute question ou support technique, contactez l'equipe de developpement.

---

## Licence

Ce logiciel est proprietaire. Tous droits reserves.

---

<div align="center">

**Developpe avec Next.js, React, Prisma et beaucoup de cafe**

</div>
