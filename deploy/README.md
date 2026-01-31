# ServiceIA - Guide de Deploiement

## Installation Rapide (One-Click)

```bash
# 1. Cloner le repository
git clone https://github.com/votre-org/serviceia.git
cd serviceia

# 2. Lancer l'installation
./deploy/setup.sh
```

Le script vous guidera pour configurer votre instance.

## Installation Manuelle

### Prerequis

- Docker 24+
- Docker Compose 2.20+
- 4 GB RAM minimum
- 20 GB espace disque

### Etapes

1. **Copier le template d'environnement**
   ```bash
   cp deploy/.env.template .env
   ```

2. **Configurer les variables** (editez `.env`)
   - `CABINET_NAME` - Nom de votre cabinet
   - `ADMIN_EMAIL` - Email de l'administrateur
   - `ADMIN_PASSWORD` - Mot de passe (min 8 caracteres)
   - `DOMAIN` - Domaine de production (ex: crm.cabinet.fr)
   - `ANTHROPIC_API_KEY` - Cle API Claude (requis)

3. **Demarrer les services**
   ```bash
   docker compose -f deploy/docker-compose.yml up -d
   ```

4. **Verifier l'installation**
   ```bash
   curl http://localhost:3000/api/health
   ```

5. **Se connecter**
   - URL: http://localhost:3000
   - Email: (celui configure)
   - Mot de passe: (celui configure)

## Configuration Avancee

### Variables d'Environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `CABINET_NAME` | Nom affiche du cabinet | Oui |
| `CABINET_SLUG` | Identifiant URL (auto-genere) | Non |
| `ADMIN_EMAIL` | Email admin principal | Oui |
| `ADMIN_PASSWORD` | Mot de passe admin | Oui |
| `DOMAIN` | Domaine de production | Non |
| `ANTHROPIC_API_KEY` | API Claude pour l'IA | Oui |
| `ELEVENLABS_API_KEY` | API ElevenLabs (voix) | Non |
| `ELEVENLABS_WEBHOOK_SECRET` | Secret webhook | Non |
| `TWILIO_ACCOUNT_SID` | SID Twilio | Non |
| `TWILIO_AUTH_TOKEN` | Token Twilio | Non |
| `TWILIO_PHONE_NUMBER` | Numero Twilio (+33...) | Non |
| `RESEND_API_KEY` | API Resend (emails) | Non |
| `GOOGLE_CLIENT_ID` | OAuth Google Calendar | Non |
| `GOOGLE_CLIENT_SECRET` | Secret Google | Non |

### Ports

| Service | Port | Description |
|---------|------|-------------|
| Web | 3000 | Application Next.js |
| PostgreSQL | 5432 | Base de donnees |
| Redis | 6379 | Cache |

### Volumes

| Volume | Description |
|--------|-------------|
| `serviceia_db` | Donnees PostgreSQL |
| `serviceia_redis` | Donnees Redis |

## Mise a Jour

```bash
# Arreter les services
docker compose -f deploy/docker-compose.yml down

# Recuperer les mises a jour
git pull origin main

# Reconstruire et redemarrer
docker compose -f deploy/docker-compose.yml up -d --build
```

## Sauvegarde

```bash
# Sauvegarder la base de donnees
docker exec serviceia-db pg_dump -U serviceia serviceia > backup.sql

# Restaurer
docker exec -i serviceia-db psql -U serviceia serviceia < backup.sql
```

## Support

- Documentation: [docs.serviceia.fr](https://docs.serviceia.fr)
- Issues: [github.com/votre-org/serviceia/issues](https://github.com/votre-org/serviceia/issues)
