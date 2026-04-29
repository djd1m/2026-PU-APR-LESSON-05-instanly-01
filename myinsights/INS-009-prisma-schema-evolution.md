# INS-009: Prisma schema must evolve incrementally with features

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Error Signature
- New feature needs models not in schema → runtime errors
- Schema changes after initial migration require careful migration management

## Root Cause
Starting with 11 models in initial schema, then adding 5 more (AmoCRM, AbTest, Workspace) mid-development. Each schema change needs a new Prisma migration.

## Solution
- Add new models to schema.prisma before implementing the feature
- Run `npx prisma migrate dev --name <feature-name>` after each schema change
- Never modify existing columns in production — always add new ones

## Prevention
- Check schema completeness during /feature Phase 1 (PLAN)
- Include schema changes in implementation plan
- Test migrations on staging before production deploy
