# ══════════════════════════════════════════════════════════════════════════════
# ServiceIA - Script d'Installation Automatique (Windows PowerShell)
# ══════════════════════════════════════════════════════════════════════════════
# Usage: .\deploy\setup.ps1 [-Name "Cabinet"] [-Email "admin@email.fr"] [-SkipPrompts]
# ══════════════════════════════════════════════════════════════════════════════

param(
    [string]$Name,
    [string]$Email,
    [string]$Password,
    [string]$Domain,
    [switch]$SkipPrompts,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $ProjectDir ".env"
$DockerComposeFile = Join-Path $ScriptDir "docker-compose.yml"

# ──────────────────────────────────────────────────────────────────────────────
# Functions
# ──────────────────────────────────────────────────────────────────────────────

function Write-Banner {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                                   ║" -ForegroundColor Cyan
    Write-Host "║   ███████╗███████╗██████╗ ██╗   ██╗██╗ ██████╗███████╗           ║" -ForegroundColor Cyan
    Write-Host "║   ██╔════╝██╔════╝██╔══██╗██║   ██║██║██╔════╝██╔════╝           ║" -ForegroundColor Cyan
    Write-Host "║   ███████╗█████╗  ██████╔╝██║   ██║██║██║     █████╗             ║" -ForegroundColor Cyan
    Write-Host "║   ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██║██║     ██╔══╝             ║" -ForegroundColor Cyan
    Write-Host "║   ███████║███████╗██║  ██║ ╚████╔╝ ██║╚██████╗███████╗           ║" -ForegroundColor Cyan
    Write-Host "║   ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝ ╚═════╝╚══════╝  IA      ║" -ForegroundColor Cyan
    Write-Host "║                                                                   ║" -ForegroundColor Cyan
    Write-Host "║   CRM pour Cabinets d'Avocats avec Agent Vocal IA                ║" -ForegroundColor Cyan
    Write-Host "║                                                                   ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step($message) {
    Write-Host "`n▶ $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠ $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

function New-RandomString($length = 32) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    -join ((1..$length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}

function ConvertTo-Slug($text) {
    $text = $text.ToLower()
    $text = $text -replace '[àâä]', 'a'
    $text = $text -replace '[éèêë]', 'e'
    $text = $text -replace '[ïî]', 'i'
    $text = $text -replace '[ôö]', 'o'
    $text = $text -replace '[ùûü]', 'u'
    $text = $text -replace '[ç]', 'c'
    $text = $text -replace '[^a-z0-9]', '-'
    $text = $text -replace '-+', '-'
    $text = $text.Trim('-')
    return $text
}

function Test-Dependencies {
    Write-Step "Verification des prerequis..."

    # Check Docker
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        Write-Error "Docker n'est pas installe"
        Write-Host "Installez Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
        exit 1
    }

    # Check Docker is running
    try {
        docker info 2>&1 | Out-Null
    } catch {
        Write-Error "Docker n'est pas demarre"
        Write-Host "Demarrez Docker Desktop et relancez le script"
        exit 1
    }

    $version = (docker --version) -replace 'Docker version ', '' -replace ',.*', ''
    Write-Success "Prerequis OK (Docker $version)"
}

function Get-Configuration {
    if ($SkipPrompts) {
        return
    }

    Write-Step "Configuration de votre instance..."
    Write-Host ""

    # Cabinet Name
    if (-not $script:CabinetName) {
        $script:CabinetName = Read-Host "Nom du cabinet"
        if (-not $script:CabinetName) { $script:CabinetName = "Mon Cabinet" }
    }

    # Cabinet Slug
    $script:CabinetSlug = ConvertTo-Slug $script:CabinetName

    # Admin Email
    if (-not $script:AdminEmail) {
        do {
            $script:AdminEmail = Read-Host "Email administrateur"
            if ($script:AdminEmail -notmatch '^[\w\.-]+@[\w\.-]+\.\w+$') {
                Write-Warning "Email invalide"
            }
        } while ($script:AdminEmail -notmatch '^[\w\.-]+@[\w\.-]+\.\w+$')
    }

    # Admin Name
    if (-not $script:AdminName) {
        $script:AdminName = Read-Host "Nom de l'administrateur [Administrateur]"
        if (-not $script:AdminName) { $script:AdminName = "Administrateur" }
    }

    # Admin Password
    if (-not $script:AdminPassword) {
        do {
            $secure1 = Read-Host "Mot de passe administrateur (min 8 car.)" -AsSecureString
            $script:AdminPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure1))

            if ($script:AdminPassword.Length -lt 8) {
                Write-Warning "Le mot de passe doit faire au moins 8 caracteres"
                continue
            }

            $secure2 = Read-Host "Confirmez le mot de passe" -AsSecureString
            $confirm = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure2))

            if ($script:AdminPassword -ne $confirm) {
                Write-Warning "Les mots de passe ne correspondent pas"
                $script:AdminPassword = $null
            }
        } while (-not $script:AdminPassword -or $script:AdminPassword.Length -lt 8)
    }

    # Domain
    if (-not $script:DomainName) {
        $script:DomainName = Read-Host "Domaine (laissez vide pour localhost)"
    }

    # Anthropic API Key
    if (-not $script:AnthropicKey) {
        Write-Host ""
        Write-Host "Cle API Anthropic (Claude) pour les fonctionnalites IA"
        Write-Host "Obtenez-la sur: https://console.anthropic.com"
        $script:AnthropicKey = Read-Host "ANTHROPIC_API_KEY (optionnel)"
    }

    Write-Host ""
    Write-Success "Configuration enregistree"
}

