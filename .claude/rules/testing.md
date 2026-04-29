# Testing Rules: ColdMail.ru

## Coverage Targets

| Scope | Target | Enforced |
|-------|--------|----------|
| Core modules (auth, campaigns, email, warmup, leads, sequences) | 80% line coverage | Yes -- CI fails below threshold |
| AI module | 70% (external API dependency) | Yes |
| Analytics, unibox, compliance | 75% | Yes |
| Frontend components | 60% | No -- focus on integration/E2E |
| Overall project | 75% | Yes |

## Unit Tests

Framework: Jest + ts-jest

### What to Unit Test

- All service methods in every NestJS module
- Encryption/decryption of SMTP credentials (AES-256-GCM roundtrip)
- Template variable substitution with fallbacks (`{{first_name}}` -> "Ivan" or "коллега")
- CSV parsing: valid files, empty files, BOM handling, encoding errors, duplicate detection
- Warmup volume calculation and peer selection logic
- Email message building: headers, tracking pixel, click tracking links
- AI prompt construction and output validation (quality score, spam word detection)
- Campaign state transitions: draft -> active -> paused -> resumed -> completed
- Lead status transitions: new -> contacted -> replied -> bounced
- Rate limit counter logic
- Pagination (cursor-based) helpers

### Unit Test Rules

- Each test file lives in `__tests__/` within its module directory
- File naming: `{name}.spec.ts`
- Mock external dependencies (Prisma, Redis, OpenAI, Nodemailer) -- never hit real services
- Use `jest.spyOn()` for partial mocks, full mocks via `jest.mock()`
- Test both success and error paths
- Test edge cases from the Edge Cases Matrix (see Refinement.md): empty CSV, 100K+ rows, duplicate leads, all accounts at daily limit, SMTP connection drop, AI timeout
- No test should take longer than 5 seconds
- No test should depend on another test's state -- each test is isolated

### Module-Specific Test Counts (Minimum)

| Module | Min Tests | Critical Functions |
|--------|:---------:|-------------------|
| auth | 12 | register, login, refresh, password hash, token blacklist |
| accounts | 10 | connect, disconnect, encrypt/decrypt credentials, test connection |
| campaigns | 15 | create, start, pause, resume, complete, daily limit enforcement |
| sequences | 10 | render template, variable substitution, fallback values, delay calculation |
| warmup | 12 | calculate volume, peer selection, health check, degradation handling |
| email | 15 | build message, add tracking pixel, click tracking, bounce handling, retry logic |
| ai | 8 | build prompt, validate output, quality score, spam word filter, timeout fallback |
| leads | 12 | import CSV, dedup by email, status transitions, quota enforcement |
| analytics | 8 | aggregate metrics, calculate open/reply/bounce rates, time-series grouping |

## Integration Tests

Framework: Jest + Supertest + Testcontainers (PostgreSQL + Redis)

### Rules

- Use real PostgreSQL and Redis via Testcontainers -- no mocking the database
- Seed test data in `beforeAll`, clean up in `afterAll`
- Test full request-response cycles through the NestJS app
- Verify database state after mutations (check rows were created/updated)
- Test BullMQ job creation and processing end-to-end

### Required Integration Tests

| ID | Scenario | Validates |
|----|----------|-----------|
| IT-001 | Full campaign lifecycle | Create -> add leads -> start -> send queued -> reply detected -> complete |
| IT-002 | Account connection (Yandex mock) | Credentials encrypted, status set to "connected" |
| IT-003 | CSV import 1000 leads | All rows imported, fields mapped correctly, duplicates skipped |
| IT-004 | Warmup cycle execution | Warmup jobs created in BullMQ, volume calculated correctly |
| IT-005 | AI generation + validation | Prompt built, mock OpenAI returns email, quality score calculated |
| IT-006 | Bounce detection | Bounce email processed, lead marked bounced, sequence stopped |
| IT-007 | Reply detection | Reply matched to lead via Message-ID, unibox message created |
| IT-008 | Rate limiting | 101st request in 1 min returns 429 |

## E2E Tests

Framework: Playwright

### Rules

- Run against a full Docker Compose stack (app + postgres + redis)
- Use a dedicated test user account, created in seed script
- Test the critical user journeys, not every UI element
- Maximum 30 seconds per test (timeout)
- Run in CI on every PR to `main`

### Required E2E Tests

| ID | Journey |
|----|---------|
| E2E-001 | Register -> connect account -> start warmup |
| E2E-002 | Campaign wizard: create -> upload CSV -> configure sequence -> launch |
| E2E-003 | Unibox: read reply -> change status -> reply to lead |
| E2E-004 | AI generator: enter product -> select tone -> generate -> edit -> save |
| E2E-005 | Analytics: open dashboard -> filter by campaign -> verify metrics displayed |

## Performance Tests

Framework: k6 (load), custom scripts (throughput)

### Targets

| Test | Tool | Target |
|------|------|--------|
| API load | k6 | 100 RPS, p99 < 500ms |
| Email throughput | Custom | 10K emails/hour through BullMQ workers |
| CSV import | Custom | 50K rows processed in < 30s |
| Concurrent users | k6 | 50 concurrent sessions, zero errors |
| Database throughput | pgbench | 500 TPS |

### Performance Baselines (from Specification NFRs)

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| Page load (SPA) | 800ms | 1.5s | 3s |
| API: list campaigns | 100ms | 300ms | 500ms |
| API: queue email send | 50ms | 100ms | 200ms |
| AI email generation | 3s | 7s | 10s |
| CSV import (1000 rows) | 2s | 5s | 10s |

## Test Data

- Use factories (e.g., `createTestUser()`, `createTestCampaign()`) -- never hardcode test data inline
- Factories live in `test/factories/`
- Use `faker` for generating realistic test data (Russian locale where applicable)
- Sensitive test credentials go in `.env.test`, never committed

## CI Pipeline

1. Lint (`eslint`) -- fail fast
2. Type check (`tsc --noEmit`)
3. Unit tests (`jest --coverage`)
4. Integration tests (`jest --config jest.integration.config.ts`)
5. E2E tests (`playwright test`) -- only on PRs to main
6. Coverage report uploaded as PR comment
