---
description: Deployment guide for ColdMail.ru. Pre-deploy checklist, environment tiers,
  deployment sequence, and rollback procedure.
  $ARGUMENTS: optional — "dev" | "staging" | "prod" (default: prod)
---

# /deploy $ARGUMENTS

## Purpose

Guide deployment of ColdMail.ru to the target environment.
Extracts procedures from Completion.md and applies environment-specific settings.

## Pre-Deployment Checklist

Before deploying, verify all items:

```
- [ ] All unit tests passing: npm run test
- [ ] Integration tests passing: npm run test:e2e
- [ ] Security audit: no critical/high vulnerabilities (npm audit)
- [ ] Performance benchmarks met (p99 < 500ms API)
- [ ] Database migrations tested on staging first
- [ ] Rollback procedure reviewed
- [ ] Monitoring dashboards configured (Grafana)
- [ ] Alerting rules active (Prometheus)
- [ ] DNS configured (coldmail.ru → VPS IP)
- [ ] TLS certificate issued (Let's Encrypt via certbot)
- [ ] Environment variables set on target server
- [ ] Secrets rotated (JWT_SECRET, ENCRYPTION_KEY)
- [ ] SMTP/IMAP connectivity verified (Yandex, Mail.ru)
```

## Environment Tiers

### Development (dev)

```bash
# Local development with Docker Compose
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
npx prisma migrate dev
npm run start:dev
```

| Setting | Value |
|---------|-------|
| Server | localhost |
| Database | coldmail_dev (local PostgreSQL) |
| Redis | localhost:6379 |
| Debug | enabled |
| Email sending | disabled (mock) |
| AI | mock responses or low-cost model |
| Monitoring | disabled |

### Staging

```bash
ssh deploy@staging << 'EOF'
  cd /opt/coldmail
  git pull origin develop
  docker compose pull
  docker compose up -d --build
  docker compose exec -T app npx prisma migrate deploy
  sleep 10
  curl -f http://localhost:3000/api/health || exit 1
EOF
```

| Setting | Value |
|---------|-------|
| Server | staging.coldmail.ru (VPS Russia) |
| Database | coldmail_staging |
| Email sending | enabled (test accounts only) |
| AI | real API (limited quota) |
| Monitoring | enabled |
| Data | sanitized copy from prod |

### Production (prod)

```bash
ssh deploy@vps1 << 'EOF'
  cd /opt/coldmail

  # 1. Prepare (backup + notify)
  docker compose exec -T postgres pg_dump -U coldmail coldmail > /backups/pre-deploy-$(date +%Y%m%d-%H%M).sql

  # 2. Deploy
  git pull origin main
  docker compose pull
  docker compose up -d --build
  docker compose exec -T app npx prisma migrate deploy

  # 3. Verify
  sleep 10
  curl -f http://localhost:3000/api/health || exit 1
  docker compose logs --tail=50 app | grep -i error && echo "ERRORS FOUND" || echo "Clean startup"
EOF
```

| Setting | Value |
|---------|-------|
| Server | coldmail.ru (VPS Russia, AdminVPS/HOSTKEY) |
| Database | coldmail (PostgreSQL 16) |
| Redis | redis:6379 |
| Email sending | enabled (production) |
| AI | OpenAI API (gpt-4o-mini) |
| Monitoring | Prometheus + Grafana + Loki |
| TLS | Let's Encrypt (auto-renewal via certbot) |
| Location | Russia (152-FZ compliance) |

## Deployment Sequence (Production)

```
1. Prepare (30 min before):
   - Create database backup
   - Notify team in chat
   - Verify VPS resources: df -h, free -m

2. Deploy (10-15 min):
   - git pull origin main
   - docker compose pull
   - docker compose up -d --build
   - docker compose exec -T app npx prisma migrate deploy

3. Verify (15 min):
   - Health check: curl https://coldmail.ru/api/health
   - Smoke tests: login, create campaign, send test email
   - Check logs: docker compose logs --tail=100 app
   - Verify metrics: Grafana dashboards green
   - Test warmup job execution
   - Verify SMTP connectivity (Yandex, Mail.ru)

4. Post-deploy:
   - Monitor error rates for 30 min
   - Confirm queue processing (BullMQ dashboard)
   - Update changelog
```

## Rollback Procedure

```bash
# Rollback to previous version
ssh deploy@vps1 << 'EOF'
  cd /opt/coldmail
  docker compose down
  git checkout HEAD~1
  docker compose up -d --build
  # Rollback migrations if needed:
  docker compose exec -T app npx prisma migrate resolve --rolled-back <migration_name>
EOF

# Verify rollback
curl -f https://coldmail.ru/api/health
```

**Decision criteria for rollback:**
- Health check fails after 3 retries
- Error rate > 5% for 5 minutes
- Critical user-facing functionality broken
- Database migration caused data issues

## Post-Deployment Monitoring

Check these dashboards in Grafana for 30 minutes after deploy:

| Dashboard | What to Watch |
|-----------|---------------|
| Overview | Error rate, request latency (p99 < 500ms) |
| Email Pipeline | Queue depth, send rate, bounce rate |
| Warmup Health | Inbox rates by provider (Yandex, Mail.ru) |
| Infrastructure | CPU < 80%, RAM < 85%, Disk < 85% |
| Business | No drop in active campaigns or user sessions |

## Environment Variables Reference

See `docs/Completion.md` for full list. Key variables:

```bash
NODE_ENV=production
PORT=3000
APP_URL=https://coldmail.ru
DATABASE_URL=postgresql://coldmail:password@db:5432/coldmail
REDIS_URL=redis://redis:6379
JWT_SECRET=<random-64-chars>
ENCRYPTION_KEY=<random-32-bytes-hex>
OPENAI_API_KEY=sk-...
```
