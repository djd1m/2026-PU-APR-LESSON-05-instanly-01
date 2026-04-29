# ColdMail.ru -- User and Admin Flows

## User Flow Overview

The primary user journey follows five stages: register, connect email, warm up, launch campaign, and handle replies.

```mermaid
graph LR
    A["Register"] --> B["Connect Email"]
    B --> C["Warmup"]
    C --> D["Launch Campaign"]
    D --> E["Handle Replies"]
    E --> D
```

---

## Flow 1: User Registration

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant API as NestJS API
    participant DB as PostgreSQL

    User->>Browser: Navigate to /register
    Browser->>API: POST /auth/register {email, password, first_name, last_name}
    API->>API: Validate input (Zod schema)
    API->>DB: Check if email exists
    alt Email already registered
        API-->>Browser: 409 Conflict
        Browser-->>User: Show "Email already in use" error
    else New email
        API->>API: Hash password (bcrypt, 12 rounds)
        API->>DB: INSERT User (plan: free)
        API->>API: Generate JWT + Refresh token
        API-->>Browser: 201 Created + Set httpOnly cookies
        Browser-->>User: Redirect to Dashboard
    end
```

### Post-Registration State

- Plan: Free (1 account, 50 emails/day, 20 AI credits)
- Dashboard shows empty state with onboarding prompts
- Guided tour suggests connecting the first email account

---

## Flow 2: Connect Email Account

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant API as NestJS API
    participant SMTP as Email Provider
    participant IMAP as Email Provider
    participant DB as PostgreSQL

    User->>Browser: Click "Add Account", select Yandex
    Browser-->>User: Show connection form (auto-filled SMTP/IMAP settings)
    User->>Browser: Enter email + app password
    Browser->>API: POST /accounts {email, provider, smtp_*, imap_*, password}

    API->>API: Encrypt password (AES-256-GCM)
    API->>SMTP: Test SMTP connection (send test)
    alt SMTP fails
        API-->>Browser: 400 "SMTP connection failed"
        Browser-->>User: Show error with troubleshooting tips
    else SMTP OK
        API->>IMAP: Test IMAP connection (list folders)
        alt IMAP fails
            API-->>Browser: 400 "IMAP connection failed"
        else IMAP OK
            API->>DB: INSERT EmailAccount (status: connected, warmup: not_started)
            API-->>Browser: 201 Created
            Browser-->>User: Show success, suggest starting warmup
        end
    end
```

---

## Flow 3: Email Warmup

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant API as NestJS API
    participant Queue as Redis (BullMQ)
    participant Worker as warmup:run Worker
    participant SMTP as Yandex/Mail.ru
    participant DB as PostgreSQL

    User->>Browser: Click "Start Warmup" on account
    Browser->>API: POST /warmup/:accountId/start
    API->>DB: UPDATE EmailAccount (warmup_status: in_progress)
    API-->>Browser: 200 OK

    Note over Worker: Daily at 08:00 MSK
    Worker->>DB: Find accounts with warmup_status = in_progress
    Worker->>Worker: Calculate daily volume (ramp up schedule)
    Worker->>Worker: Select peer accounts for warmup exchange

    loop For each warmup interaction
        Worker->>Queue: Push warmup:send job
        Queue->>Worker: Pick warmup:send job
        Worker->>DB: Decrypt SMTP credentials
        Worker->>SMTP: Send warmup email
        Worker->>DB: CREATE WarmupJob (type: send, status: completed)
    end

    Note over Worker: Peer accounts process received warmup emails
    Worker->>SMTP: Open warmup email (via IMAP)
    Worker->>SMTP: Mark as "Not Spam" if in spam folder
    Worker->>SMTP: Reply to warmup email
    Worker->>DB: CREATE WarmupJob (type: reply/mark_not_spam)

    Note over Worker: After 14-21 days
    Worker->>DB: Check inbox rate metrics
    alt Inbox rate >= 85%
        Worker->>DB: UPDATE EmailAccount (warmup_status: ready)
    else Inbox rate < 85%
        Worker->>Worker: Continue warmup (extend duration)
    end
