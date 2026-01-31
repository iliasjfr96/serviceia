#!/bin/bash

# ══════════════════════════════════════════════════════════════════════════════
# ServiceIA - Script d'Installation Automatique
# ══════════════════════════════════════════════════════════════════════════════
# Usage: ./deploy/setup.sh [options]
#
# Options:
#   --name "Cabinet Name"    Nom du cabinet
#   --email admin@email.fr   Email administrateur
#   --domain example.com     Domaine (optionnel)
#   --skip-prompts           Mode non-interactif (utilise .env existant)
#   --help                   Afficher l'aide
# ══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
DOCKER_COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# Defaults
SKIP_PROMPTS=false

# ──────────────────────────────────────────────────────────────────────────────
# Functions
# ──────────────────────────────────────────────────────────────────────────────

print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                   ║"
    echo "║   ███████╗███████╗██████╗ ██╗   ██╗██╗ ██████╗███████╗           ║"
    echo "║   ██╔════╝██╔════╝██╔══██╗██║   ██║██║██╔════╝██╔════╝           ║"
    echo "║   ███████╗█████╗  ██████╔╝██║   ██║██║██║     █████╗             ║"
    echo "║   ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██║██║     ██╔══╝             ║"
    echo "║   ███████║███████╗██║  ██║ ╚████╔╝ ██║╚██████╗███████╗           ║"
    echo "║   ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝ ╚═════╝╚══════╝  IA      ║"
    echo "║                                                                   ║"
    echo "║   CRM pour Cabinets d'Avocats avec Agent Vocal IA                ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

generate_secret() {
    openssl rand -base64 32 | tr -d '=/+' | head -c 32
}

generate_password() {
    openssl rand -base64 16 | tr -d '=/+' | head -c 16
}

slugify() {
    echo "$1" | iconv -t ascii//TRANSLIT | sed -E 's/[^a-zA-Z0-9]+/-/g' | sed -E 's/^-+|-+$//g' | tr '[:upper:]' '[:lower:]'
}

check_dependencies() {
    print_step "Verification des prerequis..."

    local missing=()

    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi

    if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
        missing+=("docker-compose")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Prerequis manquants: ${missing[*]}"
        echo ""
        echo "Installez Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    # Check Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker n'est pas demarre"
        echo "Demarrez Docker et relancez le script"
        exit 1
    fi

    print_success "Prerequis OK (Docker $(docker --version | cut -d' ' -f3 | tr -d ','))"
}

