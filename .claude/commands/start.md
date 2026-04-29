---
description: Bootstrap entire ColdMail.ru project from documentation. Generates monorepo skeleton, all packages, Docker configs, database schema, core modules, and basic tests. $ARGUMENTS: optional flags --skip-tests, --skip-seed, --dry-run.
---

# /start $ARGUMENTS

## Purpose

One-command project generation from documentation → working monorepo with `docker compose up`.

## Prerequisites

- Documentation in `docs/` directory (SPARC output)
- CC toolkit in project root (CLAUDE.md, .claude/, .mcp.json)
- Node.js 20 LTS installed
- Docker + Docker Compose installed
- Git initialized

## Process

### Phase 1: Foundation (sequential — everything depends on this)

1. **Read all project docs** to build full context:
   - `docs/PRD.md` → features, user personas, success metrics
   - `docs/Architecture.md` → monorepo structure, Docker Compose, tech stack
   - `docs/Pseudocode.md` → data structures, core algorithms, API contracts, state machines
   - `docs/Completion.md` → env config, deployment setup, CI/CD

2. **Generate root configs:**
   - `package.json` (name: coldmail-ru, workspaces for monorepo if needed)
   - `docker-compose.yml` (services: nginx, app, worker-email, worker-warmup, worker-imap, worker-ai, postgres, redis, grafana, prometheus, loki)
   - `.env.example` (from Completion.md: DATABASE_URL, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY, OPENAI_API_KEY, etc.)
   - `.gitignore` (node_modules, dist, .env, *.log, postgres-data, redis-data)
   - `Dockerfile` (Node.js 20, multi-stage build: builder + runner)
   - `tsconfig.json` (strict TypeScript config for NestJS)
   - `nest-cli.json` (NestJS CLI configuration)

3. **Create project directory structure:**
   ```
   src/
   ├── api/              # Controllers (REST endpoints)
   ├── services/         # Business logic layer
   ├── repositories/     # Data access layer (Prisma)
   ├── models/           # DTOs, interfaces, types
   ├── utils/            # Shared utilities (encryption, logging)
   ├── config/           # Configuration module (env parsing)
   ├── auth/             # JWT, login, register, refresh
   ├── accounts/         # Email account CRUD, connection testing
   ├── campaigns/        # Campaign lifecycle, scheduling
   ├── sequences/        # Sequence steps, template rendering
   ├── leads/            # Lead management, CSV import, status
   ├── warmup/           # Warmup engine logic, peer selection
   ├── email/            # SMTP sending, IMAP checking, deliverability
   ├── ai/               # OpenAI integration, prompt management
   ├── unibox/           # Reply aggregation, thread management
   ├── analytics/        # Metrics calculation, time-series
   ├── compliance/       # 38-FZ checker, opt-out management
   └── common/           # Shared: encryption, logging, errors
   ```

4. **Git commit:** `chore: project root configuration`

### Phase 2: Packages (parallel via Task tool)

Launch 3 parallel tasks:

#### Task A: Backend Core (NestJS) ⚡

Read and use as source:
- `docs/Architecture.md` → NestJS modules, tech stack
- `docs/Pseudocode.md` → data structures → Prisma schema, API contracts → controllers
- `docs/Completion.md` → env vars → config module

Generate:
- `prisma/schema.prisma` — full schema (User, EmailAccount, Campaign, Lead, Sequence, SequenceStep, EmailMessage, WarmupJob, UniboxMessage) from Pseudocode.md data structures
- `src/config/config.module.ts` — environment configuration
- `src/config/config.service.ts` — typed config access
- `src/auth/auth.module.ts`, `auth.controller.ts`, `auth.service.ts` — JWT + bcrypt
- `src/auth/strategies/jwt.strategy.ts` — Passport JWT strategy
- `src/auth/guards/jwt-auth.guard.ts` — route protection
- `src/accounts/accounts.module.ts`, `accounts.controller.ts`, `accounts.service.ts`
- `src/campaigns/campaigns.module.ts`, `campaigns.controller.ts`, `campaigns.service.ts`
- `src/sequences/sequences.module.ts`, `sequences.controller.ts`, `sequences.service.ts`
- `src/leads/leads.module.ts`, `leads.controller.ts`, `leads.service.ts`
- `src/leads/csv-import.service.ts` — CSV parsing and import
- `src/warmup/warmup.module.ts`, `warmup.controller.ts`, `warmup.service.ts`
- `src/email/email.module.ts`, `email.service.ts` — Nodemailer SMTP
- `src/email/imap.service.ts` — imapflow IMAP client
- `src/ai/ai.module.ts`, `ai.controller.ts`, `ai.service.ts` — OpenAI SDK
- `src/unibox/unibox.module.ts`, `unibox.controller.ts`, `unibox.service.ts`
- `src/analytics/analytics.module.ts`, `analytics.controller.ts`, `analytics.service.ts`
- `src/compliance/compliance.module.ts`, `compliance.service.ts` — 38-FZ checks
- `src/common/encryption.service.ts` — AES-256-GCM for credentials
- `src/common/logger.service.ts` — Pino structured logging
- `src/common/filters/http-exception.filter.ts` — error handling
- `src/app.module.ts` — root module
- `src/main.ts` — bootstrap

