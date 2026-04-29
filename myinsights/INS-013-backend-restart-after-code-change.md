# INS-013: Backend must be restarted after code changes (ts-node transpile-only)

**Status:** Active
**Created:** 2026-04-29
**Hits:** 1

## Error Signature
- New endpoint returns 404 "Cannot POST /api/v1/..."
- Code is correct, route exists in controller
- NestJS logs don't show the new route being mapped

## Root Cause
Using `ts-node --transpile-only` in dev mode does NOT auto-reload on file changes. After adding new controllers, services, or routes, the running process uses stale compiled code.

## Solution
Kill and restart the process after code changes:
```bash
kill $(lsof -t -i:4000) && sleep 2
npx ts-node --transpile-only src/main.ts
```

Verify new routes in startup logs: look for `Mapped {/api/v1/new-route, POST}`.

## Prevention
- Use `nest start --watch` for auto-reload in development
- Or use `nodemon` with ts-node for file watching
- After any code deployment: always restart the process
- Check NestJS startup logs for expected routes before testing
