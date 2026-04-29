# ColdMail.ru -- Deployment Guide

## Prerequisites

| Component       | Version   | Purpose                          |
|-----------------|-----------|----------------------------------|
| Node.js         | 20 LTS    | Application runtime              |
| Docker          | 24+       | Container engine                 |
| Docker Compose  | 2.x       | Multi-container orchestration    |
| PostgreSQL      | 16        | Primary database                 |
| Redis           | 7.x       | Queue engine and cache           |
| Nginx           | 1.25      | Reverse proxy and TLS termination|
| Git             | 2.x       | Source code management           |

## Quick Start (Development)

```bash
# 1. Clone the repository
git clone git@github.com:your-org/coldmail.git
cd coldmail

# 2. Copy and configure environment
cp .env.example .env
# Edit .env -- set DATABASE_URL, REDIS_URL, OPENAI_API_KEY, secrets

# 3. Start all services
docker compose up -d

# 4. Run database migrations
docker compose exec app npx prisma migrate deploy

# 5. Verify
curl http://localhost:3000/api/health
```

The application will be available at `http://localhost:3000`. Grafana dashboard is at `http://localhost:3001`.

## Production Deployment on VPS (Russia)

### Server Requirements

ColdMail.ru must be hosted on servers physically located in the Russian Federation to comply with Federal Law 152-FZ (personal data storage). Recommended providers:

- **AdminVPS** (Moscow data center)
- **HOSTKEY** (Saint Petersburg data center)
- **Selectel** (Moscow / Saint Petersburg)

| Server Role | CPU    | RAM   | Disk      | Purpose                   |
|-------------|--------|-------|-----------|---------------------------|
| App Server  | 4 vCPU | 8 GB  | 100 GB SSD| App, workers, Nginx       |
| Data Server | 2 vCPU | 4 GB  | 200 GB SSD| PostgreSQL, Redis         |

For MVP, a single VPS with 4 vCPU / 8 GB RAM / 200 GB SSD is sufficient to run all services.

### Step-by-Step Production Setup

```bash
# 1. Prepare the server (Ubuntu 22.04 LTS)
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy

# 3. Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 4. Create application directory
sudo mkdir -p /opt/coldmail
sudo chown deploy:deploy /opt/coldmail

# 5. Clone and configure
cd /opt/coldmail
git clone git@github.com:your-org/coldmail.git .
cp .env.example .env
# Edit .env with production values (see Environment Variables below)

# 6. Deploy
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

### Environment Variables (Production)

```bash
NODE_ENV=production
PORT=3000
APP_URL=https://coldmail.ru
JWT_SECRET=<random-64-character-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
DATABASE_URL=postgresql://coldmail:<password>@db:5432/coldmail
DATABASE_POOL_SIZE=20
REDIS_URL=redis://redis:6379
ENCRYPTION_KEY=<random-32-bytes-hex>
ENCRYPTION_IV_LENGTH=16
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.7
DEFAULT_FROM_NAME=ColdMail.ru
TRACKING_DOMAIN=track.coldmail.ru
POSTGRES_PASSWORD=<strong-password>
GRAFANA_ADMIN_PASSWORD=<strong-password>
```

Generate secure secrets:

```bash
openssl rand -hex 32   # ENCRYPTION_KEY
openssl rand -base64 48 | tr -d '\n' # JWT_SECRET
```

### 152-FZ Compliance Checklist

- [ ] Server physically located in the Russian Federation
- [ ] All personal data (leads, users) stored on RF servers
- [ ] No data replication to servers outside RF
- [ ] Privacy policy published on the website
- [ ] Roskomnadzor notification filed (if applicable)

## SSL / TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install -y certbot

# Obtain certificate (stop Nginx first)
docker compose stop nginx
sudo certbot certonly --standalone -d coldmail.ru -d www.coldmail.ru -d track.coldmail.ru
docker compose start nginx

# Copy certificates to the project
sudo cp /etc/letsencrypt/live/coldmail.ru/fullchain.pem ./nginx/certs/
sudo cp /etc/letsencrypt/live/coldmail.ru/privkey.pem ./nginx/certs/
```

### Auto-Renewal

```bash
# Add cron job for automatic renewal
echo "0 3 * * * certbot renew --pre-hook 'docker compose -f /opt/coldmail/docker-compose.yml stop nginx' --post-hook 'docker compose -f /opt/coldmail/docker-compose.yml start nginx'" | sudo crontab -
```

### DNS Records

| Record | Type  | Value                |
|--------|-------|----------------------|
| `coldmail.ru`       | A     | `<VPS_IP>`          |
| `www.coldmail.ru`   | CNAME | `coldmail.ru`       |
| `track.coldmail.ru` | A     | `<VPS_IP>`          |

## Updates and Rollback

### Standard Update Procedure

```bash
ssh deploy@vps << 'EOF'
  cd /opt/coldmail

  # 1. Backup database
  docker compose exec postgres pg_dump -U coldmail coldmail > /backups/pre-deploy-$(date +%Y%m%d_%H%M).sql

  # 2. Pull latest code
  git pull origin main

  # 3. Rebuild and restart
  docker compose pull
  docker compose up -d --build

  # 4. Run migrations
  docker compose exec -T app npx prisma migrate deploy

  # 5. Verify health
  sleep 10
  curl -f http://localhost:3000/api/health || echo "HEALTH CHECK FAILED"
EOF
```

### Rollback Procedure

```bash
ssh deploy@vps << 'EOF'
  cd /opt/coldmail

  # Stop services
  docker compose down

  # Revert to previous commit
  git checkout HEAD~1

  # Rebuild
  docker compose up -d --build

  # Rollback migration if needed
  docker compose exec -T app npx prisma migrate resolve --rolled-back <migration_name>

  # Restore database if needed
  docker compose exec -T postgres psql -U coldmail coldmail < /backups/pre-deploy-YYYYMMDD_HHMM.sql

  # Verify
  curl -f http://localhost:3000/api/health
EOF
```

### CI/CD Pipeline (GitHub Actions)

The project uses GitHub Actions for continuous deployment. On every push to `main`:

1. Run linter and unit tests
2. Run integration and E2E tests (against PostgreSQL 16 and Redis 7)
3. SSH into the VPS and deploy
4. Execute health check; rollback on failure

See `.github/workflows/ci.yml` for the full pipeline configuration.
