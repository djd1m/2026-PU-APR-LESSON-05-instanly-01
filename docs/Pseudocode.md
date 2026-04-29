# Pseudocode: ColdMail.ru

**Date:** 2026-04-29
**Purpose:** Algorithms, data structures, API contracts, state transitions

---

## Data Structures

### User

```
type User = {
  id: UUID
  email: string (unique)
  password_hash: string (bcrypt)
  first_name: string
  last_name: string
  company_name: string?
  plan: "free" | "growth" | "pro" | "agency"
  created_at: Timestamp
  updated_at: Timestamp
}
```

### EmailAccount

```
type EmailAccount = {
  id: UUID
  user_id: UUID (FK → User)
  email: string
  provider: "yandex" | "mailru" | "custom"
  smtp_host: string
  smtp_port: integer
  smtp_username: string (encrypted)
  smtp_password: string (encrypted AES-256)
  imap_host: string
  imap_port: integer
  status: "connected" | "error" | "disconnected"
  warmup_status: "not_started" | "in_progress" | "ready" | "paused"
  warmup_started_at: Timestamp?
  health_score: integer (0-100)
  daily_send_limit: integer (default: 50)
  sent_today: integer
  created_at: Timestamp
}
```

### Campaign

```
type Campaign = {
  id: UUID
  user_id: UUID (FK → User)
  name: string
  status: "draft" | "active" | "paused" | "completed"
  sending_accounts: UUID[] (FK → EmailAccount)
  schedule: SendingSchedule
  daily_limit: integer
  total_leads: integer
  sent_count: integer
  opened_count: integer
  replied_count: integer
  bounced_count: integer
  created_at: Timestamp
  started_at: Timestamp?
  completed_at: Timestamp?
}

type SendingSchedule = {
  timezone: string (default: "Europe/Moscow")
  start_hour: integer (0-23)
  end_hour: integer (0-23)
  days: string[] (["mon","tue","wed","thu","fri"])
  max_per_day: integer
}
```

### Lead

```
type Lead = {
  id: UUID
  user_id: UUID (FK → User)
  campaign_id: UUID? (FK → Campaign)
  email: string
  first_name: string?
  last_name: string?
  company: string?
  title: string?
  industry: string?
  custom_fields: JSON
  status: "new" | "contacted" | "replied" | "interested" | "meeting_booked" | "won" | "not_interested" | "bounced"
  current_step: integer (position in sequence)
  next_send_at: Timestamp?
  created_at: Timestamp
}
```

### Sequence

```
type Sequence = {
  id: UUID
  campaign_id: UUID (FK → Campaign)
  steps: SequenceStep[]
}

type SequenceStep = {
  order: integer (1-5)
  subject: string (supports {{variables}})
  body: string (HTML, supports {{variables}})
  delay_days: integer (from previous step)
  ai_personalize: boolean
}
```

### EmailMessage

```
type EmailMessage = {
  id: UUID
  campaign_id: UUID
  lead_id: UUID
  account_id: UUID (sender)
  step_order: integer
  subject: string (rendered)
  body: string (rendered HTML)
  status: "queued" | "sent" | "delivered" | "opened" | "replied" | "bounced" | "spam"
  sent_at: Timestamp?
  opened_at: Timestamp?
  replied_at: Timestamp?
  message_id: string? (SMTP Message-ID header)
  created_at: Timestamp
}
```

### WarmupJob

```
type WarmupJob = {
  id: UUID
  account_id: UUID (FK → EmailAccount)
  type: "send" | "receive" | "reply" | "mark_not_spam"
  target_email: string
  status: "pending" | "completed" | "failed"
  scheduled_at: Timestamp
  completed_at: Timestamp?
}
```

---

## Core Algorithms

### Algorithm: Campaign Email Scheduler

