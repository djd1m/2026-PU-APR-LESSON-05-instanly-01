# Secrets Management: ColdMail.ru

## Core Principle

No secret, credential, API key, or password may ever appear in source code, commit history, logs, or API responses. All secrets are provided via environment variables at runtime.

## Environment Variables

### Required Secrets

| Variable | Purpose | Example Format |
|----------|---------|----------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/coldmail` |
| `REDIS_URL` | Redis connection string | `redis://:password@host:6379` |
| `JWT_SECRET` | JWT signing key (min 256 bits) | Random 64-char hex string |
| `JWT_REFRESH_SECRET` | Refresh token signing key | Random 64-char hex string |
| `SMTP_ENCRYPTION_KEY` | AES-256 key for encrypting SMTP/IMAP credentials | Random 32-byte hex string (64 chars) |
| `OPENAI_API_KEY` | OpenAI API access | `sk-...` |
| `SESSION_SECRET` | Express session secret (if used) | Random 64-char string |

### Optional Secrets

| Variable | Purpose | Default |
|----------|---------|---------|
| `SENTRY_DSN` | Error tracking | None (disabled) |
| `GRAFANA_ADMIN_PASSWORD` | Grafana dashboard access | `admin` (change in production) |
| `REGISTRY_PASSWORD` | Docker registry auth | None |

## .env File Management

### File Hierarchy

```
.env.example      # Committed -- template with placeholder values, no real secrets
.env              # NOT committed -- local development secrets
.env.test         # NOT committed -- test environment secrets
.env.production   # NEVER exists in repo -- production secrets live on VPS only
```

### .gitignore (mandatory entries)

```
.env
.env.*
!.env.example
```

### .env.example Format

```bash
# Database
DATABASE_URL=postgresql://coldmail:changeme@localhost:5432/coldmail

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=replace-with-64-char-random-hex
JWT_REFRESH_SECRET=replace-with-64-char-random-hex

# Encryption
SMTP_ENCRYPTION_KEY=replace-with-64-char-random-hex

# OpenAI
OPENAI_API_KEY=sk-replace-with-real-key

# App
NODE_ENV=development
PORT=3000
```

Every new env var MUST be added to `.env.example` with a placeholder value and a comment explaining its purpose.

## OpenAI API Key Handling

- Store `OPENAI_API_KEY` in environment variable only
- Access via NestJS `ConfigService`: `this.configService.get('OPENAI_API_KEY')`
- Never pass the API key to the frontend -- all AI calls go through the backend
- Never log the API key -- Pino logger must have a redaction list that includes `OPENAI_API_KEY`
- Set spending limits in the OpenAI dashboard as a safety net
- If the key is compromised: rotate immediately in OpenAI dashboard, update on VPS, redeploy

## SMTP/IMAP Credential Encryption

### Encryption Flow

```
User enters SMTP password
  -> Backend receives password in HTTPS request
  -> EncryptionService.encrypt(password) using AES-256-GCM
  -> Store { ciphertext, iv, authTag } in PostgreSQL
  -> Original password is never stored
```

### Decryption Flow

```
Email Send Worker picks job from queue
  -> Load encrypted credentials from PostgreSQL
  -> EncryptionService.decrypt({ ciphertext, iv, authTag })
  -> Use decrypted password for SMTP/IMAP connection
  -> Password exists in memory only during connection
  -> Connection closes -> password garbage collected
```

### Implementation Rules

- Encryption key (`SMTP_ENCRYPTION_KEY`) must be exactly 32 bytes (64 hex chars)
- Generate a unique random IV (12 bytes) for every encryption operation
- Store IV and authTag alongside ciphertext in the database (separate columns or JSON field)
- Never reuse an IV with the same key
- Implementation lives in `src/common/encryption.service.ts`
- Unit tests must verify: encrypt -> decrypt roundtrip, different IVs for same plaintext, tampered ciphertext fails decryption

## Log Redaction

Configure Pino logger to redact sensitive fields:

```typescript
const logger = pino({
  redact: [
    'password',
    'smtp_password',
    'imap_password',
    'access_token',
    'refresh_token',
    'authorization',
    'cookie',
    'OPENAI_API_KEY',
    'SMTP_ENCRYPTION_KEY',
    'JWT_SECRET',
    'req.headers.authorization',
    'req.headers.cookie',
  ],
});
```

## Docker Secrets in Production

On the VPS, secrets are provided via:

1. **Docker Compose env_file**: `.env` file on the VPS (not in the repo)
2. **Docker secrets** (optional, for enhanced security): mount as files in `/run/secrets/`

```yaml
# docker-compose.yml
services:
  app:
    env_file:
      - .env
    # Or using Docker secrets:
    # secrets:
    #   - jwt_secret
    #   - smtp_encryption_key
```

## Secret Rotation Procedure

1. Generate new secret value
2. Update on VPS (`.env` file or Docker secret)
3. Restart affected containers: `docker compose restart app worker-email worker-warmup worker-imap worker-ai`
4. For `JWT_SECRET` rotation: existing tokens become invalid -- users must re-login
5. For `SMTP_ENCRYPTION_KEY` rotation: requires re-encrypting all stored credentials (run migration script)
6. For `OPENAI_API_KEY` rotation: revoke old key in OpenAI dashboard after new key is deployed

## Pre-commit Checks

The pre-commit hook should scan for potential secret leaks:

- Reject commits containing strings matching: `sk-`, `-----BEGIN`, base64 strings > 40 chars in non-test files
- Use `git-secrets` or equivalent tool
- Scan only staged files, not the entire repo
