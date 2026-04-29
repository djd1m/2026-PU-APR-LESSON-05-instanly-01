# Toolkit Harvest: ColdMail.ru
**Date:** 2026-04-29
**Mode:** QUICK
**Source:** coldmail-ru v1.0.0

## Extracted Artifacts

### ART-001: AES-256-GCM Encryption Service
**Category:** snippet
**Maturity:** Alpha
**Provenance:** coldmail-ru, `src/common/encryption.service.ts`
**Description:** Generic injectable service that encrypts/decrypts sensitive strings using AES-256-GCM with unique random IV per operation. Stores ciphertext as `iv:authTag:encrypted` in a single string field, making it database-friendly. Key derived via scrypt from a config secret.
**Reuse potential:** Any project storing third-party credentials, API keys, OAuth tokens, or secrets at rest in a database.
**Code/Template:**
```typescript
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyBuffer: Buffer;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get('ENCRYPTION_KEY');
    this.keyBuffer = crypto.scryptSync(key, 'app-salt', 32);
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.keyBuffer, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.keyBuffer, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

---

### ART-002: JWT httpOnly Cookie Auth with Refresh Tokens
**Category:** pattern
**Maturity:** Alpha
**Provenance:** coldmail-ru, `src/auth/auth.service.ts`, `.claude/rules/security.md`
**Description:** Authentication pattern using bcrypt password hashing (12 rounds), short-lived JWT access tokens (15min) and long-lived refresh tokens (7d), both delivered via httpOnly cookies. Includes structured error codes, password hash exclusion from responses, and token blacklisting on logout via Redis.
**Reuse potential:** Any web application requiring session-based auth without localStorage token storage.
**Code/Template:**
```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException({ code: 'EMAIL_EXISTS', message: 'Email already registered' });

    const password_hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({ data: { email: dto.email, password_hash, ...dto } });
    const tokens = this.generateTokens(user.id, user.email);
    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Email or password incorrect' });
    }
    const tokens = this.generateTokens(user.id, user.email);
    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, { secret: this.config.get('JWT_SECRET') });
      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException({ code: 'TOKEN_EXPIRED', message: 'Refresh token expired' });
    }
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      token: this.jwt.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwt.sign(payload, { expiresIn: '7d' }),
    };
  }
}
```

**Security checklist (companion rule):**
- Never store tokens in localStorage/sessionStorage
- Cookie flags: `httpOnly`, `secure`, `SameSite=Strict`
- On logout: blacklist token in Redis with TTL matching token expiry
- Lock account after 5 failed login attempts per 15-minute window

---

### ART-003: BullMQ Graduated Volume Processor
**Category:** pattern
**Maturity:** Alpha
**Provenance:** coldmail-ru, `src/workers/warmup.processor.ts`
**Description:** A BullMQ worker pattern that gradually increases job volume over time, mimicking natural human behavior. Uses a stepped formula based on days elapsed, schedules sub-jobs with random delays within a time window, and auto-promotes status once a success threshold is met. Applicable to any scenario requiring graduated ramp-up (rate limit warming, API quota scaling, notification volume).
**Reuse potential:** Email warmup, API rate limit warming, gradual feature rollout, load testing ramp-up.
**Code/Template:**
```typescript
/**
 * Graduated volume calculation.
 * Slowly increases daily throughput to avoid triggering rate limits or spam detection.
 *
 * @param daysActive - number of days since the process started
 * @returns target volume for the day
 */
function calculateGraduatedVolume(daysActive: number): number {
  if (daysActive <= 3) return 5;
  if (daysActive <= 7) return 5 + (daysActive - 3) * 3;   // 8..17
  if (daysActive <= 14) return 17 + (daysActive - 7) * 2;  // 19..31
  return Math.min(50, 17 + (daysActive - 7) * 2);          // cap at 50
}

/**
 * Random delay within a business-hours window (relative to now).
 */