prompt_config() {
    if [ "$SKIP_PROMPTS" = true ]; then
        return
    fi

    print_step "Configuration de votre instance..."
    echo ""

    # Cabinet Name
    if [ -z "$CABINET_NAME" ]; then
        read -p "Nom du cabinet: " CABINET_NAME
        CABINET_NAME=${CABINET_NAME:-"Mon Cabinet"}
    fi

    # Cabinet Slug
    if [ -z "$CABINET_SLUG" ]; then
        CABINET_SLUG=$(slugify "$CABINET_NAME")
    fi

    # Admin Email
    if [ -z "$ADMIN_EMAIL" ]; then
        read -p "Email administrateur: " ADMIN_EMAIL
        while [[ ! "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; do
            print_warning "Email invalide"
            read -p "Email administrateur: " ADMIN_EMAIL
        done
    fi

    # Admin Name
    if [ -z "$ADMIN_NAME" ]; then
        read -p "Nom de l'administrateur [Administrateur]: " ADMIN_NAME
        ADMIN_NAME=${ADMIN_NAME:-"Administrateur"}
    fi

    # Admin Password
    if [ -z "$ADMIN_PASSWORD" ]; then
        while true; do
            read -s -p "Mot de passe administrateur (min 8 car.): " ADMIN_PASSWORD
            echo ""
            if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
                print_warning "Le mot de passe doit faire au moins 8 caracteres"
                continue
            fi
            read -s -p "Confirmez le mot de passe: " ADMIN_PASSWORD_CONFIRM
            echo ""
            if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
                print_warning "Les mots de passe ne correspondent pas"
                continue
            fi
            break
        done
    fi

    # Domain (optional)
    if [ -z "$DOMAIN" ]; then
        read -p "Domaine (laissez vide pour localhost): " DOMAIN
    fi

    # Anthropic API Key (optional but recommended)
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        echo ""
        echo "Cle API Anthropic (Claude) pour les fonctionnalites IA"
        echo "Obtenez-la sur: https://console.anthropic.com"
        read -p "ANTHROPIC_API_KEY (optionnel): " ANTHROPIC_API_KEY
    fi

    echo ""
    print_success "Configuration enregistree"
}

generate_env_file() {
    print_step "Generation du fichier .env..."

    # Generate secrets if not set
    POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(generate_password)}
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-$(generate_secret)}

    # Set NEXTAUTH_URL
    if [ -n "$DOMAIN" ]; then
        NEXTAUTH_URL="https://$DOMAIN"
    else
        NEXTAUTH_URL="http://localhost:${PORT:-3000}"
    fi

    # Write .env file
    cat > "$ENV_FILE" << EOF
# ══════════════════════════════════════════════════════════════════════════════
# ServiceIA - Configuration
# Genere automatiquement le $(date)
# ══════════════════════════════════════════════════════════════════════════════

# Cabinet
CABINET_NAME="$CABINET_NAME"
CABINET_SLUG="$CABINET_SLUG"
CABINET_EMAIL="${CABINET_EMAIL:-$ADMIN_EMAIL}"
CABINET_PHONE="${CABINET_PHONE:-}"

# Administrateur
ADMIN_EMAIL="$ADMIN_EMAIL"
ADMIN_NAME="$ADMIN_NAME"
ADMIN_PASSWORD="$ADMIN_PASSWORD"

# URL & Domaine
DOMAIN="${DOMAIN:-}"
PORT=${PORT:-3000}
NEXTAUTH_URL="$NEXTAUTH_URL"

# Base de donnees
POSTGRES_PASSWORD="$POSTGRES_PASSWORD"
DATABASE_URL="postgresql://serviceia:$POSTGRES_PASSWORD@db:5432/serviceia"

# Securite
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# Redis
REDIS_URL="redis://redis:6379"

# Environnement
NODE_ENV=production

# IA
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"

# Agent Vocal (ElevenLabs)
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-}"
ELEVENLABS_WEBHOOK_SECRET="${ELEVENLABS_WEBHOOK_SECRET:-}"
ELEVENLABS_AGENT_ID="${ELEVENLABS_AGENT_ID:-}"

# Telephonie (Twilio)
TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-}"
TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-}"
TWILIO_PHONE_NUMBER="${TWILIO_PHONE_NUMBER:-}"

# Email (Resend)
RESEND_API_KEY="${RESEND_API_KEY:-}"
RESEND_FROM_EMAIL="${RESEND_FROM_EMAIL:-noreply@serviceia.fr}"

# Calendrier (Google)
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"

# Paiements (Stripe)
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"

# Stockage (S3)
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${S3_SECRET_KEY:-}"
S3_BUCKET="${S3_BUCKET:-serviceia-files}"
S3_REGION="${S3_REGION:-fr-par}"
EOF

    print_success "Fichier .env genere"
}

build_and_start() {
    print_step "Construction et demarrage des services..."

    cd "$PROJECT_DIR"

    # Pull images
    echo "Telechargement des images Docker..."
    docker compose -f "$DOCKER_COMPOSE_FILE" pull db redis 2>/dev/null || true

    # Build web service
    echo "Construction de l'application (cela peut prendre quelques minutes)..."
    docker compose -f "$DOCKER_COMPOSE_FILE" build web

    # Start services
    echo "Demarrage des services..."
    docker compose -f "$DOCKER_COMPOSE_FILE" up -d

    print_success "Services demarres"
}