```
INPUT: campaign_id
OUTPUT: queued EmailMessage records

FUNCTION scheduleCampaignEmails(campaign_id):
  campaign = getCampaign(campaign_id)
  IF campaign.status != "active": RETURN

  accounts = campaign.sending_accounts
  schedule = campaign.schedule
  now = currentTime(schedule.timezone)

  // Check if within sending window
  IF now.hour < schedule.start_hour OR now.hour >= schedule.end_hour: RETURN
  IF now.dayOfWeek NOT IN schedule.days: RETURN

  // Get leads ready to send
  leads = getLeadsReadyToSend(campaign_id, now)

  // Calculate available capacity per account
  FOR EACH account IN accounts:
    remaining = account.daily_send_limit - account.sent_today
    IF remaining <= 0: CONTINUE
    IF account.warmup_status != "ready" AND account.warmup_status != "in_progress": CONTINUE

    // Assign leads to this account
    batch = leads.take(remaining)
    FOR EACH lead IN batch:
      step = getNextStep(campaign.sequence, lead.current_step)
      IF step IS NULL:
        markLeadCompleted(lead)
        CONTINUE

      body = renderTemplate(step.body, lead)
      IF step.ai_personalize:
        body = aiPersonalize(body, lead)

      createEmailMessage({
        campaign_id, lead_id: lead.id, account_id: account.id,
        step_order: step.order, subject: renderTemplate(step.subject, lead),
        body: body, status: "queued"
      })

      updateLead(lead, { current_step: step.order, next_send_at: NULL })

    leads = leads.skip(batch.length)
    IF leads.isEmpty(): BREAK

  RETURN count of queued messages

COMPLEXITY: O(leads × accounts)
RUNS: Every 5 minutes via cron job
```

### Algorithm: Warmup Engine

```
INPUT: account_id
OUTPUT: warmup jobs scheduled

FUNCTION runWarmupCycle(account_id):
  account = getEmailAccount(account_id)
  IF account.warmup_status != "in_progress": RETURN

  days_active = daysSince(account.warmup_started_at)

  // Gradual volume increase (mimics human behavior)
  target_volume = calculateWarmupVolume(days_active)
  // Day 1-3: 5 emails/day
  // Day 4-7: 10-15 emails/day
  // Day 8-14: 20-30 emails/day
  // Day 15-21: 30-50 emails/day

  // Select warmup peers from pool
  peers = selectWarmupPeers(account.provider, target_volume)

  FOR EACH peer IN peers:
    // Schedule send
    send_time = randomTimeInWindow(9, 18, "Europe/Moscow")
    createWarmupJob({ account_id, type: "send", target_email: peer.email, scheduled_at: send_time })

    // Schedule reply from peer (after delay)
    reply_delay = random(10min, 4hours)
    createWarmupJob({ account_id: peer.id, type: "reply", target_email: account.email, scheduled_at: send_time + reply_delay })

    // Occasionally mark as not-spam (if landed in spam)
    IF random() < 0.3:
      createWarmupJob({ account_id: peer.id, type: "mark_not_spam", target_email: account.email, scheduled_at: send_time + reply_delay + random(5min, 30min) })

  // Check if warmup complete
  IF days_active >= 14:
    inbox_rate = measureInboxRate(account_id)
    IF inbox_rate >= 0.85:
      updateAccount(account_id, { warmup_status: "ready", health_score: inbox_rate * 100 })
      notifyUser(account.user_id, "Account ready for campaigns")

FUNCTION calculateWarmupVolume(days):
  IF days <= 3: RETURN 5
  IF days <= 7: RETURN 5 + (days - 3) * 3  // 8, 11, 14, 17
  IF days <= 14: RETURN 17 + (days - 7) * 2  // 19, 21, 23...
  RETURN min(50, 17 + (days - 7) * 2)

RUNS: Daily at 8:00 Moscow time
```

### Algorithm: AI Email Personalization

```
INPUT: template (string), lead (Lead), product_context (string)
OUTPUT: personalized email body (string)

FUNCTION aiPersonalize(template, lead, product_context):
  // Build context for LLM
  prompt = buildPersonalizationPrompt(template, lead, product_context)

  // Call AI API with timeout
  TRY:
    response = callAI(prompt, {
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 500,
      timeout: 10s
    })

    personalized = response.text

    // Quality check
    IF containsSpamWords(personalized): RETURN template  // fallback
    IF length(personalized) > 2000: RETURN template      // too long
    IF NOT containsUnsubscribe(personalized):
      personalized += defaultUnsubscribeBlock()

    RETURN personalized

  CATCH timeout/error:
    log.warn("AI personalization failed, using template", { lead_id: lead.id })
    RETURN renderVariables(template, lead)  // fallback to simple variable substitution

FUNCTION buildPersonalizationPrompt(template, lead, context):
  RETURN """
    Ты — копирайтер B2B-продаж. Персонализируй email для получателя.

    Продукт: {context}
    Получатель: {lead.first_name} {lead.last_name}, {lead.title} в {lead.company} ({lead.industry})
    Шаблон письма: {template}

    Правила:
    - Напиши уникальное вступление (1-2 предложения), упоминающее компанию или роль получателя
    - Сохрани основной оффер из шаблона
    - Тон: деловой, но дружелюбный
    - Длина: 80-150 слов
    - Язык: русский
    - НЕ используй: спам-слова, обещания гарантий, caps lock
  """
```

