# ColdMail.ru

AI-платформа для автоматизации B2B cold email outreach в России.

## Features

- **AI Email Generation** — персонализированные письма на русском через GPT-4o-mini
- **Warmup Engine** — автоматический прогрев для Yandex/Mail.ru
- **Email Sequences** — цепочки follow-up писем (3-5 шагов)
- **Unified Inbox** — все ответы в одном месте
- **Analytics** — sent/opened/replied/bounced метрики
- **152-ФЗ Compliance** — серверы в РФ, данные не покидают страну

## Quick Start

```bash
# Bootstrap project
/start

# Implement features
/run
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Next.js 14 + Tailwind CSS |
| Backend | NestJS 10 (Node.js 20) |
| Database | PostgreSQL 16 + Prisma 5 |
| Queue | Redis 7 + BullMQ |
| AI | OpenAI GPT-4o-mini |
| Deploy | Docker Compose on VPS (Russia) |

## Documentation

- `docs/` — SPARC documentation (PRD, Architecture, Specification, etc.)
- `CLAUDE.md` — Project context for AI assistants
- `DEVELOPMENT_GUIDE.md` — Development workflow and commands

## Commands

| Command | Purpose |
|---------|---------|
| `/start` | Bootstrap project |
| `/feature <name>` | Full feature lifecycle |
| `/go <feature>` | Auto-select pipeline |
| `/run` | Autonomous MVP build |
| `/next` | Sprint progress |
| `/test` | Run tests |
| `/deploy <env>` | Deploy |
| `/docs` | Generate documentation |

## Next Steps

See [nextsteps.md](nextsteps.md) for the full roadmap:
- **v1.1** — Production readiness (CI/CD, tests, SSL, monitoring)
- **v1.2** — Product enhancement (AI improvements, deliverability, UX)
- **v2.0** — Growth features (lead database, multichannel, enterprise)
- **v3.0** — Scale (Kubernetes, ML, CIS expansion)

## License

Private / Proprietary