function randomTimeDelayMs(startHour: number, endHour: number, tzOffsetHours: number): number {
  const now = new Date();
  const localHour = (now.getUTCHours() + tzOffsetHours) % 24;
  const hoursRemaining = Math.max(0, endHour - Math.max(localHour, startHour));
  return Math.floor(Math.random() * hoursRemaining * 60 * 60 * 1000);
}
```

**Completion check pattern:**
```typescript
if (daysActive >= GRADUATION_THRESHOLD) {
  const successRate = await measureSuccessRate(entityId);
  if (successRate >= TARGET_RATE) {
    await markGraduated(entityId, successRate);
  }
}
```

---

### ART-004: OpenAI Call with Timeout and Template Fallback
**Category:** pattern
**Maturity:** Alpha
**Provenance:** coldmail-ru, `src/ai/ai.service.ts`
**Description:** Wraps OpenAI API calls with an AbortController timeout, validates output against quality rules (length, forbidden words), retries once with a stricter prompt on validation failure, and falls back to a simple template variable renderer when the API is unavailable or output is unacceptable. Returns a quality score alongside the result.
**Reuse potential:** Any AI-augmented feature where you need graceful degradation: content generation, summarization, classification, chatbot responses.
**Code/Template:**
```typescript
private async callAI(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const completion = await this.openai.chat.completions.create(
      {
        model: AI_MODEL,
        temperature: AI_TEMPERATURE,
        max_tokens: AI_MAX_TOKENS,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      },
      { signal: controller.signal },
    );
    return completion.choices[0]?.message?.content?.trim() ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

// Fallback: simple mustache-style variable rendering
private renderVariables(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || ''),
    template,
  );
}
```

**Strategy:** call AI -> validate output -> retry with stricter prompt -> fall back to template. Always return a result, never leave the user empty-handed.

---

### ART-005: CSV Import with BOM Handling and i18n Column Mapping
**Category:** snippet
**Maturity:** Alpha
**Provenance:** coldmail-ru, `src/leads/csv-import.service.ts`
**Description:** A CSV import service that handles UTF-8 BOM (common in Excel exports), maps multilingual column headers (English, Russian, camelCase, snake_case variations) to canonical field names via a normalization map, routes unrecognized columns to a `custom_fields` bag, deduplicates within the file and against existing records, and returns structured import statistics.
**Reuse potential:** Any application accepting CSV uploads from non-technical users across multiple locales.
**Code/Template:**
```typescript
// Column normalization map -- extend per locale
const COLUMN_MAP: Record<string, string> = {
  email: 'email', e_mail: 'email', 'e-mail': 'email', email_address: 'email',
  first_name: 'first_name', firstname: 'first_name', first: 'first_name',
  last_name: 'last_name', lastname: 'last_name', last: 'last_name',
  company: 'company', company_name: 'company',
  title: 'title', job_title: 'title', position: 'title',
  // Add locale-specific aliases here
};

const KNOWN_FIELDS = new Set(Object.values(COLUMN_MAP));

function mapColumns(raw: Record<string, string>): MappedRecord {
  const result: Record<string, string> = {};
  const customFields: Record<string, string> = {};

  for (const [rawKey, value] of Object.entries(raw)) {
    const normalized = rawKey.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const canonical = COLUMN_MAP[normalized];
    if (canonical) {
      result[canonical] = value;
    } else {
      customFields[rawKey.trim()] = value;
    }
  }
  return { ...result, custom_fields: customFields };
}

// csv-parse options for robust parsing
const CSV_OPTIONS = {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true,            // handle UTF-8 BOM
  relaxColumnCount: true,
};
```

**Import stats pattern:**
```typescript
interface ImportStats {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
}
```

---

### ART-006: NestJS Module Scaffold Convention
**Category:** template
**Maturity:** Alpha
**Provenance:** coldmail-ru, `.claude/rules/coding-style.md`
**Description:** Standardized NestJS module directory structure: module definition, controller (REST endpoints with Swagger decorators), service (business logic), repository (Prisma wrapper), DTOs (create/update/response), domain entities, constants, and co-located tests. Enforces separation of concerns and consistent naming.
**Reuse potential:** Any NestJS project. Copy as a generator template or scaffolding script.
**Code/Template:**
```
src/{module}/
  {module}.module.ts          # NestJS module definition
  {module}.controller.ts      # REST endpoints, @ApiTags, @UseGuards
  {module}.service.ts          # Business logic, throws HttpExceptions
  {module}.repository.ts       # Data access layer (wraps ORM)
  dto/
    create-{entity}.dto.ts     # class-validator decorators
    update-{entity}.dto.ts
    {entity}-response.dto.ts   # Never return raw ORM models
  entities/
    {entity}.entity.ts         # Domain types (not ORM models)
  {module}.constants.ts        # UPPER_SNAKE_CASE constants
  __tests__/
    {module}.service.spec.ts
    {module}.controller.spec.ts
