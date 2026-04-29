# Architecture Decision Records (ADR)

---

## ADR-001: Distributed Monolith over Microservices

**Status:** Accepted
**Date:** 2026-04-29

**Context:** Need to choose architecture style for MVP. Team is small (2-3 devs), timeline is 3 months, budget is bootstrap.

**Decision:** Distributed Monolith — single NestJS application with clear module boundaries, deployed as Docker containers. Modules (auth, campaigns, email, warmup, ai) communicate in-process but have explicit interfaces.

**Rationale:**
- Microservices add operational complexity inappropriate for 2-3 person team
- Monolith allows fast iteration without inter-service communication overhead
- Clear module boundaries enable future extraction to microservices
- Docker Compose deployment is simpler than k8s for VPS

**Consequences:**
- Cannot independently scale modules (e.g., email worker vs API)
- Must discipline module boundaries to avoid tight coupling
- Migration to microservices possible later without rewrite

---

## ADR-002: PostgreSQL as Primary Database

**Status:** Accepted
**Date:** 2026-04-29

**Context:** Need ACID-compliant persistent storage with good JSON support, full-text search, and Russian hosting availability.

**Decision:** PostgreSQL 16

**Rationale:**
- ACID compliance for financial data (billing, quotas)
- JSONB for flexible lead custom fields
- Strong ecosystem: Prisma ORM, excellent tooling
- Available on all Russian VPS providers
- Full-text search (reduce need for Elasticsearch in MVP)
- Team familiarity (most common DB in Russian dev community)

**Consequences:**
- Need PgBouncer for connection pooling at scale
- Vertical scaling initially (not horizontally shardable without effort)
- Need regular VACUUM/ANALYZE for large tables (email_messages)

---

## ADR-003: BullMQ for Background Jobs

**Status:** Accepted
**Date:** 2026-04-29

**Context:** Email sending, warmup, IMAP checking, and AI generation are all background tasks that need queuing, retries, scheduling, and concurrency control.

**Decision:** BullMQ (Redis-backed queue for Node.js)

**Rationale:**
- Native Node.js/TypeScript support (same runtime as NestJS)
- Built-in: retries, delays, rate limiting, prioritization, cron jobs
- Redis is already needed for caching — no additional infra
- Dashboard available (Bull Board) for monitoring queues
- Battle-tested at scale (millions of jobs/day)

**Alternatives Considered:**
- RabbitMQ — heavier, separate service, overkill for MVP
- AWS SQS — not available on Russian VPS
- pg-boss (PostgreSQL-based) — less feature-rich, less performant

**Consequences:**
- Redis becomes a critical dependency (must be persistent)
- Job state stored in Redis (not PostgreSQL) — may lose jobs if Redis crashes without persistence
- Mitigation: Redis AOF persistence enabled

---

## ADR-004: NestJS over Express/Fastify

**Status:** Accepted
**Date:** 2026-04-29

**Context:** Need a structured backend framework that supports modular architecture, dependency injection, and TypeScript-first development.

**Decision:** NestJS 10

**Rationale:**
- Built-in modular architecture (matches our distributed monolith approach)
- Dependency injection → testable, loosely coupled modules
- TypeScript-first (type safety, better developer experience)
- Built-in support for: guards, interceptors, pipes (validation), BullMQ integration
- Large ecosystem of official modules (@nestjs/bull, @nestjs/passport, @nestjs/swagger)
- Good for teams — enforces structure vs "spaghetti Express"

**Consequences:**
- Steeper learning curve than plain Express
- More boilerplate for simple endpoints
- Larger bundle size (acceptable for backend)

---

## ADR-005: OpenAI GPT-4o-mini for AI Generation

**Status:** Accepted (revisit quarterly)
**Date:** 2026-04-29

**Context:** Need LLM for generating personalized B2B cold emails in Russian. Options: OpenAI, YandexGPT, local models.

**Decision:** OpenAI GPT-4o-mini as primary; template fallback if unavailable.

**Rationale:**
- Best quality for Russian B2B text generation (tested vs YandexGPT)
- Cost-effective: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- Low latency (3-7s per email)
- Accessible from Russian IPs (no sanctions on API access)
- Well-documented, stable API

**Alternatives Considered:**
- YandexGPT — lower quality for B2B copywriting, good for general text
- Claude API — excellent quality but higher cost
- Local model (Llama) — infrastructure complexity, lower quality
- GigaChat (Sber) — good Russian, but API less mature