```

### Warmup Ramp-Up Schedule

| Day   | Emails/Day | Actions                              |
|:-----:|:----------:|--------------------------------------|
| 1-3   | 5          | Send, receive, mark not spam         |
| 4-7   | 10         | Add replies to warmup interactions   |
| 8-14  | 20         | Full warmup cycle                    |
| 15-21 | 30         | Stabilize reputation                 |
| 21+   | Maintenance| 5-10 emails/day to maintain score    |

---

## Flow 4: Campaign Creation and Execution

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Queue as Redis (BullMQ)
    participant Scheduler as email:schedule Worker
    participant Sender as email:send Worker
    participant SMTP as Yandex/Mail.ru

    Note over User,Browser: Step 1: Create Campaign
    User->>Browser: Campaign Wizard (name, leads, sequence, settings)
    Browser->>API: POST /campaigns {name, daily_limit, schedule}
    API->>DB: INSERT Campaign (status: draft)

    Note over User,Browser: Step 2: Import Leads
    User->>Browser: Upload CSV file
    Browser->>API: POST /leads/import {campaign_id, csv_file}
    API->>API: Parse CSV, validate emails
    API->>DB: INSERT Leads (status: new, next_send_at: calculated)
    API->>DB: UPDATE Campaign (total_leads: count)

    Note over User,Browser: Step 3: Build Sequence
    User->>Browser: Add 3-5 sequence steps
    Browser->>API: POST /sequences {campaign_id, steps[]}
    API->>DB: INSERT Sequence + SequenceSteps

    Note over User,Browser: Step 4: Launch
    User->>Browser: Click "Launch Campaign"
    Browser->>API: POST /campaigns/:id/start
    API->>DB: UPDATE Campaign (status: active, started_at: now)
    API-->>Browser: 200 OK

    Note over Scheduler: Every 5 minutes (cron)
    Scheduler->>DB: SELECT leads WHERE next_send_at <= now AND campaign.status = active
    Scheduler->>DB: INSERT EmailMessage (status: queued)
    Scheduler->>Queue: Push email:send jobs

    Sender->>Queue: Pick job
    Sender->>DB: Load lead data + sequence step + decrypt credentials
    Sender->>Sender: Render template (replace {{first_name}}, {{company}}, etc.)
    Sender->>SMTP: Send email
    SMTP-->>Sender: Success
    Sender->>DB: UPDATE EmailMessage (status: sent, sent_at: now)
    Sender->>DB: UPDATE Lead (current_step++, next_send_at: +delay_days)
    Sender->>DB: INCREMENT Campaign.sent_count
```

---

## Flow 5: Reply Handling (Unibox)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant API as NestJS API
    participant Worker as imap:check Worker
    participant IMAP as Yandex/Mail.ru
    participant DB as PostgreSQL

    Note over Worker: Every 2 minutes
    Worker->>DB: Load active EmailAccounts
    loop For each account
        Worker->>DB: Decrypt IMAP credentials
        Worker->>IMAP: Connect and fetch new messages
        IMAP-->>Worker: New messages
        Worker->>Worker: Match replies via Message-ID / References headers
        alt Reply matches a campaign lead
            Worker->>DB: INSERT UniboxMessage (read: false)
            Worker->>DB: UPDATE Lead (status: replied)
            Worker->>DB: UPDATE EmailMessage (status: replied, replied_at: now)
            Worker->>DB: Stop sequence for this lead (clear next_send_at)
            Worker->>DB: INCREMENT Campaign.replied_count
        end
    end

    Note over User,Browser: User checks Unibox
    User->>Browser: Navigate to Unibox
    Browser->>API: GET /unibox?read=false
    API->>DB: SELECT UniboxMessages WHERE user_id = ? ORDER BY received_at DESC
    API-->>Browser: Message list

    User->>Browser: Click on a message
    Browser->>API: PATCH /unibox/:id {read: true}
    Browser-->>User: Display full thread in reading pane

    User->>Browser: Change lead status to "Interested"
    Browser->>API: PATCH /leads/:id {status: interested}
    API->>DB: UPDATE Lead (status: interested)

    User->>Browser: Click "Reply"
    Browser->>API: POST /unibox/:id/reply {body: "..."}
    API->>DB: Decrypt SMTP credentials for original account
    API->>IMAP: Send reply via SMTP (same account, same thread)
    API-->>Browser: 200 OK
