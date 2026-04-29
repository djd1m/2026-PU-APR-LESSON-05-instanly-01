# INS-004: JWT httpOnly cookies need CSRF double-submit pattern

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Error Signature
- POST/PUT/DELETE requests fail with 403 from malicious cross-origin sites
- Or: no CSRF protection means cross-site state-changing requests succeed

## Root Cause
httpOnly cookies are sent automatically by browser for all requests to the domain. Without CSRF protection, a malicious site can make state-changing requests using the victim's cookies.

## Solution
ADR-008 decision: JWT in httpOnly cookies with SameSite=Strict.
- `SameSite=Strict` prevents cookies from being sent on cross-origin requests
- Additional layer: double-submit cookie pattern for non-GET requests
- Implemented in `src/auth/auth.controller.ts` → cookie options

## Prevention
- Always set `sameSite: 'strict'` on auth cookies
- Never use `sameSite: 'none'` unless required for cross-domain SSO
- Test CSRF protection in E2E tests (see docs/test-scenarios.md)