**Consequences:**
- Dependency on foreign API (geopolitical risk)
- Mitigation: template fallback ensures product works without AI
- Plan: evaluate YandexGPT/GigaChat quarterly; add as alternative if quality improves
- Payments: API invoicing (not card-based), accessible for Russian entities

---

## ADR-006: Dark-First UI Design

**Status:** Accepted
**Date:** 2026-04-29

**Context:** UI/UX design direction. Target users are B2B power users (agencies, SDR teams) who use the tool daily.

**Decision:** Dark theme by default, with Instantly.ai design language as reference.

**Rationale:**
- Instantly.ai (our reference product) uses dark theme exclusively
- B2B SaaS power tools trend: dark themes (Linear, Vercel, Raycast)
- Reduces eye strain for daily users
- Professional aesthetic for outreach tool (trust signal)
- Tailwind CSS makes theming trivial

**Design Tokens:** Based on Instantly.ai UI analysis (23 screens):
- Background: #0f1014, panels: #15171c, borders: #2a2d34
- Primary: #2563eb, Success: #22c55e, Warning: #facc15

**Consequences:**
- Must ensure WCAG AA contrast ratios in dark mode
- Charts/graphs need dark-mode-optimized colors
- Light theme as "nice to have" for v1.0

---

## ADR-007: VPS Direct Deploy over Cloud PaaS

**Status:** Accepted
**Date:** 2026-04-29

**Context:** Need hosting that is: (1) in Russia (152-ФЗ), (2) affordable for bootstrap, (3) Docker-friendly.

**Decision:** Direct VPS deploy (AdminVPS/HOSTKEY) via Docker Compose.

**Rationale:**
- Russian data centers (152-ФЗ compliance) ✓
- Cost: ~3,000-8,000 ₽/мес for adequate specs vs 30,000+ for managed k8s
- Full control over infrastructure
- Docker Compose is simple and sufficient for MVP scale
- No vendor lock-in

**Alternatives Considered:**
- Yandex Cloud — good but expensive for bootstrap; use later for scale
- Selectel — good Russian cloud; consider for v1.0+
- Hetzner (Finland) — fast but NOT in Russia (152-ФЗ violation)
- Railway/Render — no Russian DCs, payment issues

**Consequences:**
- Manual ops (updates, security patches, backups)
- No auto-scaling (must size VPS for peak)
- Scaling requires manual intervention (add VPS, reconfigure)
- Mitigation: well-documented runbooks, monitoring alerts

---

## ADR-008: JWT in httpOnly Cookies over LocalStorage

**Status:** Accepted
**Date:** 2026-04-29

**Context:** Need to securely store authentication tokens in the browser.

**Decision:** JWT access tokens in httpOnly secure cookies; refresh tokens also in httpOnly cookies.

**Rationale:**
- httpOnly cookies are immune to XSS attacks (JavaScript cannot access)
- Secure flag ensures HTTPS-only transmission
- SameSite=Strict prevents CSRF
- No token storage in JavaScript (localStorage/sessionStorage vulnerable to XSS)
- Refresh token rotation adds layer of security

**Consequences:**
- Need CSRF protection for state-changing requests (double-submit cookie pattern)
- Cookies sent automatically (no manual header management)
- Cross-origin requests need proper CORS configuration
- Token refresh handled transparently by HTTP interceptor

---

## ADR-009: Resend as Alternative Email Provider

**Status:** Accepted
**Date:** 2026-04-29

**Context:** SMTP (Yandex/Mail.ru) is the primary sending method, but some users prefer API-based sending for simpler setup. Resend.com offers a clean REST API for transactional email.

**Decision:** Support both SMTP and Resend as email providers. User selects provider in Settings UI. Provider stored per-user in `UserSettings.email_provider` field.

**Rationale:**
- Resend is simpler to configure (API key only, no SMTP/IMAP setup)
- Some users don't need warmup (Resend handles deliverability)
- API-based sending is more reliable than SMTP (no connection drops)
- Resend API is simple REST — no npm package needed (native fetch)
- Provider selection is per-user, not system-wide

**Alternatives Considered:**
- SendGrid — more complex, heavier, enterprise-focused
- Mailgun — good but payment issues in Russia
- SMTP-only — limits flexibility for users without Yandex/Mail.ru

**Consequences:**
- Two code paths for email sending (SMTP vs Resend) — increased complexity
- Warmup only works with SMTP accounts (Resend doesn't need warmup)
- Resend API key stored encrypted in UserSettings
- External API dependency (Resend availability)
- No IMAP support for Resend — reply detection needs webhook or polling
