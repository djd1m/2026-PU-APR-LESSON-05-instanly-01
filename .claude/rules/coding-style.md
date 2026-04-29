# Coding Style: ColdMail.ru

## Language and Runtime

- TypeScript strict mode (`strict: true` in tsconfig) everywhere -- backend and frontend
- Node.js 20 LTS, target ES2022
- No `any` type. Use `unknown` + type guards when type is genuinely unknown
- Prefer `interface` over `type` for object shapes. Use `type` for unions and intersections

## NestJS Backend Conventions

### Module Structure

```
src/
  {module}/
    {module}.module.ts        # NestJS module definition
    {module}.controller.ts    # REST endpoints
    {module}.service.ts       # Business logic
    {module}.repository.ts    # Data access (wraps Prisma)
    dto/
      create-{entity}.dto.ts  # Input validation DTOs
      update-{entity}.dto.ts
      {entity}-response.dto.ts
    entities/
      {entity}.entity.ts      # Domain types (not Prisma models)
    {module}.constants.ts     # Module-specific constants
    __tests__/
      {module}.service.spec.ts
      {module}.controller.spec.ts
```

### Naming

- Files: `kebab-case.ts` (e.g., `email-account.service.ts`)
- Classes: `PascalCase` (e.g., `EmailAccountService`)
- Interfaces: `PascalCase`, no `I` prefix (e.g., `EmailAccount`, not `IEmailAccount`)
- DTOs: `PascalCase` ending with `Dto` (e.g., `CreateCampaignDto`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_DAILY_EMAILS`)
- Functions and methods: `camelCase`
- Database tables/columns: `snake_case` (Prisma maps automatically)
- Env vars: `UPPER_SNAKE_CASE`

### Controllers

- Use decorators: `@Get()`, `@Post()`, `@Patch()`, `@Delete()`
- Always apply `@ApiTags()` for Swagger grouping
- Return DTOs, never raw Prisma models -- map in service layer
- Use `@HttpCode()` explicitly for non-200 responses
- Use `@UseGuards(JwtAuthGuard)` at controller level, `@Public()` for exceptions

### Services

- One service per module, inject dependencies via constructor
- Business logic lives here, not in controllers
- Throw `HttpException` subclasses (e.g., `NotFoundException`, `ConflictException`)
- Use `@Injectable()` on every service

### Validation

- class-validator decorators on all DTO properties
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Zod schemas on frontend for form validation (mirror backend DTOs)

### Error Handling

- Use NestJS exception filters -- never return raw errors
- Structured error response: `{ statusCode, message, error, timestamp }`
- Log errors with Pino logger: include `requestId`, `userId`, `module`
- Never expose stack traces in production

### Database (Prisma)

- All queries go through repository classes, never call Prisma directly from services
- Use transactions for multi-table writes: `prisma.$transaction()`
- Cursor-based pagination for large collections (leads, messages)
- Always select only needed fields -- avoid `SELECT *`

## React / Next.js Frontend Conventions

### File Structure

```
src/
  app/                    # Next.js App Router pages
    (auth)/               # Auth layout group
    (dashboard)/          # Main app layout group
  components/
    ui/                   # Reusable primitives (Button, Input, Badge, Card)
    layout/               # GlobalSidebar, SecondarySidebar, TopBar
    {feature}/            # Feature-specific components
  hooks/                  # Custom hooks (useAuth, useCampaigns)
  lib/                    # Utilities, API client, constants
  stores/                 # Zustand stores
  types/                  # Shared TypeScript types
```

### Components

- Functional components only, no class components
- One component per file, filename matches component name
- Props interface defined above component: `interface ButtonProps { ... }`
- Use `React.memo()` only when profiling shows re-render issues
- Destructure props in function signature

### State Management

- Server state: React Query (`@tanstack/react-query`) -- never store API data in Zustand
- Client state: Zustand stores (UI state, filters, selections)
- Form state: React Hook Form + Zod resolver
- No prop drilling beyond 2 levels -- use context or Zustand

### Styling (Tailwind CSS)

- Dark theme by default using project design tokens (see Architecture.md)
- Use Tailwind utility classes directly -- no CSS modules, no styled-components
- Extract repeated patterns into `ui/` components, not `@apply` blocks
- Color tokens: `bg-[#0f1014]`, `border-[#2a2d34]`, `text-[#e5e7eb]`
- Font: Inter, system-ui fallback
- Spacing: use Tailwind scale (p-4, p-6, gap-3), not arbitrary values when possible
- Border radius: `rounded-xl` (8px) for inputs/buttons, `rounded-2xl` (16px) for cards

## Known Gotchas

### Yandex/Mail.ru SMTP

- Yandex limits: ~50 emails/day per account for new accounts, increases after warmup
- Mail.ru requires app passwords, not account passwords
- Both providers require TLS on port 465 (SSL) or 587 (STARTTLS) -- never plain text
- Yandex may return 550 errors for suspected spam -- must auto-pause and increase warmup
- Always set proper `Message-ID`, `References`, `In-Reply-To` headers for threading

### BullMQ Workers

- Always set `removeOnComplete` and `removeOnFail` with limits to prevent Redis memory bloat
- Use `concurrency` option per worker, not per queue
- Stalled jobs: set `stalledInterval` and `maxStalledCount` to prevent duplicate sends
- Never throw unhandled errors in worker processors -- always catch and update job status

### Prisma

- `@updatedAt` only triggers on Prisma client calls, not raw SQL
- BigInt fields require special JSON serialization handling
- Connection pool default is 10 -- increase for production, use PgBouncer for >100

### JWT in httpOnly Cookies

- Frontend cannot read the token -- use a `/auth/me` endpoint to check auth status
- CSRF protection: use `SameSite=Strict` or `SameSite=Lax` + CSRF token
- Cookie domain must match API domain -- plan subdomain strategy early

### CSV Import

- Always handle BOM (byte order mark) in UTF-8 files from Excel
- Normalize line endings (CRLF to LF)
- Validate encoding before processing -- reject non-UTF-8
- Stream large files, never load entirely into memory

### OpenAI API

- gpt-4o-mini for cost-effective generation -- do not default to gpt-4o
- Set timeout to 10s, fallback to template if API is unavailable
- Never send lead email addresses to OpenAI -- only first name + company name
- Rate limit AI requests: 30/min per user to control costs
