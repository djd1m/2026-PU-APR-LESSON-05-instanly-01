---
description: Generate or update project documentation in Russian and English.
  Creates a comprehensive set of markdown files covering deployment, usage,
  architecture, and user flows.
  $ARGUMENTS: optional flags — "rus" (Russian only), "eng" (English only), "update" (refresh existing)
---

# /docs $ARGUMENTS

## Purpose

Generate professional, bilingual project documentation from source code,
existing docs, and development insights. Output: `/README/rus/` and `/README/eng/`.

## Step 1: Gather Context

Read all available sources to build comprehensive understanding:

### Primary sources (project documentation):
```
docs/PRD.md                      — product requirements, features, user personas
docs/Architecture.md             — system architecture, tech stack, Docker Compose
docs/Pseudocode.md               — data structures, algorithms, API contracts
docs/Completion.md               — deployment, environment setup, CI/CD
docs/features/                   — feature-specific documentation
docs/plans/                      — implementation plans
CLAUDE.md                        — project overview, commands, agents
DEVELOPMENT_GUIDE.md             — development workflow
docker-compose.yml               — infrastructure services
.env.example                     — environment variables
```

### Secondary sources (knowledge base):
```
myinsights/1nsights.md           — development insights index
myinsights/details/              — detailed insight files
.claude/feature-roadmap.json     — feature list and statuses
```

### Tertiary sources (code analysis):
```
Source code structure (src/)      — actual implementation
package.json                     — dependencies, scripts
prisma/schema.prisma             — database schema
frontend/                        — React/Next.js frontend
README.md (existing, if any)     — current documentation
```

## Step 2: Determine Scope

```
IF $ARGUMENTS contains "rus":  languages = ["rus"]
ELIF $ARGUMENTS contains "eng": languages = ["eng"]
ELSE: languages = ["rus", "eng"]

IF $ARGUMENTS contains "update":
    mode = "update"  — read existing /README/ files, update only changed sections
ELSE:
    mode = "create"  — generate from scratch
```

## Step 3: Generate Documentation Set

For EACH language in languages, generate these files:

### File 1: `deployment.md` — Deployment Guide

Cover:
- System requirements (Node.js 20, Docker 24, PostgreSQL 16, Redis 7)
- Quick start (clone → .env → docker compose up → prisma migrate)
- Production deployment on VPS (AdminVPS/HOSTKEY, Russia, 152-FZ)
- SSL/TLS via Let's Encrypt
- Database initialization and seeding
- Service startup order
- Health checks verification
- Updating and rollback procedures

### File 2: `admin-guide.md` — Administrator Guide

Cover:
- User management (roles: owner, member)
- System configuration (environment variables, feature flags)
- SMTP/IMAP account management
- Monitoring and logging (Prometheus, Grafana, Loki, Pino)
- Backup procedures (PostgreSQL daily + WAL, Redis RDB)
- Troubleshooting common issues (SMTP connection, queue backlog, warmup degradation)

### File 3: `user-guide.md` — User Guide

Cover:
- Registration and first login
- Connecting email accounts (Yandex, Mail.ru, custom SMTP)
- Starting warmup for email accounts
- Creating campaigns (4-step wizard)
- AI email generation (tones: formal, casual, creative)
- Managing leads (CSV import, manual add)
- Setting up email sequences (3-5 steps)
- Using Unibox for replies
- Reading analytics (sent, opened, replied, bounced)
- FAQ

### File 4: `infrastructure.md` — Infrastructure Requirements

Cover:
- MVP: 1 VPS (4 vCPU, 8GB RAM, 100GB SSD) + 1 DB server (2 vCPU, 4GB RAM, 200GB SSD)
- Growth: 2-3 VPS, separate DB, worker replicas
- Scale: Kubernetes on Yandex Cloud / Selectel
- Network requirements (ports: 80, 443, 5432, 6379)
- External API access (OpenAI, Yandex SMTP/IMAP, Mail.ru SMTP/IMAP)
- Docker Compose services overview (11 containers)