### Algorithm: Bounce & Reply Detection

```
INPUT: email_account (EmailAccount)
OUTPUT: processed replies and bounces

FUNCTION checkInbox(account_id):
  account = getEmailAccount(account_id)

  // Connect IMAP
  imap = connectIMAP(account.imap_host, account.imap_port, decrypt(account.imap_username), decrypt(account.imap_password))

  // Fetch new messages since last check
  messages = imap.fetchSince(account.last_checked_at)

  FOR EACH msg IN messages:
    // Match to sent message via In-Reply-To header or References
    original = findOriginalMessage(msg.headers["In-Reply-To"], msg.headers["References"])

    IF original IS NULL:
      // Not a reply to our campaign email — skip or store as misc
      CONTINUE

    lead = getLead(original.lead_id)
    campaign = getCampaign(original.campaign_id)

    // Detect bounce (auto-reply from mailer-daemon)
    IF isBounce(msg):
      updateLead(lead, { status: "bounced" })
      updateEmailMessage(original, { status: "bounced" })
      incrementCampaignCounter(campaign.id, "bounced_count")
      // Remove lead from future sends
      cancelPendingEmails(lead.id)
      CONTINUE

    // Detect out-of-office
    IF isOutOfOffice(msg):
      // Don't count as reply, reschedule next step +3 days
      rescheduleNextStep(lead, 3)
      CONTINUE

    // It's a real reply
    updateLead(lead, { status: "replied" })
    updateEmailMessage(original, { status: "replied", replied_at: msg.date })
    incrementCampaignCounter(campaign.id, "replied_count")

    // Stop sequence for this lead
    cancelPendingEmails(lead.id)

    // Store in Unibox
    createUniboxMessage({
      user_id: account.user_id,
      lead_id: lead.id,
      campaign_id: campaign.id,
      account_id: account.id,
      from_email: msg.from,
      subject: msg.subject,
      body: msg.textBody,
      received_at: msg.date
    })

  updateAccount(account_id, { last_checked_at: now() })
  imap.disconnect()

RUNS: Every 2 minutes per active account
```

---

## API Contracts

### Authentication

```
POST /api/v1/auth/register
Request: { email: string, password: string, first_name: string, last_name: string }
Response (201): { user: User, token: string, refresh_token: string }
Response (409): { error: { code: "EMAIL_EXISTS", message: "Email already registered" } }

POST /api/v1/auth/login
Request: { email: string, password: string }
Response (200): { user: User, token: string, refresh_token: string }
Response (401): { error: { code: "INVALID_CREDENTIALS", message: "Email or password incorrect" } }

POST /api/v1/auth/refresh
Request: { refresh_token: string }
Response (200): { token: string, refresh_token: string }
Response (401): { error: { code: "TOKEN_EXPIRED", message: "Refresh token expired" } }
```

### Email Accounts

```
GET /api/v1/accounts
Response (200): { data: EmailAccount[], meta: { total: number } }

POST /api/v1/accounts
Request: { email: string, provider: string, smtp_host: string, smtp_port: number, smtp_username: string, smtp_password: string, imap_host: string, imap_port: number }
Response (201): { data: EmailAccount }
Response (400): { error: { code: "CONNECTION_FAILED", message: "..." } }

POST /api/v1/accounts/:id/warmup/start
Response (200): { data: EmailAccount }  // warmup_status = "in_progress"

POST /api/v1/accounts/:id/warmup/stop
Response (200): { data: EmailAccount }  // warmup_status = "paused"

DELETE /api/v1/accounts/:id
Response (204): {}
```

### Campaigns

