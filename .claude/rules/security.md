# Security Rules: ColdMail.ru

## Authentication

- Passwords: bcrypt with 12 salt rounds, minimum 8 characters, complexity check (uppercase + lowercase + digit)
- JWT access tokens: 15-minute expiry, stored in httpOnly cookies only
- JWT refresh tokens: 7-day expiry, httpOnly cookies, rotate on each refresh
- Never store tokens in localStorage or sessionStorage
- On logout: blacklist token in Redis (`auth:blacklist:{token_id}`, TTL 15 min)
- Failed login: lock after 5 attempts per 15-minute window, block by IP

## Authorization

- Two roles only (MVP): `owner` (full access) and `member` (no billing/settings)
- Every API endpoint MUST have a `@Roles()` or `@Public()` decorator -- no unprotected routes
- Resource ownership: always verify `user_id` or `workspace_id` before returning data
- Never trust client-supplied IDs for authorization -- always resolve from JWT

## SMTP/IMAP Credential Encryption

- Encrypt all SMTP/IMAP passwords with AES-256-GCM before storing in PostgreSQL
- Encryption key loaded from `SMTP_ENCRYPTION_KEY` env var -- never hardcoded
- Decrypt only at the moment of SMTP/IMAP connection in workers -- never return decrypted credentials to the API response
- Use unique IV per encryption operation, store IV alongside ciphertext
- Implementation: `src/common/encryption.service.ts`

## Rate Limiting

| Endpoint | Limit | Window | Action |
|----------|-------|--------|--------|
| `POST /auth/login` | 5 | 15 min | Block IP |
| `POST /auth/register` | 3 | 1 hour | Block IP |
| `POST /ai/*` | 30 | 1 min | 429 |
| `GET /api/*` | 100 | 1 min per user | 429 |
| `POST /campaigns/*/leads` | 5 | 1 hour | 429 |
| Global per IP | 1000 | 1 min | 429 |

Rate limit counters stored in Redis: `ratelimit:{user_id}:{endpoint}`.

## Input Validation

- All DTOs use `class-validator` + `class-transformer` with `whitelist: true` and `forbidNonWhitelisted: true`
- Email addresses: RFC 5322 regex + MX record lookup
- Campaign names: max 200 chars, HTML-escaped
- Email body HTML: sanitize with DOMPurify, allowlist safe tags only
- CSV uploads: max 10 MB, UTF-8 only, strip BOM, reject files with 0 data rows
- API parameters: Zod schema validation on frontend, class-validator on backend
- URLs (tracking links): valid URL format, encode special characters
- Passwords: never log, never include in API responses, never return in error messages

## XSS and Injection Prevention

- Global `ValidationPipe` with transform enabled on NestJS app
- Prisma parameterized queries -- never concatenate SQL strings
- React auto-escapes JSX -- never use `dangerouslySetInnerHTML` without DOMPurify
- Content-Security-Policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`

## Security Headers (Nginx)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 152-FZ Compliance (Russian Data Localization)

- ALL servers MUST be physically located in Russia (AdminVPS Moscow / HOSTKEY SPb)
- All PII (user emails, lead names, lead emails, company names) stored in PostgreSQL on Russian VPS only
- Never send PII to external services except: OpenAI API (for AI generation -- only lead first name + company, no email addresses)
- Data retention: delete all user data within 30 days of account deletion request (soft delete with 30-day grace period)
- Terms of Service must include data processing consent per 152-FZ requirements

## 38-FZ Advertising Law Compliance

- Every outgoing campaign email MUST include an unsubscribe link (configurable text)
- Sender identification required: company name + contact info in account settings
- Compliance checker module warns if email content resembles regulated advertising
- Auto-remove hard-bounced emails -- never resend to them

## Audit Logging

Log these events to the `audit_log` table with user_id, IP, user_agent, timestamp:

| Event | Retention |
|-------|-----------|
| `user.login` (success/fail) | 90 days |
| `user.password_change` | 1 year |
| `account.connected` / `account.disconnected` | 1 year |
| `campaign.started` / `campaign.paused` | 1 year |
| `data.exported` | 1 year |
| `data.deleted` | 1 year |

## TLS

- TLS 1.3 for all client-server communication (terminated at Nginx)
- TLS for all SMTP/IMAP connections to email providers
- TLS for Redis and PostgreSQL connections within the Docker network (if on separate servers)
