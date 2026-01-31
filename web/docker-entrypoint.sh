#!/bin/sh
set -e

# ══════════════════════════════════════════════════════════════════════════════
# ServiceIA - Docker Entrypoint
# ══════════════════════════════════════════════════════════════════════════════
# Handles database migrations and initial setup before starting the application
# ══════════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║               ServiceIA - Demarrage                               ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"

# ──────────────────────────────────────────────────────────────────────────────
# Wait for database
# ──────────────────────────────────────────────────────────────────────────────

wait_for_db() {
    echo "▶ Attente de la base de donnees..."

    # Extract host and port from DATABASE_URL
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    DB_HOST=${DB_HOST:-db}
    DB_PORT=${DB_PORT:-5432}

    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "✓ Base de donnees disponible"
            return 0
        fi
        attempt=$((attempt + 1))
        echo "  Tentative $attempt/$max_attempts..."
        sleep 2
    done

    echo "✗ Base de donnees non disponible apres $max_attempts tentatives"
    exit 1
}

# ──────────────────────────────────────────────────────────────────────────────
# Run migrations
# ──────────────────────────────────────────────────────────────────────────────

run_migrations() {
    echo "▶ Application des migrations..."

    # Try migrate deploy first (for production migrations)
    if npx prisma migrate deploy 2>/dev/null; then
        echo "✓ Migrations appliquees"
        return 0
    fi

    # Fallback to db push for initial setup
    echo "  Migration echouee, tentative avec db push..."
    if npx prisma db push --accept-data-loss 2>/dev/null; then
        echo "✓ Schema synchronise"
        return 0
    fi

    echo "⚠ Erreur lors des migrations (l'application peut continuer)"
    return 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Initial setup
# ──────────────────────────────────────────────────────────────────────────────

run_initial_setup() {
    # Only run if SETUP_ADMIN_EMAIL is set (first deployment)
    if [ -z "$SETUP_ADMIN_EMAIL" ]; then
        return 0
    fi

    echo "▶ Configuration initiale..."

    # Run setup script
    node /app/scripts/setup-tenant.js 2>/dev/null || {
        echo "⚠ Setup deja effectue ou erreur (l'application peut continuer)"
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

# Only run setup if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    wait_for_db
    run_migrations
    run_initial_setup
fi

echo ""
echo "▶ Demarrage de l'application..."
echo ""

# Execute the main command
exec "$@"
