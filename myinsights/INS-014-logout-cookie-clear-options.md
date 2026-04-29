# INS-014: Logout must clear cookies with SAME options used when setting them

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Error Signature
- User clicks "Выйти" but stays logged in
- Cookies still present after logout response

## Root Cause
Browsers require `clearCookie()` to use the same options (httpOnly, secure, sameSite, path) as when the cookie was set. Mismatched options = cookie NOT cleared.

## Solution
```typescript
// Setting cookie:
res.cookie('access_token', token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });

// Clearing cookie — MUST match:
res.clearCookie('access_token', { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
```

## Prevention
- Extract cookie options to a shared constant
- Logout endpoint should NOT require auth guard (user might have expired token)
- Always test logout flow end-to-end