```
GET /api/v1/campaigns
Query: { status?: string, page?: number, limit?: number }
Response (200): { data: Campaign[], meta: { total, page, limit } }

POST /api/v1/campaigns
Request: { name: string, sending_accounts: UUID[], schedule: SendingSchedule, daily_limit: number }
Response (201): { data: Campaign }

POST /api/v1/campaigns/:id/leads
Request: { leads: Lead[] } OR multipart/form-data (CSV file)
Response (201): { data: { imported: number, duplicates: number, errors: number } }

POST /api/v1/campaigns/:id/sequence
Request: { steps: SequenceStep[] }
Response (201): { data: Sequence }

POST /api/v1/campaigns/:id/start
Response (200): { data: Campaign }  // status = "active"

POST /api/v1/campaigns/:id/pause
Response (200): { data: Campaign }  // status = "paused"

POST /api/v1/campaigns/:id/resume
Response (200): { data: Campaign }  // status = "active"
```

### AI Generation

```
POST /api/v1/ai/generate-email
Request: { product_description: string, target_audience: string, tone: "formal"|"casual"|"friendly", language: "ru" }
Response (200): { data: { subject: string, body: string, ai_score: number } }
Response (429): { error: { code: "AI_LIMIT_REACHED", message: "..." } }

POST /api/v1/ai/personalize
Request: { template: string, lead: { first_name, company, title, industry }, product_context: string }
Response (200): { data: { personalized_body: string, ai_score: number } }
```

### Unibox

```
GET /api/v1/unibox
Query: { status?: string, campaign_id?: UUID, page?: number }
Response (200): { data: UniboxMessage[], meta: { total, unread } }

POST /api/v1/unibox/:id/reply
Request: { body: string }
Response (200): { data: UniboxMessage }

PATCH /api/v1/unibox/:id/status
Request: { status: "interested"|"not_interested"|"meeting_booked"|"won" }
Response (200): { data: UniboxMessage }
```

### Analytics

```
GET /api/v1/analytics
Query: { campaign_id?: UUID, date_from?: string, date_to?: string }
Response (200): {
  data: {
    totals: { sent, opened, replied, bounced },
    rates: { open_rate, reply_rate, bounce_rate },
    daily: [{ date, sent, opened, replied }]
  }
}

GET /api/v1/analytics/accounts
Response (200): { data: [{ account_id, email, sent, bounced, health_score, warmup_status }] }
```

---

## State Transitions

### Campaign State Machine

```
[draft] → start → [active]
[active] → pause → [paused]
[paused] → resume → [active]
[active] → all_leads_done → [completed]
[active] → error_threshold → [paused] (auto)
```

### Lead State Machine

```
[new] → first_email_sent → [contacted]
[contacted] → reply_received → [replied]
[replied] → user_marks → [interested] | [not_interested]
[interested] → user_marks → [meeting_booked]
[meeting_booked] → user_marks → [won]
[contacted] → bounce_detected → [bounced]
[new|contacted] → campaign_completed → [completed_no_reply]
```

### EmailAccount Warmup State Machine

```
[not_started] → start_warmup → [in_progress]
[in_progress] → inbox_rate >= 85% → [ready]
[in_progress] → user_pauses → [paused]
[ready] → health_degrades → [in_progress] (auto-recover)
[paused] → user_resumes → [in_progress]
```

---

## Error Handling Strategy

| Error Code | HTTP | Trigger | User Message | System Action |
|------------|------|---------|--------------|---------------|
| AUTH_001 | 401 | Invalid credentials | "Неверный email или пароль" | Log attempt |
| AUTH_002 | 429 | Rate limited (5 attempts) | "Слишком много попыток. Подождите 15 минут" | Block IP temp |
| ACCOUNT_001 | 400 | SMTP connection failed | "Не удалось подключиться. Проверьте настройки" | Log error |
| ACCOUNT_002 | 400 | IMAP connection failed | "IMAP-подключение не удалось" | Log error |
| CAMPAIGN_001 | 400 | No accounts assigned | "Назначьте email-аккаунты для кампании" | Block start |
| CAMPAIGN_002 | 400 | No leads in campaign | "Добавьте лидов перед запуском" | Block start |
| AI_001 | 503 | AI API timeout | "AI-сервис временно недоступен. Попробуйте позже" | Use template fallback |
| AI_002 | 429 | AI quota exceeded | "Лимит AI-генерации исчерпан. Обновите план" | Block generation |
| WARMUP_001 | 500 | Warmup network error | "Ошибка warmup. Повторим автоматически" | Retry in 1 hour |
| SEND_001 | 500 | SMTP send failed | (internal) | Retry 3x, then mark failed |
| SEND_002 | — | Bounce rate > 5% | "Аккаунт приостановлен: высокий bounce rate" | Auto-pause account |