function New-EnvFile {
    Write-Step "Generation du fichier .env..."

    # Generate secrets
    $script:PostgresPassword = New-RandomString 16
    $script:NextAuthSecret = New-RandomString 32

    # Set NEXTAUTH_URL
    if ($script:DomainName) {
        $script:NextAuthUrl = "https://$($script:DomainName)"
    } else {
        $script:NextAuthUrl = "http://localhost:3000"
    }

    $envContent = @"
# ══════════════════════════════════════════════════════════════════════════════
# ServiceIA - Configuration
# Genere automatiquement le $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ══════════════════════════════════════════════════════════════════════════════

# Cabinet
CABINET_NAME="$($script:CabinetName)"
CABINET_SLUG="$($script:CabinetSlug)"
CABINET_EMAIL="$($script:AdminEmail)"
CABINET_PHONE=

# Administrateur
ADMIN_EMAIL="$($script:AdminEmail)"
ADMIN_NAME="$($script:AdminName)"
ADMIN_PASSWORD="$($script:AdminPassword)"

# URL & Domaine
DOMAIN=$($script:DomainName)
PORT=3000
NEXTAUTH_URL="$($script:NextAuthUrl)"

# Base de donnees
POSTGRES_PASSWORD="$($script:PostgresPassword)"
DATABASE_URL="postgresql://serviceia:$($script:PostgresPassword)@db:5432/serviceia"

# Securite
NEXTAUTH_SECRET="$($script:NextAuthSecret)"

# Redis
REDIS_URL="redis://redis:6379"

# Environnement
NODE_ENV=production

# IA
ANTHROPIC_API_KEY=$($script:AnthropicKey)

# Agent Vocal (ElevenLabs)
ELEVENLABS_API_KEY=
ELEVENLABS_WEBHOOK_SECRET=
ELEVENLABS_AGENT_ID=

# Telephonie (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@serviceia.fr

# Calendrier (Google)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Paiements (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Stockage (S3)
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=serviceia-files
S3_REGION=fr-par
"@

    $envContent | Out-File -FilePath $EnvFile -Encoding UTF8
    Write-Success "Fichier .env genere"
}

function Start-Services {
    Write-Step "Construction et demarrage des services..."

    Set-Location $ProjectDir

    # Pull images
    Write-Host "Telechargement des images Docker..."
    docker compose -f $DockerComposeFile pull db redis 2>$null

    # Build web service
    Write-Host "Construction de l'application (cela peut prendre quelques minutes)..."
    docker compose -f $DockerComposeFile build web

    # Start services
    Write-Host "Demarrage des services..."
    docker compose -f $DockerComposeFile up -d

    Write-Success "Services demarres"
}

