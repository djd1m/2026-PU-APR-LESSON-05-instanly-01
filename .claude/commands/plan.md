---
description: Create a lightweight implementation plan for a task or feature.
  Saves plan to docs/plans/ with structured sections. Auto-committed via Stop hook.
  $ARGUMENTS: task name or brief description
---

# /plan $ARGUMENTS

## Purpose

Quick planning for tasks that don't need full SPARC lifecycle.
Creates a structured plan file that serves as implementation guide.

## Process

### Step 1: Analyze Task

1. Parse `$ARGUMENTS` to understand scope
2. Read relevant project docs for context:
   - `docs/Architecture.md` — tech stack, module structure (NestJS, React, PostgreSQL, Redis)
   - `docs/Pseudocode.md` — existing algorithms and API contracts
   - `CLAUDE.md` — project overview and conventions
3. Scan codebase for related files and modules
4. Assess complexity and dependencies

### Step 2: Create Plan File

**File path:** `docs/plans/YYYY-MM-DD-<task-slug>.md`

Generate with this structure:

```markdown
# Plan: <Task Name>

**Date:** YYYY-MM-DD
**Status:** Draft | In Progress | Done
**Estimated Effort:** S / M / L / XL

## Goal

[1-2 sentences: what this task achieves and why it matters for ColdMail.ru]

## Tasks

- [ ] Task 1 — description
- [ ] Task 2 — description
- [ ] Task 3 — description
- [ ] Task 4 — description

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/module/file.ts` | Create / Modify | Description |
| `prisma/schema.prisma` | Modify | Add/update model |
| `frontend/src/...` | Create | New component |

## Dependencies

- **Internal:** Which existing modules are affected (auth, campaigns, email, etc.)
- **External:** Any new packages needed (npm install ...)
- **Database:** Any Prisma migration required
- **Docker:** Any service changes in docker-compose.yml

## Risks

| Risk | Probability | Mitigation |
|------|-------------|------------|
| [Risk description] | Low/Med/High | [How to handle] |

## Notes

[Any additional context, edge cases, or implementation hints]
```

### Step 3: Save and Notify

1. Create `docs/plans/` directory if it doesn't exist
2. Write plan file
3. Notify:
```
Plan created: docs/plans/YYYY-MM-DD-<task-slug>.md
Tasks: N items
Files affected: N

Plan will be auto-committed on session end.
To implement now: read the plan and start coding.
For complex features, consider: /feature <name>
```

## Referencing Agents

For complex plans that need deeper analysis, reference the planner agent:
```
Read .claude/agents/planner.md for structured task decomposition
```

The planner agent can break down large tasks into parallelizable subtasks
and identify cross-module dependencies in the ColdMail.ru codebase.

## When to Use /plan vs /feature

| Scenario | Command | Reason |
|----------|---------|--------|
| Bug fix (5-20 lines) | `/plan` | Too small for SPARC |
| Config change | `/plan` | No new functionality |
| Refactoring | `/plan` | No new design needed |
| Minor enhancement | `/plan` | Low complexity |
| New feature | `/feature` | Full SPARC lifecycle |
| Complex integration | `/feature` | Needs validation |