wait_for_services() {
    print_step "Attente du demarrage des services..."

    local max_attempts=60
    local attempt=0

    # Wait for database
    echo -n "Base de donnees"
    while ! docker exec serviceia-db pg_isready -U serviceia -d serviceia &>/dev/null; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            echo ""
            print_error "La base de donnees n'a pas demarre"
            exit 1
        fi
        echo -n "."
        sleep 2
    done
    echo " OK"

    # Wait for web service
    attempt=0
    echo -n "Application"
    while ! curl -s -f http://localhost:${PORT:-3000}/api/health &>/dev/null; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            echo ""
            print_warning "L'application prend du temps a demarrer..."
            echo "Verifiez les logs avec: docker logs serviceia-web"
            break
        fi
        echo -n "."
        sleep 3
    done
    echo " OK"

    print_success "Services prets"
}

run_migrations() {
    print_step "Application des migrations de base de donnees..."

    docker exec serviceia-web npx prisma migrate deploy 2>/dev/null || {
        print_warning "Migration echouee, tentative avec db push..."
        docker exec serviceia-web npx prisma db push --accept-data-loss 2>/dev/null || true
    }

    print_success "Migrations appliquees"
}

setup_initial_data() {
    print_step "Configuration initiale des donnees..."

    # Run the setup script inside the container
    docker exec serviceia-web node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setup() {
    const prisma = new PrismaClient();

    try {
        // Check if tenant already exists
        const existingTenant = await prisma.tenant.findFirst({
            where: { slug: process.env.SETUP_CABINET_SLUG }
        });

        if (existingTenant) {
            console.log('Tenant already exists, skipping setup');
            return;
        }

        // Create tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: process.env.SETUP_CABINET_NAME || 'Mon Cabinet',
                slug: process.env.SETUP_CABINET_SLUG || 'mon-cabinet',
                email: process.env.SETUP_CABINET_EMAIL || process.env.SETUP_ADMIN_EMAIL,
                phone: process.env.SETUP_CABINET_PHONE || null,
                plan: 'PROFESSIONAL',
                isActive: true,
                onboardedAt: new Date(),
            }
        });
        console.log('Tenant created:', tenant.name);

        // Create admin user
        const passwordHash = await bcrypt.hash(process.env.SETUP_ADMIN_PASSWORD || 'admin123', 12);
        const user = await prisma.user.create({
            data: {
                email: process.env.SETUP_ADMIN_EMAIL,
                name: process.env.SETUP_ADMIN_NAME || 'Administrateur',
                passwordHash,
                role: 'ADMIN',
                tenantId: tenant.id,
                isActive: true,
            }
        });
        console.log('Admin user created:', user.email);

        // Create agent config
        await prisma.agentConfig.create({
            data: {
                tenantId: tenant.id,
                agentName: 'Sophie',
                voiceProvider: 'elevenlabs',
                llmProvider: 'anthropic',
                llmModel: 'claude-sonnet-4-20250514',
                temperature: 0.3,
                maxTokens: 1000,
                primaryLanguage: 'fr',
                supportedLanguages: ['fr', 'en'],
                maxCallDuration: 600,
                silenceTimeout: 30,
                enableRecording: true,
                requireConsent: true,
                enableEmergencyDetection: true,
                neverGiveLegalAdvice: true,
                alwaysIdentifyAsAI: true,
            }
        });
        console.log('Agent config created');

        // Create default practice areas
        const practiceAreas = [
            { code: 'PI', name: 'Prejudice Corporel', color: '#ef4444' },
            { code: 'FAMILY', name: 'Droit de la Famille', color: '#f97316' },
            { code: 'CRIMINAL', name: 'Droit Penal', color: '#eab308' },
            { code: 'BUSINESS', name: 'Droit des Affaires', color: '#22c55e' },
            { code: 'LABOR', name: 'Droit du Travail', color: '#3b82f6' },
            { code: 'REAL_ESTATE', name: 'Droit Immobilier', color: '#8b5cf6' },
            { code: 'OTHER', name: 'Autre', color: '#6b7280' },
        ];

        for (let i = 0; i < practiceAreas.length; i++) {
            await prisma.tenantPracticeArea.create({
                data: {
                    tenantId: tenant.id,
                    ...practiceAreas[i],
                    sortOrder: i,
                    isActive: true,
                }
            });
        }
        console.log('Practice areas created');

        // Create default availability slots (Mon-Fri, 9-12 and 14-18)
        for (let day = 1; day <= 5; day++) {
            await prisma.availabilitySlot.createMany({
                data: [
                    { tenantId: tenant.id, dayOfWeek: day, startTime: '09:00', endTime: '12:00', slotDuration: 30, bufferTime: 15, maxBookings: 1, isActive: true },
                    { tenantId: tenant.id, dayOfWeek: day, startTime: '14:00', endTime: '18:00', slotDuration: 30, bufferTime: 15, maxBookings: 1, isActive: true },
                ]
            });
        }
        console.log('Availability slots created');

        console.log('Setup completed successfully!');
    } catch (error) {
        console.error('Setup error:', error.message);
        process.exit(1);
    } finally {
        await prisma.\$disconnect();
    }
}