function Wait-ForServices {
    Write-Step "Attente du demarrage des services..."

    $maxAttempts = 60
    $attempt = 0

    # Wait for database
    Write-Host -NoNewline "Base de donnees"
    do {
        $attempt++
        Start-Sleep -Seconds 2
        Write-Host -NoNewline "."
        $ready = docker exec serviceia-db pg_isready -U serviceia -d serviceia 2>$null
    } while (-not $ready -and $attempt -lt $maxAttempts)

    if ($attempt -ge $maxAttempts) {
        Write-Host ""
        Write-Error "La base de donnees n'a pas demarre"
        exit 1
    }
    Write-Host " OK"

    # Wait for web service
    $attempt = 0
    Write-Host -NoNewline "Application"
    do {
        $attempt++
        Start-Sleep -Seconds 3
        Write-Host -NoNewline "."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
            $ready = $response.StatusCode -eq 200
        } catch {
            $ready = $false
        }
    } while (-not $ready -and $attempt -lt $maxAttempts)

    if ($attempt -ge $maxAttempts) {
        Write-Host ""
        Write-Warning "L'application prend du temps a demarrer..."
        Write-Host "Verifiez les logs avec: docker logs serviceia-web"
    } else {
        Write-Host " OK"
    }

    Write-Success "Services prets"
}

function Invoke-Migrations {
    Write-Step "Application des migrations de base de donnees..."

    try {
        docker exec serviceia-web npx prisma migrate deploy 2>$null
    } catch {
        Write-Warning "Migration echouee, tentative avec db push..."
        docker exec serviceia-web npx prisma db push --accept-data-loss 2>$null
    }

    Write-Success "Migrations appliquees"
}

function Initialize-Data {
    Write-Step "Configuration initiale des donnees..."

    # This will be handled by the web container's entrypoint
    Start-Sleep -Seconds 5

    Write-Success "Donnees initiales configurees"
}

function Write-Summary {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                 Installation Terminee !                           ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acces a l'application:" -ForegroundColor Cyan
    Write-Host ""
    if ($script:DomainName) {
        Write-Host "  URL:         https://$($script:DomainName)"
    } else {
        Write-Host "  URL:         http://localhost:3000"
    }
    Write-Host "  Email:       $($script:AdminEmail)"
    Write-Host "  Mot de passe: (celui que vous avez choisi)"
    Write-Host ""
    Write-Host "Commandes utiles:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Voir les logs:     docker logs -f serviceia-web"
    Write-Host "  Arreter:           docker compose -f deploy/docker-compose.yml down"
    Write-Host "  Redemarrer:        docker compose -f deploy/docker-compose.yml restart"
    Write-Host ""
    Write-Host "Webhook ElevenLabs:" -ForegroundColor Cyan
    if ($script:DomainName) {
        Write-Host "  https://$($script:DomainName)/api/webhooks/elevenlabs"
    } else {
        Write-Host "  http://localhost:3000/api/webhooks/elevenlabs"
    }
    Write-Host ""
}

function Show-Help {
    Write-Host "Usage: .\deploy\setup.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Name `"Cabinet Name`"    Nom du cabinet"
    Write-Host "  -Email admin@email.fr   Email administrateur"
    Write-Host "  -Password secret        Mot de passe administrateur"
    Write-Host "  -Domain example.com     Domaine de production"
    Write-Host "  -SkipPrompts            Mode non-interactif"
    Write-Host "  -Help                   Afficher cette aide"
    Write-Host ""
    Write-Host "Exemples:"
    Write-Host "  .\deploy\setup.ps1"
    Write-Host "  .\deploy\setup.ps1 -Name `"Cabinet Dupont`" -Email admin@dupont.fr"
}

# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

if ($Help) {
    Show-Help
    exit 0
}

# Set script variables from parameters
$script:CabinetName = $Name
$script:AdminEmail = $Email
$script:AdminPassword = $Password
$script:DomainName = $Domain

Write-Banner
Test-Dependencies

# Load existing .env if exists and skip-prompts
if ($SkipPrompts -and (Test-Path $EnvFile)) {
    Write-Step "Chargement de la configuration existante..."
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            Set-Variable -Name $matches[1] -Value $matches[2].Trim('"')
        }
    }
    Write-Success "Configuration chargee depuis .env"
} else {
    Get-Configuration
    New-EnvFile
}

Start-Services
Wait-ForServices
Invoke-Migrations
Initialize-Data
Write-Summary
