# Development Guide: ColdMail.ru

## Quick Start

```bash
/start              # Bootstrap project from SPARC docs
```

## Feature Development

```bash
/next               # See sprint progress and next feature
/go <feature>       # Auto-select pipeline and implement
/feature <name>     # Full 4-phase lifecycle (PLAN→VALIDATE→IMPLEMENT→REVIEW)
/plan <task>        # Lightweight plan for small tasks
```

## Autonomous Build

```bash
/run                # Bootstrap + implement MVP features → tag v0.1.0-mvp
/run all            # Bootstrap + implement ALL features → tag v1.0.0
```

## Quality & Testing

```bash
/test               # Run all tests
/test coverage      # Run with coverage report
/test <scope>       # Run specific test scope
```

## Deployment

```bash
/deploy staging     # Deploy to staging
/deploy prod        # Deploy to production (with checklist)
```

## Documentation

```bash
/docs               # Generate docs (RU + EN) in README/
/docs rus           # Russian only
/docs eng           # English only
/docs update        # Update existing docs
```

## Knowledge Base

```bash
/myinsights         # Capture a development insight
/myinsights status  # Show insights statistics
```

## Command Hierarchy

```
/run mvp
  └── /start (bootstrap)
  └── LOOP:
      ├── /next (find next feature)
      └── /go <feature>
          ├── /plan (simple tasks, score ≤ -2)
          └── /feature (standard features, score > -2)
```

## Available Agents

| Agent | Purpose | Model |
|-------|---------|-------|
| `@planner` | Feature planning with algorithm templates | sonnet |
| `@code-reviewer` | Quality review (security, performance, edge cases) | sonnet |
| `@architect` | System design decisions | opus |

## Available Skills

| Skill | Purpose |
|-------|---------|
| `project-context` | RF cold email domain knowledge |
| `coding-standards` | NestJS/React/Tailwind conventions |
| `testing-patterns` | Jest/Supertest/Playwright strategies |
| `security-patterns` | AES-256-GCM, JWT, rate limiting |
| `feature-navigator` | Sprint progress and next-action suggestions |
| `sparc-prd-mini` | SPARC documentation generator |
| `requirements-validator` | INVEST/SMART validation |
| `brutal-honesty-review` | Code quality criticism |

## Project Structure

```
coldmail-ru/
├── CLAUDE.md                    # Project context (AI reads this first)
├── DEVELOPMENT_GUIDE.md         # This file
├── docs/                        # SPARC documentation
│   ├── PRD.md, Architecture.md, Specification.md, ...
│   ├── features/                # Per-feature SPARC docs
│   └── plans/                   # Implementation plans
├── .claude/
│   ├── commands/                # /start, /feature, /go, /run, /next, ...
│   ├── agents/                  # planner, code-reviewer, architect
│   ├── skills/                  # project-context, coding-standards, ...
│   ├── rules/                   # security, testing, git-workflow, ...
│   ├── hooks/                   # SessionStart context injection
│   ├── feature-roadmap.json     # Feature backlog with statuses
│   └── settings.json            # Hooks configuration
├── myinsights/                  # Development knowledge base
├── src/                         # Source code (after /start)
├── docker-compose.yml           # Infrastructure services
└── Dockerfile                   # Application container
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Next.js 14 + Tailwind CSS |
| Backend | NestJS 10 (Node.js 20) |
| Database | PostgreSQL 16 |
| Queue | Redis 7 + BullMQ |
| ORM | Prisma 5 |
| AI | OpenAI GPT-4o-mini |
| Deploy | Docker Compose on VPS (Russia) |

## Key Rules

- **152-ФЗ:** All data stored on Russian servers only
- **38-ФЗ:** Compliance checker warns about advertising content
- **Security:** SMTP credentials encrypted AES-256-GCM, JWT in httpOnly cookies
- **Git:** Semantic commits (`feat(scope): description`), commit after each logical change
- **Testing:** 80% coverage for core modules, always run tests before push
