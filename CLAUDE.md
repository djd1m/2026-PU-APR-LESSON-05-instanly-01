# Project: ColdMail.ru

## Overview

ColdMail.ru — AI-платформа для автоматизации B2B cold email outreach в России. Объединяет AI-генерацию персонализированных писем, warmup для Yandex/Mail.ru, email sequences и аналитику. Полное соответствие 152-ФЗ, серверы в РФ, оплата в рублях.

## Problem & Solution

Западные инструменты (Instantly.ai, Lemlist) недоступны из-за санкций. Российских аналогов почти нет (только Coldy.ai и Respondo). ColdMail.ru заполняет этот вакуум: AI-first подход + warmup для российских email-провайдеров + compliance by design.

## Architecture

Distributed Monolith (Monorepo), Docker Compose на VPS в России.

```
Frontend (React/Next.js) → Nginx → NestJS API → PostgreSQL + Redis
                                      ↓
                              BullMQ Workers:
                              - email:send
                              - warmup:run
                              - imap:check
                              - ai:generate
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Next.js 14, Tailwind CSS |
| Backend | NestJS 10, Node.js 20 |
| Database | PostgreSQL 16, Prisma 5 |
| Queue | Redis 7, BullMQ |
| AI | OpenAI GPT-4o-mini |
| Deploy | Docker Compose, Nginx, AdminVPS/HOSTKEY |

## Key Algorithms

- `scheduleCampaignEmails(campaign_id)` — batch scheduler, runs every 5min
- `runWarmupCycle(account_id)` — gradual volume increase, peer pool
- `aiPersonalize(template, lead, context)` — GPT prompt + quality check + fallback
- `checkInbox(account_id)` — IMAP poll, reply/bounce detection

## Security Rules

- SMTP/IMAP credentials: AES-256-GCM encrypted at rest
- Auth: JWT in httpOnly cookies (15min access + 7d refresh)
- All PII on Russian servers only (152-ФЗ)
- Rate limiting on all endpoints (see `.claude/rules/security.md`)
- OpenAI API key: server-side only, never exposed to client

## Parallel Execution Strategy

- Use `Task` tool for independent subtasks within features
- Run tests, linting, type-checking in parallel
- For complex features: spawn @planner + @architect agents concurrently
- Email sending workers: 5 concurrent, warmup: 3 concurrent

## Swarm Agents

Validation swarm (5 agents) for /feature Phase 2:
- validator-stories, validator-acceptance, validator-architecture
- validator-pseudocode, validator-coherence

Review swarm (5 agents) for /feature Phase 4:
- code-quality, architecture, security, performance, testing

## Git Workflow

- Format: `type(scope): description`
- Types: feat, fix, refactor, test, docs, chore
- Scopes: auth, accounts, warmup, campaigns, email, ai, unibox, analytics, compliance, frontend
- Commit after each logical change, push after each phase

## Available Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| @planner | sonnet | Feature planning with algorithm templates |
| @code-reviewer | sonnet | Quality review (security, perf, edge cases) |
| @architect | opus | System design decisions |

## Available Skills

| Skill | Purpose |
|-------|---------|
| project-context | RF cold email domain knowledge |
| coding-standards | NestJS/React/Tailwind conventions |
| testing-patterns | Jest/Supertest/Playwright |
| security-patterns | Encryption, JWT, rate limiting |
| feature-navigator | Sprint progress tracker |
| sparc-prd-mini | SPARC documentation generator |
| requirements-validator | INVEST/SMART validation |
| brutal-honesty-review | Unvarnished code criticism |

## Quick Commands

| Command | Purpose |
|---------|---------|
| `/start` | Bootstrap project from SPARC docs |
| `/feature <name>` | Full 4-phase feature lifecycle |
| `/go <feature>` | Auto-select pipeline and implement |
| `/run` | Autonomous MVP build loop |
| `/run all` | Build all features |
| `/next` | Sprint progress + next feature |
| `/plan <task>` | Lightweight implementation plan |
| `/test` | Run tests |
| `/deploy <env>` | Deploy to staging/prod |
| `/docs` | Generate bilingual documentation |
| `/myinsights` | Capture development insight |

## Development Insights

Knowledge base at `myinsights/`. Error-First Lookup: always grep `myinsights/1nsights.md` before debugging an issue — the solution may already exist.

## Feature Development Lifecycle

```
/feature <name>
  Phase 1: PLAN     → sparc-prd-mini → docs/features/<name>/sparc/
  Phase 2: VALIDATE → 5 validator agents → score ≥70 required
  Phase 3: IMPLEMENT → parallel Tasks from validated docs
  Phase 4: REVIEW   → brutal-honesty-review → fix criticals
```

## Feature Roadmap

See `.claude/feature-roadmap.json` for full backlog (15 features, MoSCoW priorities).
Current: 0/15 done, 4 next (auth, accounts, leads, UI shell).

## Automation Commands

- `/go [feature]` — auto-select pipeline (/plan, /feature) and implement
- `/run` or `/run mvp` — bootstrap + implement all MVP features in loop
- `/run all` — bootstrap + implement ALL features
- `/docs` — generate bilingual documentation (RU/EN) in /README/

## Resources

- SPARC docs: `docs/`
- UI Reference: `docs/instantly_ui_reference/` (23 screens)
- Design tokens: `docs/Architecture.md` → UI Architecture section
- BDD scenarios: `docs/test-scenarios.md`
