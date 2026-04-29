# INS-006: NestJS route order matters for param vs static paths

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Error Signature
- GET /warmup/pool/stats returns 404 or tries to find account with id "pool"
- Static routes shadowed by parameterized routes

## Root Cause
NestJS matches routes in declaration order. If `@Get(':accountId')` is declared before `@Get('pool/stats')`, the string "pool" is captured as accountId parameter.

## Solution
In `src/warmup/warmup.controller.ts`:
- Declare static routes BEFORE parameterized routes
- `@Get('pool/stats')` MUST come before `@Get(':accountId/status')`

## Prevention
- Always put static path routes above parameterized routes in controllers
- This applies to all NestJS controllers, not just warmup
- Test edge cases: routes with both static and param segments
