# INS-010: AmoCRM OAuth tokens expire — need auto-refresh

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Error Signature
- AmoCRM API returns 401 after token expires
- Sync fails silently if token refresh not handled

## Root Cause
AmoCRM OAuth2 access tokens have limited lifetime. Must implement auto-refresh before each API call.

## Solution
In `src/integrations/amocrm/amocrm.service.ts`:
- Store access_token, refresh_token, expires_at in AmoCrmIntegration model
- Before each API call: check if token expired, refresh if needed
- On refresh failure: mark integration as disconnected, notify user

## Prevention
- Always wrap AmoCRM API calls in try/catch with token refresh retry
- Add scheduled job to proactively refresh tokens before expiry
- Log all token refresh events for debugging