**Commits:** `feat: backend core modules`, `feat: prisma schema`

#### Task B: Background Workers (BullMQ) ⚡

Read and use as source:
- `docs/Architecture.md` → queue definitions, concurrency, schedules
- `docs/Pseudocode.md` → algorithms (scheduleCampaignEmails, runWarmupCycle, aiPersonalize, checkInbox)

Generate:
- `src/workers/email-send.worker.ts` — email sending (concurrency: 5)
- `src/workers/email-schedule.worker.ts` — campaign scheduler (cron every 5min)
- `src/workers/warmup.worker.ts` — warmup engine (daily 08:00 MSK)
- `src/workers/warmup-send.worker.ts` — individual warmup emails
- `src/workers/imap-check.worker.ts` — inbox checker (every 2min)
- `src/workers/ai-generate.worker.ts` — AI personalization batch
- `src/workers/analytics-update.worker.ts` — metrics recalculation (every 10min)
- `src/queues/queue.module.ts` — BullMQ queue registration
- `src/queues/queue.constants.ts` — queue names, concurrency settings

**Commits:** `feat: background workers with BullMQ`

#### Task C: Frontend (React + Next.js) ⚡

Read and use as source:
- `docs/PRD.md` → features, user personas
- `docs/Architecture.md` → UI architecture, design tokens, component library

Generate:
- `frontend/package.json` — React 18, Next.js 14, Tailwind CSS, Zustand, React Query
- `frontend/tailwind.config.ts` — dark theme tokens from Architecture.md design system
- `frontend/src/app/layout.tsx` — root layout with GlobalSidebar
- `frontend/src/app/page.tsx` — dashboard
- `frontend/src/app/campaigns/page.tsx` — campaigns list
- `frontend/src/app/accounts/page.tsx` — email accounts
- `frontend/src/app/unibox/page.tsx` — unified inbox
- `frontend/src/app/analytics/page.tsx` — analytics dashboard
- `frontend/src/app/ai/page.tsx` — AI generator
- `frontend/src/app/settings/page.tsx` — settings
- `frontend/src/components/GlobalSidebar.tsx` — icon sidebar (w-16)
- `frontend/src/components/SecondarySidebar.tsx` — contextual menu (w-72)
- `frontend/src/components/TopBar.tsx` — balance, plan badge, org selector
- `frontend/src/components/DataTable.tsx` — sortable, filterable table
- `frontend/src/components/StatusBadge.tsx` — status indicators
- `frontend/src/components/EmptyState.tsx` — onboarding empty states
- `frontend/src/components/PromptInput.tsx` — AI generation input
- `frontend/src/components/WarmupHealthIndicator.tsx` — flame icon + progress
- `frontend/src/lib/api.ts` — API client (fetch + JWT cookies)
- `frontend/src/stores/auth.store.ts` — Zustand auth store
- `frontend/src/hooks/useAuth.ts`, `useCampaigns.ts`, `useAccounts.ts` — React Query hooks

**Commits:** `feat: frontend scaffolding with dark theme`

### Phase 3: Integration (sequential)

1. **Verify cross-package imports** (shared types, API contracts)
2. **Docker build:** `docker compose build`
3. **Start services:** `docker compose up -d`
4. **Database setup:**
   - `docker compose exec app npx prisma migrate dev --name init`
   - `docker compose exec app npx prisma db seed` (seed with demo user, sample campaign)
5. **Health check:** `curl http://localhost:3000/api/health`
6. **Run tests:** `npm run test` (Jest), `npm run test:e2e` (Supertest)
7. **Git commit:** `chore: verify docker integration`

### Phase 4: Finalize

1. Generate/update `README.md` with quick start instructions
2. Final git tag: `git tag v0.1.0-scaffold`
3. Report summary: files generated, services running, what needs manual attention

## Output

After /start completes:
```
coldmail-ru/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── api/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── utils/
│   ├── config/
│   ├── auth/
│   ├── accounts/
│   ├── campaigns/
│   ├── sequences/
│   ├── leads/
│   ├── warmup/
│   ├── email/
│   ├── ai/
│   ├── unibox/
│   ├── analytics/
│   ├── compliance/
│   ├── common/
│   ├── workers/
│   ├── queues/
│   ├── app.module.ts
│   └── main.ts
├── frontend/
│   ├── package.json
│   ├── tailwind.config.ts
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── stores/
│       └── hooks/
├── docs/
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Pseudocode.md
│   └── Completion.md
└── README.md
```

## Flags

- `--skip-tests` — skip test file generation (faster, not recommended)
- `--skip-seed` — skip database seeding
- `--dry-run` — show plan without executing

## Estimated Time

- With parallel tasks: ~15-25 minutes
- Files generated: ~80+
- Commits: ~8-10

## Error Recovery

If a task fails mid-generation:
- All completed phases are committed to git
- Re-run `/start` — it detects existing files and skips completed phases
- Or fix the issue manually and continue

## Swarm Agents Used

| Phase | Agents | Parallelism |
|-------|--------|-------------|
| Phase 1 | Main | Sequential |
| Phase 2 | 3 Task tools | Parallel |
| Phase 3 | Main | Sequential |
| Phase 4 | Main | Sequential |
