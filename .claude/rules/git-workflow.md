# Git Workflow: ColdMail.ru

## Branch Strategy

- `main` -- production-ready, deployed automatically via GitHub Actions
- `develop` -- integration branch for feature work (optional in MVP, use if team >1)
- `feat/{ticket}-{short-description}` -- feature branches
- `fix/{ticket}-{short-description}` -- bugfix branches
- `hotfix/{description}` -- urgent production fixes (branch from main, merge to main)

## Commit Message Format

```
<type>(<scope>): <subject>

<optional body>

<optional footer>
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature or capability (maps to MINOR version) |
| `fix` | Bug fix (maps to PATCH version) |
| `refactor` | Code restructuring without behavior change |
| `test` | Adding or updating tests only |
| `docs` | Documentation changes (SPARC docs, README, comments) |
| `chore` | Build, CI, dependencies, tooling, config |
| `perf` | Performance improvement without behavior change |
| `style` | Code formatting, whitespace, linting (no logic change) |

### Scopes (ColdMail modules)

| Scope | Covers |
|-------|--------|
| `auth` | Login, register, JWT, sessions |
| `accounts` | Email account CRUD, connection testing |
| `campaigns` | Campaign lifecycle, scheduling |
| `sequences` | Sequence steps, template rendering |
| `leads` | Lead management, CSV import |
| `warmup` | Warmup engine, peer selection |
| `email` | SMTP sending, IMAP checking, deliverability |
| `ai` | OpenAI integration, prompt management |
| `unibox` | Reply aggregation, thread management |
| `analytics` | Metrics, charts, reporting |
| `compliance` | 38-FZ checker, opt-out management |
| `ui` | Frontend components, layout, design tokens |
| `api` | REST API layer, DTOs, controllers |
| `db` | Prisma schema, migrations, indexes |
| `infra` | Docker, Nginx, CI/CD, monitoring |
| `common` | Shared utilities, encryption, logging |

### Examples

```
feat(campaigns): add daily sending limit per account
fix(warmup): handle Yandex 550 error with auto-pause
refactor(email): extract SMTP connection pool to shared service
test(leads): add CSV import edge case coverage
docs(api): update Swagger descriptions for campaign endpoints
chore(infra): upgrade Node.js base image to 20.12
perf(analytics): add composite index for campaign metrics query
```

### Rules

- Subject line: imperative mood, lowercase, no period, max 72 characters
- Body: wrap at 80 characters, explain WHY not WHAT
- Footer: reference issues (`Closes #123`, `Refs #456`)
- One logical change per commit -- do not mix features with refactors
- Never commit secrets, `.env` files, or credentials

## Pull Request Protocol

- PR title follows commit format: `feat(scope): description`
- PR body must include: Summary (what and why), Test Plan (how verified), Breaking Changes (if any)
- All PRs require passing CI (tests + lint) before merge
- Squash merge to main -- keeps history clean
- Delete branch after merge

## Pre-commit Checks

These run automatically on every commit:

1. `eslint` -- lint TypeScript/React code
2. `prettier` -- format check
3. `tsc --noEmit` -- type check
4. `jest --changedSince=HEAD~1` -- run tests for changed files

## Deployment Trigger

- Push to `main` triggers GitHub Actions pipeline:
  1. Run full test suite
  2. Build Docker images
  3. Push to private registry
  4. SSH deploy to VPS (`docker compose pull && docker compose up -d`)
  5. Health check -- rollback if failed
