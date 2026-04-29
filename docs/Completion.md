# Completion: ColdMail.ru

**Date:** 2026-04-29
**Purpose:** Deployment, CI/CD, monitoring, handoff checklists

---

## Deployment Plan

### Pre-Deployment Checklist

- [ ] All unit tests passing (102+)
- [ ] Integration tests passing (8)
- [ ] E2E tests passing (5 critical journeys)
- [ ] Security audit: no critical/high vulnerabilities
- [ ] Performance benchmarks met (p99 < 500ms API)
- [ ] Database migrations tested on staging
- [ ] Rollback procedure documented and tested
- [ ] Monitoring dashboards configured
- [ ] Alerting rules active
- [ ] DNS configured (coldmail.ru → VPS IP)
- [ ] TLS certificate issued (Let's Encrypt)
- [ ] Environment variables set on production
- [ ] Secrets rotated (JWT_SECRET, ENCRYPTION_KEY)

### Deployment Sequence

```
1. Prepare (30 min before):
   - Create database backup
   - Notify team in chat
   - Verify VPS resources (disk, RAM)

2. Deploy (10-15 min):
   ssh deploy@vps1 << 'EOF'
     cd /opt/coldmail
     git pull origin main
     docker compose pull
     docker compose up -d --build
     docker compose exec app npx prisma migrate deploy
   EOF

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

### Rollback Procedure

```bash
# Rollback to previous version
ssh deploy@vps1 << 'EOF'
  cd /opt/coldmail
  docker compose down
  git checkout HEAD~1
  docker compose up -d --build
  # Rollback migrations if needed:
  docker compose exec app npx prisma migrate resolve --rolled-back <migration_name>
EOF

# Verify rollback
curl https://coldmail.ru/api/health
```

---

## CI/CD Configuration

### GitHub Actions Pipeline

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: coldmail_test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/coldmail
            git pull origin main
            docker compose pull
            docker compose up -d --build
            docker compose exec -T app npx prisma migrate deploy
            sleep 10
            curl -f http://localhost:3000/api/health || exit 1
```

---

## Monitoring & Alerting

### Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `coldmail_http_requests_total` | Counter | Total HTTP requests by status/method |
| `coldmail_http_duration_seconds` | Histogram | Request latency |
| `coldmail_emails_sent_total` | Counter | Emails sent by status (sent/bounced/failed) |
| `coldmail_emails_queued` | Gauge | Current queue depth |
| `coldmail_warmup_inbox_rate` | Gauge | Average inbox rate per provider |
| `coldmail_active_campaigns` | Gauge | Number of active campaigns |
| `coldmail_active_users` | Gauge | DAU (daily active users) |
| `coldmail_ai_generations_total` | Counter | AI email generations |
| `coldmail_ai_duration_seconds` | Histogram | AI generation latency |
| `coldmail_db_connections_active` | Gauge | PostgreSQL active connections |

### Alert Rules

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| High Error Rate | error_rate > 5% for 5min | Critical | Email + SMS |
| Slow API | p99 latency > 2s for 10min | Warning | Email |
| Queue Backlog | queue_depth > 1000 for 15min | Warning | Email |
| High Bounce Rate | bounce_rate > 10% hourly | Critical | Email + SMS |
| DB Connections High | connections > 80% for 5min | Warning | Email |
| Disk Space Low | disk_usage > 85% | Warning | Email |
| App Down | health_check fails 3x | Critical | Email + SMS |
| Warmup Degradation | avg inbox_rate < 70% | Warning | Email |

### Grafana Dashboards

1. **Overview** — KPI cards: users, campaigns, emails sent today, error rate
2. **Email Pipeline** — queue depth, send rate, bounce rate, delivery latency
3. **Warmup Health** — inbox rates by provider, warmup progress
4. **Infrastructure** — CPU, RAM, disk, network, PostgreSQL, Redis
5. **Business Metrics** — signups, activations, MRR (from DB queries)

---

## Logging Strategy

### Log Levels

| Level | Use | Example |
|-------|-----|---------|
| `error` | Failures requiring attention | SMTP connection failed, DB timeout |
| `warn` | Degraded but functional | AI fallback used, retry attempt |
| `info` | Normal operations | Email sent, campaign started, user registered |
| `debug` | Development only | Query details, request/response bodies |

### Log Format (JSON via Pino)

```json
{
  "level": "info",
  "time": 1714400000000,
  "service": "email-worker",
  "msg": "Email sent",
  "campaign_id": "uuid",
  "lead_id": "uuid",
  "account_id": "uuid",
  "provider": "yandex",
  "duration_ms": 450
}
```

### Retention

| Log Type | Retention | Storage |
|----------|-----------|---------|
| Application logs | 30 days | Loki |
| Access logs (Nginx) | 90 days | Loki |
| Audit logs | 1 year | PostgreSQL |
| Error logs | 90 days | Loki + alert archive |

---

## Environment Variables

```bash
# App
NODE_ENV=production
PORT=3000
APP_URL=https://coldmail.ru
JWT_SECRET=<random-64-chars>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://coldmail:password@db:5432/coldmail
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://redis:6379

# Encryption
ENCRYPTION_KEY=<random-32-bytes-hex>
ENCRYPTION_IV_LENGTH=16

# AI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.7

# Email
DEFAULT_FROM_NAME=ColdMail.ru
TRACKING_DOMAIN=track.coldmail.ru

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_ADMIN_PASSWORD=<password>
```

---

## Handoff Checklists

### For Development Team

- [ ] Repository access (GitHub)
- [ ] Development environment setup (`docker compose up` runs locally)
- [ ] `.env.example` populated with all required vars
- [ ] `DEVELOPMENT_GUIDE.md` read and understood
- [ ] Coding standards review (`Architecture.md` → Tech Stack section)
- [ ] Branch strategy: `main` (production), `develop` (staging), feature branches
- [ ] PR template configured
- [ ] Code review guidelines established

### For QA Team

- [ ] Staging environment access
- [ ] Test accounts created (Yandex, Mail.ru test mailboxes)
- [ ] Test data seeded (sample campaigns, leads)
- [ ] Bug reporting template (severity, steps to reproduce, expected vs actual)
- [ ] Acceptance criteria reference (`Specification.md`)
- [ ] Edge cases reference (`Refinement.md`)

### For Operations Team

- [ ] VPS access (SSH keys)
- [ ] Docker Compose commands cheatsheet
- [ ] Rollback procedure tested
- [ ] Grafana dashboards access
- [ ] Alert notification channels configured
- [ ] DNS management access
- [ ] TLS certificate renewal automation (certbot)
- [ ] Backup restoration tested