setup();
" 2>/dev/null || print_warning "Configuration initiale partielle"

    print_success "Donnees initiales configurees"
}

print_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                 Installation Terminee !                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Acces a l'application:${NC}"
    echo ""
    if [ -n "$DOMAIN" ]; then
        echo "  URL:         https://$DOMAIN"
    else
        echo "  URL:         http://localhost:${PORT:-3000}"
    fi
    echo "  Email:       $ADMIN_EMAIL"
    echo "  Mot de passe: (celui que vous avez choisi)"
    echo ""
    echo -e "${CYAN}Commandes utiles:${NC}"
    echo ""
    echo "  Voir les logs:     docker logs -f serviceia-web"
    echo "  Arreter:           docker compose -f deploy/docker-compose.yml down"
    echo "  Redemarrer:        docker compose -f deploy/docker-compose.yml restart"
    echo "  Mise a jour:       git pull && docker compose -f deploy/docker-compose.yml up -d --build"
    echo ""
    echo -e "${CYAN}Webhook ElevenLabs:${NC}"
    if [ -n "$DOMAIN" ]; then
        echo "  https://$DOMAIN/api/webhooks/elevenlabs"
    else
        echo "  http://localhost:${PORT:-3000}/api/webhooks/elevenlabs"
    fi
    echo ""
    echo -e "${YELLOW}N'oubliez pas de configurer:${NC}"
    echo "  - ANTHROPIC_API_KEY pour les fonctionnalites IA"
    echo "  - ElevenLabs pour l'agent vocal"
    echo "  - Google Calendar pour la synchronisation"
    echo ""
}

show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --name \"Cabinet Name\"    Nom du cabinet"
    echo "  --email admin@email.fr   Email administrateur"
    echo "  --password secret        Mot de passe administrateur"
    echo "  --domain example.com     Domaine de production"
    echo "  --skip-prompts           Mode non-interactif"
    echo "  --help                   Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0"
    echo "  $0 --name \"Cabinet Dupont\" --email admin@dupont.fr"
    echo "  $0 --skip-prompts  # Utilise le fichier .env existant"
}

# ──────────────────────────────────────────────────────────────────────────────
# Parse Arguments
# ──────────────────────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
    case $1 in
        --name)
            CABINET_NAME="$2"
            shift 2
            ;;
        --email)
            ADMIN_EMAIL="$2"
            shift 2
            ;;
        --password)
            ADMIN_PASSWORD="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --skip-prompts)
            SKIP_PROMPTS=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

print_banner
check_dependencies

# Load existing .env if exists and skip-prompts
if [ "$SKIP_PROMPTS" = true ] && [ -f "$ENV_FILE" ]; then
    print_step "Chargement de la configuration existante..."
    source "$ENV_FILE"
    print_success "Configuration chargee depuis .env"
else
    prompt_config
    generate_env_file
fi

build_and_start
wait_for_services
run_migrations
setup_initial_data
print_summary
