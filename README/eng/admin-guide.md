# ColdMail.ru -- Administrator Guide

## Roles and Permissions

ColdMail.ru uses a role-based access control model within workspaces.

| Role   | Campaigns | Accounts | Leads | Analytics | Settings | Billing |
|--------|:---------:|:--------:|:-----:|:---------:|:--------:|:-------:|
| Owner  | Full      | Full     | Full  | Read      | Full     | Full    |
| Member | Full      | Full     | Full  | Read      | --       | --      |

Owners can invite members to their workspace. Members can manage campaigns, email accounts, and leads but cannot access billing or workspace settings.

### Plan Tiers

| Plan    | Email Accounts | Emails/Day | AI Credits/Mo | Warmup |
|---------|:--------------:|:----------:|:-------------:|:------:|
| Free    | 1              | 50         | 20            | No     |
| Growth  | 5              | 500        | 200           | Yes    |
| Pro     | 25             | 2,500      | 1,000         | Yes    |
| Agency  | Unlimited      | 10,000     | 5,000         | Yes    |

## Configuration Reference (.env)

### Application Settings

| Variable                  | Default              | Description                            |
|---------------------------|----------------------|----------------------------------------|
| `NODE_ENV`                | `development`        | Environment: development / production  |
| `PORT`                    | `3000`               | API server port                        |
| `APP_URL`                 | `http://localhost:3000` | Public URL of the application       |
| `JWT_SECRET`              | --                   | Secret key for JWT signing (64 chars)  |
| `JWT_EXPIRES_IN`          | `15m`                | Access token lifetime                  |
| `REFRESH_TOKEN_EXPIRES_IN`| `7d`                 | Refresh token lifetime                 |

### Database

| Variable            | Default                                    | Description             |
|---------------------|--------------------------------------------|-------------------------|
| `DATABASE_URL`      | `postgresql://coldmail:changeme@...`       | PostgreSQL connection   |
| `DATABASE_POOL_SIZE`| `20`                                       | Max DB connections      |

### Redis

| Variable    | Default                | Description           |
|-------------|------------------------|-----------------------|
| `REDIS_URL` | `redis://localhost:6379`| Redis connection URL  |

### Encryption

| Variable              | Default | Description                                     |
|-----------------------|---------|-------------------------------------------------|
| `ENCRYPTION_KEY`      | --      | AES-256-GCM key for SMTP credential encryption  |
| `ENCRYPTION_IV_LENGTH`| `16`    | Initialization vector length                     |

### AI (OpenAI)

| Variable          | Default        | Description                    |
|-------------------|----------------|--------------------------------|
| `OPENAI_API_KEY`  | --             | OpenAI API key                 |
| `OPENAI_MODEL`    | `gpt-4o-mini`  | Model for email generation     |
| `AI_MAX_TOKENS`   | `500`          | Max tokens per generation      |
| `AI_TEMPERATURE`  | `0.7`          | Generation creativity (0-1)    |

### Email

| Variable           | Default          | Description                  |
|--------------------|------------------|------------------------------|
| `DEFAULT_FROM_NAME`| `ColdMail.ru`    | Default sender display name  |
| `TRACKING_DOMAIN`  | `track.coldmail.ru`| Open/click tracking domain |

## SMTP Account Management

### Supported Providers

| Provider      | SMTP Host           | SMTP Port | IMAP Host           | IMAP Port | Daily Limit |
|---------------|---------------------|:---------:|---------------------|:---------:|:-----------:|
| Yandex.Mail   | `smtp.yandex.ru`    | 465 (SSL) | `imap.yandex.ru`    | 993       | 500         |
| Mail.ru       | `smtp.mail.ru`      | 465 (SSL) | `imap.mail.ru`      | 993       | 500         |
| Custom SMTP   | User-defined        | Varies    | User-defined        | Varies    | Varies      |

### Provider-Specific Notes

**Yandex.Mail:**
- Requires an app-specific password (not the main account password)
- Enable IMAP in Yandex Mail settings
- Rate limit: approximately 500 emails per day per account
- SPF/DKIM configured automatically by Yandex

**Mail.ru:**
- Requires an app-specific password generated in security settings
- Enable IMAP access in Mail.ru settings
- Similar daily sending limits as Yandex

### Credential Security

All SMTP and IMAP passwords are encrypted at rest using AES-256-GCM. The encryption key is stored in the `ENCRYPTION_KEY` environment variable and must never be committed to version control or logged.

## Monitoring (Prometheus + Grafana)

### Accessing Dashboards