### File 5: `architecture.md` — System Architecture

Cover:
- High-level diagram (Mermaid): Client → Nginx → NestJS → Workers → Data Layer
- Technology stack table with rationale
- NestJS module structure (12 modules)
- Background workers (BullMQ: 7 queues)
- Database schema (PostgreSQL ER diagram)
- Redis usage (cache, queues, rate limiting)
- Security (JWT, bcrypt, AES-256-GCM, 152-FZ)
- Scalability path

### File 6: `ui-guide.md` — UI Guide

Cover:
- Layout system (icon sidebar w-16 + secondary sidebar w-72 + content)
- Dark theme design system (colors, typography, spacing from Architecture.md)
- Key screens: Dashboard, Email Accounts, Campaigns, Campaign Wizard, AI Generator, Unibox, Analytics, Settings
- Component library (Button, Card, Input, Badge, Table, EmptyState)
- Responsive behavior (read-only dashboard on mobile)

### File 7: `user-flows.md` — User & Admin Flows

Cover:
- User Flow: Registration and onboarding (15 min to first campaign)
- User Flow: Connect email account + start warmup
- User Flow: Create campaign (wizard → leads → sequence → launch)
- User Flow: AI-generate personalized emails
- User Flow: Monitor Unibox and respond to leads
- Admin Flow: System setup and configuration
- Admin Flow: Monitoring and maintenance
- Include Mermaid sequence diagrams for key flows

## Step 4: Generate Output

1. Create directory structure:
```bash
mkdir -p README/rus README/eng
```

2. Generate files for each language:
   - Russian files go to `README/rus/`
   - English files go to `README/eng/`
   - Use proper language throughout (not machine-translated fragments)

3. Generate `README/index.md` — table of contents linking both languages:
```markdown
# ColdMail.ru Documentation

## Dokumentatsiya na russkom
- [Razvertyvanie](rus/deployment.md)
- [Rukovodstvo administratora](rus/admin-guide.md)
- [Rukovodstvo polzovatelya](rus/user-guide.md)
- [Trebovaniya k infrastrukture](rus/infrastructure.md)
- [Arkhitektura](rus/architecture.md)
- [Interfeys](rus/ui-guide.md)
- [Polzovatelskiye stsenarii](rus/user-flows.md)

## English Documentation
- [Deployment Guide](eng/deployment.md)
- [Administrator Guide](eng/admin-guide.md)
- [User Guide](eng/user-guide.md)
- [Infrastructure Requirements](eng/infrastructure.md)
- [Architecture](eng/architecture.md)
- [UI Guide](eng/ui-guide.md)
- [User & Admin Flows](eng/user-flows.md)
```

## Step 5: Commit and Report

```bash
git add README/
git commit -m "docs: generate project documentation (RU/EN)"
git push origin HEAD
```

Report:
```
Documentation generated: README/

Russian (README/rus/):
   deployment.md
   admin-guide.md
   user-guide.md
   infrastructure.md
   architecture.md
   ui-guide.md
   user-flows.md

English (README/eng/):
   deployment.md
   admin-guide.md
   user-guide.md
   infrastructure.md
   architecture.md
   ui-guide.md
   user-flows.md

README/index.md — documentation index
```

## Update Mode

When `$ARGUMENTS` contains "update":
1. Read existing files in `README/rus/` and `README/eng/`
2. Compare with current project state
3. Update only sections that have changed
4. Preserve any manual additions (sections not in template)
5. Commit: `git commit -m "docs: update project documentation"`

## Notes

- Documentation is generated from ACTUAL project state, not assumptions
- Mermaid diagrams are used for architecture and flow visualizations
- If UI doesn't exist yet, ui-guide.md notes this and describes planned UI
- If some information is unavailable, the section notes what's missing
- myinsights/ is checked for gotchas and important notes to include