```

**Naming conventions:**
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Interfaces: `PascalCase`, no `I` prefix
- DTOs: `PascalCase` + `Dto` suffix
- Constants: `UPPER_SNAKE_CASE`
- DB columns: `snake_case`

---

### ART-007: Rate Limiting Configuration Table
**Category:** rule
**Maturity:** Alpha
**Provenance:** coldmail-ru, `.claude/rules/security.md`
**Description:** A structured rate limiting strategy with per-endpoint limits, windows, and actions. Counters stored in Redis with key pattern `ratelimit:{user_id}:{endpoint}`. Covers auth endpoints (strictest), AI/expensive operations (moderate), general API (relaxed), and a global per-IP fallback.
**Reuse potential:** Any API with tiered rate limiting needs. Adapt the table to your endpoints.
**Code/Template:**
```markdown
| Endpoint Category     | Limit | Window  | Action   |
|-----------------------|-------|---------|----------|
| Auth login            | 5     | 15 min  | Block IP |
| Auth register         | 3     | 1 hour  | Block IP |
| Expensive operations  | 30    | 1 min   | 429      |
| General API (per user)| 100   | 1 min   | 429      |
| Bulk import           | 5     | 1 hour  | 429      |
| Global per IP         | 1000  | 1 min   | 429      |
```

**Redis key pattern:** `ratelimit:{user_id}:{endpoint_group}`

---

### ART-008: BullMQ Worker Best Practices
**Category:** rule
**Maturity:** Alpha
**Provenance:** coldmail-ru, `.claude/rules/coding-style.md`, `src/workers/email-send.processor.ts`
**Description:** A set of rules for reliable BullMQ worker implementation: always set `removeOnComplete`/`removeOnFail` limits to prevent Redis memory bloat, configure `concurrency` per worker (not per queue), set `stalledInterval` and `maxStalledCount` to prevent duplicate processing, always catch errors and update job status before re-throwing, use exponential/fixed backoff with limited retry attempts, and mark final failure state on last attempt.
**Reuse potential:** Any Node.js project using BullMQ or similar Redis-backed job queues.
**Code/Template:**
```typescript
// Job options pattern
{
  attempts: 3,
  backoff: { type: 'fixed', delay: 60000 },
  removeOnComplete: 50,   // keep last 50 completed
  removeOnFail: 100,       // keep last 100 failed
}

// Worker processor: handle final failure
async process(job: Job<T>): Promise<void> {
  try {
    // ... do work
  } catch (error) {
    if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
      await this.markFinalFailure(job.data.id);
    }
    throw error; // re-throw to trigger BullMQ retry
  }
}
```

---

### ART-009: AI Output Validation and Scoring
**Category:** pattern
**Maturity:** Alpha
**Provenance:** coldmail-ru, `src/ai/ai.service.ts`
**Description:** A multi-criteria scoring function for AI-generated text. Starts from a base score and adjusts based on: word count within target range, absence of forbidden words, presence of desired elements (e.g., call-to-action phrases), and contextual relevance checks. Returns a bounded integer score (1-10). Combined with a validation gate that triggers retry-with-stricter-prompt before accepting output.
**Reuse potential:** Any AI content generation pipeline that needs quality gating -- marketing copy, support responses, report generation.
**Code/Template:**
```typescript
function validateOutput(text: string, config: ValidationConfig): boolean {
  if (containsForbiddenWords(text, config.forbiddenWords)) return false;
  const wordCount = countWords(text);
  if (wordCount < config.minWords || wordCount > config.maxWords) return false;
  if (text.length > config.maxLength) return false;
  return true;
}