```

---

## Flow 6: AI Email Generation

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant API as NestJS API
    participant Queue as Redis (BullMQ)
    participant Worker as ai:generate Worker
    participant OpenAI as OpenAI API
    participant DB as PostgreSQL

    User->>Browser: Open AI Generator
    User->>Browser: Enter product description + select tone
    Browser->>API: POST /ai/generate {prompt, tone, lead_context}
    API->>API: Rate limit check (30/min)
    API->>Queue: Push ai:generate job
    Queue->>Worker: Pick job

    Worker->>Worker: Build system prompt (product + tone + lead data)
    Worker->>OpenAI: POST /chat/completions (model: gpt-4o-mini)
    OpenAI-->>Worker: Generated email text
    Worker->>Worker: Validate output (spam keywords, length, quality score)

    alt Validation passes
        Worker-->>API: Return generated email
        API-->>Browser: Display in preview panel
        Browser-->>User: Show generated email with edit option
    else Validation fails
        Worker->>Worker: Retry with adjusted prompt
        Worker->>OpenAI: Regenerate
        OpenAI-->>Worker: New version
        Worker-->>API: Return regenerated email
    end

    User->>Browser: Click "Copy to Sequence"
    Browser-->>User: Email text copied to sequence step editor
```

---

## Flow 7: Admin -- Monitoring and Incident Response

```mermaid
sequenceDiagram
    actor Admin
    participant Grafana
    participant Prometheus
    participant App as NestJS App
    participant Docker as Docker Compose
    participant DB as PostgreSQL

    Note over Prometheus: Continuous scraping (15s interval)
    Prometheus->>App: GET /metrics
    App-->>Prometheus: coldmail_* metrics

    Note over Grafana: Alert rule triggered
    Grafana->>Grafana: Evaluate: bounce_rate > 10%
    Grafana-->>Admin: Email + SMS alert

    Admin->>Grafana: Open Email Pipeline dashboard
    Grafana-->>Admin: Show bounce rate spike at 14:30

    Admin->>Docker: docker compose logs worker-email --since="14:00"
    Docker-->>Admin: Log output showing SMTP errors

    alt SMTP credential expired
        Admin->>App: Notify user to update credentials
    else Provider rate limit
        Admin->>Docker: Scale down worker concurrency
    else Bad lead data
        Admin->>DB: Query bounced leads, disable campaign
    end

    Admin->>Grafana: Verify metrics returning to normal
```

---

## Flow 8: Admin -- Backup and Restore

```mermaid
sequenceDiagram
    actor Admin
    participant VPS
    participant Docker as Docker Compose
    participant PG as PostgreSQL
    participant Backup as Backup Storage

    Note over Admin: Scheduled daily at 03:00 MSK
    VPS->>Docker: docker compose exec postgres pg_dump -U coldmail coldmail
    Docker->>PG: Execute dump
    PG-->>Docker: SQL dump data
    Docker-->>VPS: Write to /backups/daily/coldmail_YYYYMMDD.sql
    VPS->>Backup: Copy to separate disk / server
    VPS->>VPS: Delete backups older than 30 days

    Note over Admin: Emergency restore scenario
    Admin->>VPS: SSH into server
    Admin->>Docker: docker compose stop app worker-email worker-warmup worker-imap worker-ai
    Admin->>Docker: docker compose exec -T postgres psql -U coldmail coldmail < backup.sql
    Admin->>Docker: docker compose start app worker-email worker-warmup worker-imap worker-ai
    Admin->>VPS: curl -f https://coldmail.ru/api/health
    VPS-->>Admin: 200 OK -- restore verified
```

---

## Complete User Journey Summary

```mermaid
graph TD
    REG["1. Register<br/>Create account (Free plan)"]
    CON["2. Connect Email<br/>Yandex / Mail.ru / Custom SMTP"]
    WARM["3. Warmup<br/>14-21 days automated warmup"]
    CAMP["4. Create Campaign<br/>Wizard: Name > Leads > Sequence > Settings"]
    AI["4a. AI Generation<br/>Generate personalized emails"]
    CSV["4b. Import Leads<br/>Upload CSV with contacts"]
    SEND["5. Sending<br/>Automated via BullMQ workers"]
    REPLY["6. Handle Replies<br/>Unibox: triage, classify, respond"]
    ANAL["7. Analyze<br/>Track sent/opened/replied/bounced"]
    OPT["8. Optimize<br/>Adjust sequences, test new approaches"]

    REG --> CON --> WARM --> CAMP
    CAMP --> AI --> CAMP
    CAMP --> CSV --> CAMP
    CAMP --> SEND --> REPLY --> ANAL --> OPT --> CAMP
```
