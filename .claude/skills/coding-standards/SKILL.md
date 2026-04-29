---
name: coding-standards
description: >
  Coding conventions for ColdMail.ru: NestJS + TypeScript backend, React + Next.js frontend,
  Tailwind CSS dark theme styling. Covers module structure, naming patterns, import ordering,
  dependency injection patterns, and Tailwind design tokens derived from the Instantly UI reference.
  Use this skill when writing or reviewing code to ensure consistency.
version: "1.0"
maturity: production
---

# Coding Standards: ColdMail.ru

## TypeScript General

### Strict Mode
- `strict: true` in tsconfig.json — no implicit any, strict null checks
- Prefer `unknown` over `any`; if `any` is unavoidable, add `// eslint-disable-next-line` with justification
- Use type narrowing (type guards, discriminated unions) instead of type assertions

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files (backend) | kebab-case | `campaign.service.ts`, `email-account.controller.ts` |
| Files (frontend) | kebab-case for utils, PascalCase for components | `use-campaigns.ts`, `CampaignTable.tsx` |
| Classes | PascalCase | `CampaignService`, `EmailAccountController` |
| Interfaces | PascalCase, no `I` prefix | `CreateCampaignDto`, `EmailAccount` |
| Types | PascalCase | `SendingSchedule`, `CampaignStatus` |
| Enums | PascalCase members | `CampaignStatus.Active`, `WarmupStatus.InProgress` |
| Constants | UPPER_SNAKE_CASE | `MAX_DAILY_SEND_LIMIT`, `WARMUP_VOLUME_CURVE` |
| Functions | camelCase | `scheduleCampaignEmails`, `calculateWarmupVolume` |
| Variables | camelCase | `sentToday`, `inboxRate` |
| Database columns | snake_case (Prisma maps automatically) | `warmup_status`, `sent_today` |
| API endpoints | kebab-case, plural nouns | `/api/v1/email-accounts`, `/api/v1/campaigns` |
| BullMQ queues | colon-separated | `email:send`, `warmup:run`, `imap:check` |
| Redis keys | colon-separated with type prefix | `ratelimit:{user_id}:{endpoint}`, `account:{id}:sent_today` |

### Import Ordering

Group imports in this order, separated by blank lines:

```typescript
// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. NestJS / framework imports
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

// 3. Third-party libraries
import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';

// 4. Internal modules (absolute paths from src/)
import { EncryptionService } from '@/common/encryption.service';
import { EmailAccount } from '@/accounts/entities/email-account.entity';

// 5. Relative imports (same module)
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CampaignStatus } from './campaign.types';
```

Use path aliases: `@/` maps to `src/`.

## NestJS Backend Conventions

### Module Structure

Every NestJS module follows this file layout:

```
src/campaigns/
  campaigns.module.ts          # Module definition (imports, providers, exports, controllers)
  campaigns.controller.ts      # REST endpoints only — no business logic
  campaigns.service.ts         # Business logic — the "thick" layer
  campaigns.types.ts           # Types, enums, constants for this module
  dto/
    create-campaign.dto.ts     # Input validation (class-validator decorators)
    update-campaign.dto.ts
    campaign-response.dto.ts   # Output serialization
  entities/                    # Prisma-generated or domain entities (if needed beyond Prisma)
  processors/
    campaign-scheduler.processor.ts  # BullMQ job processors
  __tests__/
    campaigns.service.spec.ts
    campaigns.controller.spec.ts
```

### Dependency Injection Patterns

```typescript
// Always use constructor injection
@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    @InjectQueue('email:send') private readonly emailQueue: Queue,
  ) {}
}

// Use interfaces for cross-module dependencies
// Define in the providing module, import in consuming module
export interface IEmailSender {
  send(message: EmailMessage): Promise<SendResult>;
}

// Register with custom provider token
{ provide: 'IEmailSender', useClass: SmtpEmailSender }

// Inject with @Inject
constructor(@Inject('IEmailSender') private readonly emailSender: IEmailSender) {}
```

### Controller Patterns

```typescript
@Controller('api/v1/campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,          // Custom decorator for JWT user
    @Body() dto: CreateCampaignDto,
  ): Promise<ApiResponse<Campaign>> {
    const campaign = await this.campaignsService.create(user.id, dto);
    return { data: campaign };
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query() query: ListCampaignsDto,
  ): Promise<PaginatedResponse<Campaign>> {
    return this.campaignsService.findAll(user.id, query);
  }
}
```

### DTO Validation

```typescript
// Use class-validator + class-transformer
export class CreateCampaignDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsArray()
  @IsUUID('4', { each: true })
  sendingAccounts: string[];

  @ValidateNested()
  @Type(() => SendingScheduleDto)
  schedule: SendingScheduleDto;

  @IsInt()
  @Min(1)
  @Max(500)
  dailyLimit: number;
}
```

### Error Handling

```typescript
// Use NestJS built-in exceptions with custom error codes
throw new BadRequestException({
  code: 'CAMPAIGN_001',
  message: 'Назначьте email-аккаунты для кампании',
});

// For domain errors, create custom exceptions
export class AccountConnectionFailedException extends BadRequestException {
  constructor(provider: string, detail: string) {
    super({
      code: 'ACCOUNT_001',
      message: `Не удалось подключиться к ${provider}. ${detail}`,
    });
  }
}

// Global exception filter handles unknown errors
// Returns structured { error: { code, message } } format
```

