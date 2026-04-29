---
description: Run tests for the ColdMail.ru project. Supports full suite, scoped tests, and coverage reports.
  $ARGUMENTS: optional — scope (unit, e2e, integration, module-name) or "coverage"
---

# /test $ARGUMENTS

## Purpose

Run and manage tests for ColdMail.ru. Supports multiple test scopes
and generates coverage reports.

## Test Stack

| Tool | Purpose |
|------|---------|
| Jest | Unit tests, service tests |
| Supertest | API endpoint (e2e) tests |
| React Testing Library | Frontend component tests |
| Prisma (test DB) | Database integration tests |

## Commands

### /test (no arguments — run all)

Run the full test suite:

```bash
# 1. Unit tests
npm run test

# 2. E2E tests (requires running services)
npm run test:e2e

# 3. Frontend tests (if frontend/ exists)
cd frontend && npm run test
```

Report results:
```
Test Results:
   Unit: <passed>/<total> passed
   E2E: <passed>/<total> passed
   Frontend: <passed>/<total> passed
   Duration: <time>

Failed tests (if any):
   - <test-name>: <error-summary>
```

### /test [scope]

Run tests for a specific scope:

| Scope | Command | What It Tests |
|-------|---------|---------------|
| `unit` | `npm run test` | All unit tests |
| `e2e` | `npm run test:e2e` | API endpoint tests with Supertest |
| `integration` | `npm run test -- --testPathPattern=integration` | Database and service integration |
| `auth` | `npm run test -- --testPathPattern=auth` | Authentication module |
| `campaigns` | `npm run test -- --testPathPattern=campaigns` | Campaign management |
| `email` | `npm run test -- --testPathPattern=email` | Email sending, IMAP checking |
| `warmup` | `npm run test -- --testPathPattern=warmup` | Warmup engine |
| `ai` | `npm run test -- --testPathPattern=ai` | AI generation |
| `leads` | `npm run test -- --testPathPattern=leads` | Lead management, CSV import |
| `unibox` | `npm run test -- --testPathPattern=unibox` | Unified inbox |
| `analytics` | `npm run test -- --testPathPattern=analytics` | Metrics calculation |
| `workers` | `npm run test -- --testPathPattern=workers` | Background workers (BullMQ) |
| `frontend` | `cd frontend && npm run test` | React component tests |

Example: `/test warmup` runs only warmup-related tests.

### /test coverage

Generate coverage report:

```bash
npm run test -- --coverage --coverageReporters=text --coverageReporters=lcov
```

Display coverage summary:

```
Coverage Report:
   Statements: XX%
   Branches: XX%
   Functions: XX%
   Lines: XX%

Module Coverage:
   auth/          XX%
   campaigns/     XX%
   email/         XX%
   warmup/        XX%
   ai/            XX%
   leads/         XX%
   unibox/        XX%
   analytics/     XX%
   common/        XX%
   workers/       XX%

Low Coverage (< 60%):
   - src/warmup/warmup.service.ts — XX% (needs more edge case tests)
   - src/workers/imap-check.worker.ts — XX% (async IMAP mocking needed)

Coverage report saved to: coverage/lcov-report/index.html
```

## Test Strategy Reference

From project documentation, ColdMail.ru requires:

### Critical Test Paths (5 E2E journeys)
1. Registration → Login → JWT refresh cycle
2. Connect email account → Start warmup → Verify progress
3. Create campaign → Add leads (CSV) → Create sequence → Start campaign
4. Campaign sends email → Lead replies → Appears in Unibox
5. AI generate email → Personalize for lead → Quality check passes

### Unit Test Targets (102+)
- Auth: JWT generation/validation, bcrypt hashing, refresh rotation
- Accounts: SMTP/IMAP connection test, credential encryption/decryption
- Campaigns: State machine transitions (draft → active → paused → completed)
- Leads: CSV parsing, status transitions, deduplication
- Warmup: Volume calculation algorithm, peer selection, inbox rate measurement
- Email: Template rendering with variables, spam word detection
- AI: Prompt building, quality validation, fallback behavior
- Analytics: Metrics aggregation, rate calculations
- Workers: Queue job processing, retry logic, error handling
- Compliance: 38-FZ checker, opt-out management

### Integration Tests (8)
- Prisma + PostgreSQL: migration apply, seed, CRUD operations
- BullMQ + Redis: job enqueue, process, complete cycle
- Auth flow: register → login → access protected route → refresh
- Campaign lifecycle: create → add leads → start → pause → resume
- Email sending: mock SMTP → verify message format
- IMAP checking: mock IMAP → process reply → update lead status
- AI integration: mock OpenAI → generate → validate output
- Warmup cycle: schedule jobs → execute → measure inbox rate

## Pre-Test Setup

If tests need infrastructure:

```bash
# Start test dependencies
docker compose -f docker-compose.yml up -d postgres redis

# Apply migrations to test DB
DATABASE_URL=postgresql://coldmail:test@localhost:5432/coldmail_test npx prisma migrate deploy
```

## Continuous Testing

During development, run tests in watch mode:

```bash
npm run test:watch                    # Watch all
npm run test:watch -- --testPathPattern=warmup   # Watch specific module
```
