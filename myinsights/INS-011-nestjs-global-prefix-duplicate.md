# INS-011: NestJS global prefix duplicated in @Controller path

**Status:** Active
**Created:** 2026-04-29
**Hits:** 1

## Error Signature
- API returns 404 for endpoints that should exist
- Route resolves to `/api/v1/api/v1/settings` instead of `/api/v1/settings`

## Root Cause
`app.setGlobalPrefix('api/v1')` in main.ts adds the prefix to ALL controllers. If a controller also has `@Controller('api/v1/settings')`, the prefix is doubled.

## Solution
Controllers should use paths WITHOUT the global prefix:
- Wrong: `@Controller('api/v1/settings')`
- Correct: `@Controller('settings')`

## Prevention
- Never include 'api/v1' in @Controller() decorator when global prefix is set
- Add a lint rule or code review check for this pattern
- Test new endpoints immediately after creation