### BullMQ Job Processors

```typescript
@Processor('email:send')
export class EmailSendProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailSendProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly encryptionService: EncryptionService,
  ) {
    super();
  }

  async process(job: Job<EmailSendJobData>): Promise<void> {
    this.logger.log({ msg: 'Processing email send', jobId: job.id, leadId: job.data.leadId });

    try {
      await this.emailService.sendEmail(job.data);
    } catch (error) {
      // BullMQ handles retries via job options
      this.logger.error({ msg: 'Email send failed', jobId: job.id, error: error.message });
      throw error; // Re-throw for BullMQ retry logic
    }
  }
}
```

## React Frontend Conventions

### Component Structure

```
src/
  app/                         # Next.js App Router pages
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      campaigns/page.tsx
      accounts/page.tsx
      unibox/page.tsx
      analytics/page.tsx
    layout.tsx
  components/
    ui/                        # Base UI components (Button, Input, Badge, Card, Modal)
    layout/                    # GlobalSidebar, SecondarySidebar, TopBar
    campaigns/                 # Campaign-specific components
    accounts/                  # Account-specific components
    shared/                    # DataTable, StatusBadge, EmptyState, WarmupHealthIndicator
  hooks/
    use-campaigns.ts           # React Query hooks per domain
    use-accounts.ts
    use-auth.ts
  lib/
    api.ts                     # Axios instance with interceptors
    constants.ts
    utils.ts
  stores/
    ui-store.ts                # Zustand stores for client-only state
  types/
    campaign.ts                # Shared TypeScript types
    account.ts
```

### Component Patterns

```tsx
// Functional components only, no class components
// Props interface defined above the component
interface CampaignTableProps {
  campaigns: Campaign[];
  isLoading: boolean;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
}

export function CampaignTable({ campaigns, isLoading, onStart, onPause }: CampaignTableProps) {
  if (isLoading) return <TableSkeleton rows={5} />;
  if (campaigns.length === 0) return <EmptyState title="Нет кампаний" cta="Создать кампанию" />;

  return (
    <DataTable
      columns={campaignColumns}
      data={campaigns}
      // ...
    />
  );
}
```

### React Query Hooks

```typescript
// One file per domain, exports query and mutation hooks
export function useCampaigns(params?: ListCampaignsParams) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => api.get<PaginatedResponse<Campaign>>('/api/v1/campaigns', { params }),
    staleTime: 30_000, // 30 seconds
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCampaignDto) => api.post('/api/v1/campaigns', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}
```

## Tailwind CSS Dark Theme

### Design Token Classes

All components use the Instantly-derived dark theme. Core token mappings:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f1014',
          secondary: '#15171c',
          tertiary: '#17191f',
          input: '#111318',
        },
        border: {
          default: '#2a2d34',
          hover: '#3a3d44',
        },
        brand: {
          DEFAULT: '#2563eb',
          hover: '#3b82f6',
        },
        text: {
          primary: '#e5e7eb',
          secondary: '#9ca3af',
          muted: '#8b949e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      width: {
        sidebar: '64px',
        'sidebar-secondary': '288px',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
};
```

### Component Class Patterns

| Component | Classes |
|---|---|
| Button.Primary | `rounded-xl px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white` |
| Button.Secondary | `rounded-xl px-4 py-2 font-semibold bg-white/10 hover:bg-white/15 text-gray-200` |
| Button.Gradient | `rounded-xl px-4 py-2 font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white` |
| Card | `rounded-2xl border border-[#2a2d34] bg-[#15171c] p-6` |
| Input | `bg-[#111318] border border-[#2a2d34] rounded-xl h-12 px-4 text-sm` |
| Badge.Success | `inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300` |
| Badge.Warning | `inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-300` |
| Badge.Error | `inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-300` |
| Table.Header | `uppercase text-xs text-[#8b949e] tracking-wider` |
| EmptyState | `flex min-h-[420px] flex-col items-center justify-center text-center text-slate-400` |

### Typography Scale

| Token | Size | Usage |
|---|---|---|
| text-xs | 11px | Badges, labels |
| text-sm | 13px | Table cells, secondary text |
| text-base | 14px | Body text, inputs |
| text-lg | 16px | Subheadings |
| text-xl | 20px | Section titles |
| text-2xl | 24px | Page titles |
| text-3xl | 28px | Hero numbers (analytics) |

## Prisma Conventions

```prisma
// Model names: PascalCase singular
model EmailAccount {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  email         String
  provider      Provider
  smtpHost      String   @map("smtp_host")
  // ...

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaigns     Campaign[]

  // Indexes
  @@index([userId, warmupStatus])
  @@map("email_accounts")  // Table name: snake_case plural
}

// Enums: PascalCase
enum Provider {
  yandex
  mailru
  custom
}
```

## Logging Standards (Pino)

```typescript
// Structured JSON logging with Pino
// Always include context fields
this.logger.log({
  msg: 'Email sent successfully',
  campaignId: job.data.campaignId,
  leadId: job.data.leadId,
  accountId: job.data.accountId,
  durationMs: Date.now() - startTime,
});

// NEVER log sensitive data
// Pino serializers must redact: password, smtp_password, token, refresh_token, cookie
```

## Git Conventions

- Branch naming: `feature/[short-description]`, `fix/[short-description]`, `chore/[short-description]`
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`)
- PR size: max 400 lines changed (split larger work)