- **Grafana:** `https://coldmail.ru:3001` (or behind Nginx proxy)
- **Prometheus:** `http://localhost:9090` (internal only, not exposed)

Default Grafana credentials: `admin` / value of `GRAFANA_ADMIN_PASSWORD`.

### Key Metrics to Watch

| Metric                             | Type      | Alert Threshold        |
|------------------------------------|-----------|------------------------|
| `coldmail_http_requests_total`     | Counter   | Error rate > 5%        |
| `coldmail_http_duration_seconds`   | Histogram | p99 > 2s               |
| `coldmail_emails_sent_total`       | Counter   | --                     |
| `coldmail_emails_queued`           | Gauge     | > 1,000 for 15 min     |
| `coldmail_warmup_inbox_rate`       | Gauge     | < 70%                  |
| `coldmail_db_connections_active`   | Gauge     | > 80% capacity         |
| `coldmail_ai_duration_seconds`     | Histogram | p99 > 15s              |

### Recommended Grafana Dashboards

1. **Overview** -- KPIs: active users, campaigns, emails sent, error rate
2. **Email Pipeline** -- Queue depth, send rate, bounce rate, delivery latency
3. **Warmup Health** -- Inbox rates by provider, warmup progress over time
4. **Infrastructure** -- CPU, RAM, disk, network, PostgreSQL and Redis metrics
5. **Business Metrics** -- Signups, activations, MRR (queried from PostgreSQL)

### Alert Rules

| Alert                | Condition                        | Severity | Action         |
|----------------------|----------------------------------|----------|----------------|
| High Error Rate      | Error rate > 5% for 5 min        | Critical | Email + SMS    |
| Slow API             | p99 > 2s for 10 min              | Warning  | Email          |
| Queue Backlog        | Queue depth > 1,000 for 15 min   | Warning  | Email          |
| High Bounce Rate     | Bounce rate > 10% hourly         | Critical | Email + SMS    |
| App Down             | Health check fails 3 times       | Critical | Email + SMS    |
| Disk Space Low       | Disk usage > 85%                 | Warning  | Email          |
| Warmup Degradation   | Avg inbox rate < 70%             | Warning  | Email          |

## Backups

### PostgreSQL Backup Schedule

| Type         | Frequency  | Retention | Location                     |
|--------------|------------|-----------|------------------------------|
| Full dump    | Daily      | 30 days   | Same data center, separate disk |
| WAL archive  | Continuous | 7 days    | Local disk                   |

```bash
# Manual backup
docker compose exec postgres pg_dump -U coldmail coldmail > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T postgres psql -U coldmail coldmail < backup_20260429.sql
```

### Redis Backup

Redis is configured with AOF persistence (`--appendonly yes`). RDB snapshots are taken every hour. Retention: 7 days.

### Backup Verification

Test restore procedures monthly. Verify that:
- Database restores without errors
- Application starts successfully against restored data
- Email account credentials decrypt correctly

## Troubleshooting

### Common Issues

**Problem: Application does not start**
```bash
docker compose logs app --tail=50
# Check for missing environment variables or database connection errors
```

**Problem: Emails are not being sent**
```bash
# Check email worker logs
docker compose logs worker-email --tail=50

# Check BullMQ queue depth
docker compose exec redis redis-cli LLEN bull:email:send:wait
```

**Problem: Warmup not progressing**
```bash
docker compose logs worker-warmup --tail=50
# Verify SMTP credentials are valid and not expired
```

**Problem: High bounce rate**
- Check if email accounts have valid SPF/DKIM/DMARC records
- Verify the warmup period is sufficient (minimum 14 days recommended)
- Review lead list quality; remove invalid addresses

**Problem: AI generation failing**
```bash
docker compose logs worker-ai --tail=50
# Verify OPENAI_API_KEY is valid and has sufficient credits
```

**Problem: Database connection exhaustion**
```bash
# Check active connections
docker compose exec postgres psql -U coldmail -c "SELECT count(*) FROM pg_stat_activity;"
# Consider increasing DATABASE_POOL_SIZE or adding PgBouncer
```

### Log Inspection

```bash
# All services
docker compose logs --tail=100

# Specific service
docker compose logs worker-email --tail=50 --follow

# Filter by time
docker compose logs --since="2026-04-29T10:00:00"
```

### Health Check Endpoints

| Endpoint             | Purpose                        |
|----------------------|--------------------------------|
| `GET /api/health`    | Application health status      |
| PostgreSQL           | `pg_isready -U coldmail`       |
| Redis                | `redis-cli ping`               |