function calculateQualityScore(text: string, criteria: ScoringCriteria): number {
  let score = 5; // base

  // Length quality
  const wordCount = countWords(text);
  if (wordCount >= criteria.optimalMinWords && wordCount <= criteria.optimalMaxWords) score += 2;
  else if (wordCount >= criteria.acceptableMinWords && wordCount <= criteria.acceptableMaxWords) score += 1;
  else score -= 1;

  // Forbidden words penalty
  if (!containsForbiddenWords(text, criteria.forbiddenWords)) score += 1;
  else score -= 2;

  // Desired elements bonus
  const hasDesiredElement = criteria.desiredPatterns.some(p => text.toLowerCase().includes(p));
  if (hasDesiredElement) score += 1;

  return Math.max(1, Math.min(10, Math.round(score)));
}
```

**Strategy:** generate -> validate -> retry once with stricter prompt -> accept or fall back to template.

---

### ART-010: Security Headers and Input Validation Checklist
**Category:** rule
**Maturity:** Alpha
**Provenance:** coldmail-ru, `.claude/rules/security.md`
**Description:** A comprehensive security configuration checklist covering: Nginx security headers (HSTS, CSP, X-Content-Type-Options, X-Frame-Options), global NestJS ValidationPipe settings, DTO whitelist enforcement, and injection prevention rules. Applicable as a starting security baseline for any web application.
**Reuse potential:** Any web application. Copy the Nginx block and ValidationPipe config as project boilerplate.
**Code/Template:**

**Nginx security headers:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

**NestJS global validation:**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

**Rules:**
- All DTOs use class-validator + class-transformer
- Prisma parameterized queries only -- never concatenate SQL
- React: never use `dangerouslySetInnerHTML` without DOMPurify
- Passwords: never log, never include in API responses

---

### ART-011: Email Send Worker with Encrypted Credentials
**Category:** pattern
**Maturity:** Alpha
**Provenance:** coldmail-ru, `src/workers/email-send.processor.ts`
**Description:** A BullMQ processor that sends emails via Nodemailer, decrypting stored SMTP credentials at the moment of connection (never cached in memory longer than needed). Includes tracking pixel injection, per-account daily send counter, and failure status tracking on final retry exhaustion. Credentials are decrypted only within the worker scope.
**Reuse potential:** Any transactional or bulk email system that stores SMTP credentials encrypted at rest.
**Code/Template:**
```typescript
async process(job: Job<EmailSendJobData>): Promise<void> {
  const { messageId, accountId, to, subject, body } = job.data;

  // 1. Fetch account
  const account = await this.repository.findAccount(accountId);

  // 2. Decrypt credentials at point of use
  const username = this.encryptionService.decrypt(account.smtpUsername);
  const password = this.encryptionService.decrypt(account.smtpPassword);

  // 3. Create transient transport
  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: { user: username, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  });

  // 4. Send with tracking
  const info = await transporter.sendMail({ from: account.email, to, subject, html: body });

  // 5. Update status
  await this.repository.markSent(messageId, info.messageId);
  await this.repository.incrementDailyCounter(accountId);
}
```

---

### ART-012: Dark Theme Design Token System
**Category:** template
**Maturity:** Alpha
**Provenance:** coldmail-ru, `.claude/rules/coding-style.md`
**Description:** A reusable dark-first design token system for Tailwind CSS projects. Defines background, border, and text color tokens, typography (Inter + system-ui fallback), spacing scale, and border radius conventions. Provides a consistent visual language without depending on a component library.
**Reuse potential:** Any React/Next.js project using Tailwind CSS with a dark theme requirement.
**Code/Template:**
```
Design Tokens (Tailwind utility classes):
  Background:  bg-[#0f1014]  (primary), bg-[#1a1d23] (card), bg-[#2a2d34] (elevated)
  Border:      border-[#2a2d34]
  Text:        text-[#e5e7eb] (primary), text-[#9ca3af] (secondary), text-white (emphasis)
  Font:        font-family: Inter, system-ui, sans-serif
  Radius:      rounded-xl (8px) for inputs/buttons, rounded-2xl (16px) for cards
  Spacing:     Tailwind scale (p-4, p-6, gap-3) -- avoid arbitrary values

Rules:
  - Use Tailwind utility classes directly, no CSS modules or styled-components
  - Extract repeated patterns into ui/ components, not @apply blocks
  - Functional components only, one per file
  - State: React Query for server state, Zustand for client state
```

---

## Summary

| ID | Name | Category | Reuse Scope |
|----|------|----------|-------------|
| ART-001 | AES-256-GCM Encryption Service | snippet | Any project storing secrets at rest |
| ART-002 | JWT httpOnly Cookie Auth | pattern | Any web app with session auth |
| ART-003 | BullMQ Graduated Volume Processor | pattern | Rate limit warming, rollouts |
| ART-004 | OpenAI Timeout + Fallback | pattern | Any AI-augmented feature |
| ART-005 | CSV Import with BOM + i18n Columns | snippet | Any multi-locale CSV import |
| ART-006 | NestJS Module Scaffold | template | Any NestJS project |
| ART-007 | Rate Limiting Config Table | rule | Any API with tiered limits |
| ART-008 | BullMQ Worker Best Practices | rule | Any BullMQ project |
| ART-009 | AI Output Validation + Scoring | pattern | Any AI content pipeline |
| ART-010 | Security Headers + Validation Checklist | rule | Any web application |
| ART-011 | Email Send Worker with Encrypted Creds | pattern | Any bulk/transactional email |
| ART-012 | Dark Theme Design Tokens | template | Any Tailwind CSS project |
