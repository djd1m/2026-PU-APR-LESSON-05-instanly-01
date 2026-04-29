# Specification: ColdMail.ru

**Date:** 2026-04-29
**Source:** PRD.md + Solution_Strategy.md

---

## Feature Matrix

| Feature | MVP (M1-3) | v1.0 (M4-6) | v2.0 (M7-12) |
|---------|:----------:|:-----------:|:------------:|
| Email Account Management | ✅ | ✅ | ✅ |
| Warmup Engine (Yandex/Mail.ru) | ✅ | ✅+ | ✅+ |
| AI Email Generation | ✅ | ✅+ | ✅+ |
| Email Sequences (3-5 steps) | ✅ | ✅ | ✅ |
| Campaign Management | ✅ | ✅+ | ✅+ |
| Unibox | ✅ | ✅+ | ✅+ |
| Analytics (basic) | ✅ | ✅+ | ✅+ |
| Compliance Checker | ✅ | ✅ | ✅ |
| Lead Import (CSV) | ✅ | ✅ | ✅ |
| Multi-account (Agency) | — | ✅ | ✅ |
| AmoCRM Integration | — | ✅ | ✅ |
| A/B Testing | — | ✅ | ✅ |
| API Access | — | ✅ | ✅ |
| Team Management | — | ✅ | ✅ |
| Lead Database (RF) | — | — | ✅ |
| AI Reply Agent | — | — | ✅ |
| Automations | — | — | ✅ |
| Email Verification | — | ✅ | ✅ |

---

## User Stories with Acceptance Criteria

### Feature: Email Account Management

```gherkin
Feature: Email Account Management

  Scenario: Connect Yandex email account
    Given I am on the Email Accounts page
    When I click "+ Add New" and select "Yandex.Mail"
    And I enter my Yandex email and app password
    And I click "Connect"
    Then the account should appear in my account list with status "Connected"
    And the warmup health should show "Not started"
    And I should see IMAP/SMTP connection verified

  Scenario: Connect Mail.ru email account
    Given I am on the Email Accounts page
    When I click "+ Add New" and select "Mail.ru"
    And I enter my Mail.ru email and app password
    And I click "Connect"
    Then the account should appear with status "Connected"

  Scenario: Connect custom SMTP
    Given I am on the Email Accounts page
    When I click "+ Add New" and select "Custom SMTP"
    And I enter SMTP host, port, username, password
    And I click "Test Connection"
    Then I should see "Connection successful" or error message
    When connection is successful and I click "Save"
    Then the account appears in my list

  Scenario: View account health score
    Given I have connected email accounts
    When I view the Email Accounts list
    Then each account shows: email, sent count, warmup status, health score (0-100%)
    And health score reflects: bounce rate, spam complaints, engagement

  Scenario: Disconnect email account
    Given I have a connected email account
    When I click the account menu and select "Disconnect"
    Then I see a confirmation dialog
    When I confirm
    Then the account is removed from the list
    And all active campaigns using this account are paused
```

### Feature: Warmup Engine

```gherkin
Feature: Warmup Engine

  Scenario: Start warmup for new account
    Given I have a connected email account with status "Not warmed"
    When I click "Start Warmup"
    Then warmup status changes to "In Progress"
    And I see estimated completion date (14-21 days)
    And the system begins sending/receiving warmup emails automatically

  Scenario: Monitor warmup progress
    Given warmup is in progress for my account
    When I view the account details
    Then I see: day X of Y, emails sent today, inbox rate %, warmup health color
    And warmup health is: 🔴 (<60%), 🟡 (60-85%), 🟢 (>85%)

  Scenario: Warmup completion notification
    Given warmup has been running for 14+ days
    When inbox rate stabilizes above 85%
    Then the system marks warmup as "Ready"
    And I receive an email/in-app notification "Account ready for campaigns"

  Scenario: Auto-pause on degradation
    Given my account is warmed and sending campaign emails
    When bounce rate exceeds 5% or spam complaints exceed 0.3%
    Then the system auto-pauses campaign sending for this account
    And I receive an alert "Account paused: deliverability at risk"
    And warmup continues in background to recover reputation

  Scenario: Warmup pool interaction
    Given multiple accounts in warmup
    Then the system uses its warmup network to exchange emails
    And emails mimic human patterns (reply, forward, mark not-spam)
    And Yandex/Mail.ru specific patterns are followed
```

### Feature: AI Email Generation

```gherkin
Feature: AI Email Generation

  Scenario: Generate email from product description
    Given I am creating a new campaign sequence
    When I click "Generate with AI"
    And I enter my product description and target audience
    And I select tone (formal/casual/friendly)
    And I click "Generate"
    Then within 10 seconds I see a personalized email draft
    And the email includes: subject line, body, CTA
    And I can edit any part of the generated text

  Scenario: Personalize for each lead
    Given I have a campaign with 100 leads (name, company, title)
    When I enable "AI Personalization"
    Then the system generates unique opening line for each lead
    And personalization uses: lead name, company name, industry
    And I can preview any lead's personalized version before sending

  Scenario: Generate follow-up emails
    Given I have a first email in my sequence
    When I click "Generate Follow-up"
    Then AI generates a contextual follow-up referencing the first email
    And the follow-up has different angle/value proposition
    And I can adjust the follow-up independently

  Scenario: AI quality guardrails
    Given AI generates an email
    Then the email does NOT contain: spam words, excessive caps, misleading claims
    And the email includes: clear sender identification, opt-out mention
    And AI Score is displayed (quality rating 1-10)
```

### Feature: Email Sequences

```gherkin
Feature: Email Sequences

  Scenario: Create multi-step sequence
    Given I am in Campaign Wizard at the Sequence step
    When I add Step 1 (initial email)
    And I set delay to 3 days
    And I add Step 2 (follow-up)
    And I set delay to 5 days
    And I add Step 3 (breakup email)
    Then my sequence shows 3 steps with timeline visualization

  Scenario: Auto-stop on reply
    Given a lead received Step 1 of my sequence
    When the lead replies to my email
    Then the system immediately stops the sequence for this lead
    And the reply appears in Unibox
    And lead status changes to "Replied"

  Scenario: Sending window respect
    Given I set sending hours to 9:00-18:00 Moscow time
    When a scheduled email would be sent at 3:00 AM
    Then the system delays to 9:00 AM next business day
    And weekends are skipped unless configured otherwise

  Scenario: Variable substitution
    Given my sequence uses {{first_name}} and {{company}}
    When the system sends to lead "Ivan" from "Рога и Копыта"
    Then the email body contains "Ivan" and "Рога и Копыта"
    And if a variable is empty, fallback text is used (e.g., "коллега")
```

### Feature: Campaign Management

```gherkin
Feature: Campaign Management

  Scenario: Create campaign via wizard
    Given I am on the Campaigns page
    When I click "+ Add New"
    Then I see Step 1: Campaign Name
    When I enter name and click Continue
    Then I see Step 2: Add Leads (CSV upload or manual)
    When I upload CSV with 500 leads
    Then I see Step 3: Sequence (create or select template)
    When I configure sequence
    Then I see Step 4: Settings (sending accounts, schedule, limits)
    When I configure and click "Launch"
    Then the campaign starts with status "Active"

  Scenario: Pause and resume campaign
    Given I have an active campaign
    When I click "Pause"
    Then sending stops immediately
    And campaign status changes to "Paused"
    When I click "Resume"
    Then sending continues from where it left off

  Scenario: Campaign completion
    Given all leads in campaign have received all sequence steps or replied
    Then campaign status changes to "Completed"
    And I see final analytics summary

  Scenario: Daily sending limits
    Given I set max 50 emails/day per account
    And my campaign has 3 assigned accounts
    Then max 150 emails sent per day for this campaign
    And distribution is even across accounts
```

### Feature: Unibox

```gherkin
Feature: Unibox (Unified Inbox)

  Scenario: View all replies
    Given leads from multiple campaigns have replied
    When I open Unibox
    Then I see all replies sorted by newest first
    And each reply shows: lead name, subject, snippet, campaign name, timestamp
    And unread replies are highlighted

  Scenario: Filter by status
    Given I have replies with different statuses
    When I filter by "Interested"
    Then I see only replies marked as interested
    And counts per status are shown in the sidebar

  Scenario: Reply to lead
    Given I select a reply in Unibox
    When I type a response and click Send
    Then the reply is sent from the same account that received the original
    And the thread is updated in Unibox

  Scenario: Change lead status
    Given I am viewing a reply
    When I change status from "New" to "Meeting Booked"
    Then the status badge updates
    And the reply moves to the "Meeting Booked" filter section
```

### Feature: Analytics

```gherkin
Feature: Analytics

  Scenario: View campaign metrics
    Given I have active/completed campaigns
    When I open Analytics
    Then I see KPI cards: Total Sent, Opened (%), Replied (%), Bounced (%)
    And I see an area chart showing daily send/open/reply trends
    And I can filter by campaign and date range

  Scenario: View per-account health
    Given I have multiple email accounts
    When I open the Accounts section in Analytics
    Then I see per-account: sent count, bounce rate, warmup health, inbox rate
    And accounts with degraded health are highlighted in red/yellow
```

---

## Non-Functional Requirements (Detailed)

### Performance Targets

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| Page load (SPA) | 800ms | 1.5s | 3s |
| API: list campaigns | 100ms | 300ms | 500ms |
| API: send email (queue) | 50ms | 100ms | 200ms |
| AI email generation | 3s | 7s | 10s |
| CSV import (1000 rows) | 2s | 5s | 10s |
| Warmup batch processing | 30s | 2min | 5min |

### Security Requirements

| Area | Requirement |
|------|-------------|
| Passwords | bcrypt, min 8 chars, complexity check |
| Sessions | JWT (15min access + 7d refresh), httpOnly cookies |
| SMTP credentials | AES-256 encrypted at rest, decrypt only on send |
| API rate limiting | 100 req/min per user, 1000 req/min per IP |
| Input validation | All inputs sanitized, XSS prevention, SQL injection prevention |
| Audit log | Login/logout, account changes, campaign actions |
| Data retention | User data deleted within 30 days of account deletion |
| 152-ФЗ | All PII stored on RF servers only |

### Compliance Requirements

| Requirement | Implementation |
|-------------|----------------|
| 152-ФЗ data localization | All servers in Russia (AdminVPS/HOSTKEY) |
| 38-ФЗ advertising law | Compliance checker warns if email looks like advertising |
| Opt-out mechanism | Every email includes unsubscribe link (configurable text) |
| Sender identification | Company name + contact info required in account settings |
| Data processing agreement | Terms of Service include data processing consent |
| Bounce handling | Auto-remove hard bounced emails, never resend |

---

## Success Metrics (MVP)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first campaign | < 15 min | From signup to first email sent |
| Warmup effectiveness | > 85% inbox rate | Measured via seed testing |
| AI reply rate | > 8% | Replied / Delivered |
| User activation (Day 7) | > 30% | Users who sent ≥1 campaign |
| User retention (Day 30) | > 40% | Users who sent ≥1 campaign in last 7 days |
| System uptime | > 99.5% | Monitoring |
| Customer satisfaction | NPS > 40 | In-app survey |
