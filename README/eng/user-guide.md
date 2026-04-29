# ColdMail.ru -- User Guide

**Version:** 0.2 | **Date:** 2026-04-29

---

## Getting Started

### Registration and Login

1. Navigate to `https://coldmail.ru/login`
2. If you do not have an account yet, click **Create Account**
3. Enter your email address, first name, last name, and password
4. Confirm your email address via the verification link sent to your inbox
5. Return to the `/login` page and enter your email and password to sign in

If you already have an account, simply enter your credentials on the login page. The system uses JWT-based authentication with an access token (15 minutes) and a refresh token (7 days). When your session expires, you will be redirected to the login page automatically.

All new accounts start on the **Free** plan (1 email account, 50 emails/day, 20 AI credits/month).

### Dashboard Overview

After logging in, you will see the main dashboard with:

- **KPI cards** -- total emails sent, open rate, reply rate, active campaigns
- **Recent activity** -- latest campaign actions and replies
- **Warmup status** -- health indicators for connected email accounts

---

## Connecting Email Accounts

Navigate to **Email Accounts** in the sidebar.

### Yandex.Mail

1. Click **Add Account** and select **Yandex**
2. In your Yandex Mail settings, enable IMAP access
3. Generate an app-specific password at [https://id.yandex.ru/security/app-passwords](https://id.yandex.ru/security/app-passwords)
4. Enter your Yandex email and the app password in ColdMail
5. Click **Test Connection** -- the system will verify both SMTP and IMAP
6. Save the account

Connection settings are auto-filled:
- SMTP: `smtp.yandex.ru`, port 465 (SSL)
- IMAP: `imap.yandex.ru`, port 993 (SSL)

### Mail.ru

1. Click **Add Account** and select **Mail.ru**
2. Enable IMAP in Mail.ru settings (Settings > All settings > Mail from other apps)
3. Generate an app password in Mail.ru security settings
4. Enter credentials and test the connection

Connection settings are auto-filled:
- SMTP: `smtp.mail.ru`, port 465 (SSL)
- IMAP: `imap.mail.ru`, port 993 (SSL)

### Custom SMTP

1. Click **Add Account** and select **Custom SMTP**
2. Enter SMTP host, port, username, and password
3. Enter IMAP host and port for reply tracking
4. Test the connection and save

### Resend (Alternative Email Provider)

In addition to traditional SMTP, ColdMail.ru supports sending via **Resend** -- a cloud-based email API service.

1. Navigate to **Settings** -> **System** tab
2. In the **Email Provider** section, select **Resend**
3. Enter your **Resend API Key** (obtain it from resend.com)
4. Enter your **From Email** -- the sender address verified in Resend
5. Click **Save**
6. Use the **Test** button to verify the connection to the Resend API

> **When to use Resend:** If you do not need individual SMTP accounts (Yandex, Mail.ru) and prefer sending through a single API with high deliverability. Resend is particularly convenient for technical teams that already use it in other projects.

### Account Health Score

Each account displays a **health score** (0-100) based on:

- Connection status (connected / error / disconnected)
- Warmup progress
- Bounce rate
- Sending reputation

---

## Warmup

Warmup is the process of gradually building your email account's sending reputation so that messages reach the recipient's inbox rather than the spam folder.

### Starting Warmup

1. Go to **Email Accounts**
2. Click the flame icon next to the account you want to warm up
3. Click **Start Warmup**

The system will automatically:
- Send and receive warmup emails with other accounts in the network
- Gradually increase daily volume over 14-21 days
- Mark warmup emails as "not spam" to train provider algorithms
- Track inbox placement rate

### Warmup Status

| Status       | Meaning                                           |
|--------------|---------------------------------------------------|
| Not Started  | Warmup has not been initiated                     |
| In Progress  | Warmup is active; volume is increasing            |
| Ready        | Account has reached target reputation; safe to use|
| Paused       | Warmup temporarily paused by user                 |

**Recommendation:** Wait until warmup status shows **Ready** (typically 14-21 days) before launching campaigns. Using an account prematurely may result in emails landing in spam.

### Warmup Dashboard

Monitor per-account warmup metrics:
- Days active
- Daily send volume (current vs target)
- Inbox rate percentage
- Warmup interaction history

---

## Campaign Wizard

Creating a campaign follows a 4-step wizard. Navigate to **Campaigns** and click **Create Campaign** to begin.

### Step 1: Campaign Name

Enter a descriptive name for internal reference (e.g., "SaaS founders -- Q2 2026"). This name is only visible to you and your team; recipients will not see it.

### Step 2: Sending Accounts

- The system loads all connected email accounts
- Select the accounts you want to use for this campaign by checking them
- It is recommended to select 3-5 warmed-up accounts for rotation
- If no accounts are available, connect at least one in the **Email Accounts** section first

### Step 3: Schedule

- **Timezone** -- defaults to Europe/Moscow
- **Sending hours** -- start and end of the sending window (e.g., 09:00-18:00)
- **Days of the week** -- select which days are allowed for sending (default: Mon-Fri)
- **Daily limit** -- maximum emails per day for this campaign

### Step 4: Review and Create

- Review the summary: campaign name, selected accounts, schedule, limits
- Click **Create Campaign** to save
- The campaign is created in `draft` status -- you can add leads and email sequences later on the campaign detail page

---

## Campaign Detail and Edit Page

After creating a campaign, you can open it to view metrics, edit settings, manage leads, and control sending.

### Campaign Metrics

The top of the page displays KPI cards:

| Metric  | Description                        |
|---------|------------------------------------|
| Sent    | Total emails successfully sent     |
| Opens   | Emails opened (tracked via pixel)  |
| Replies | Leads who responded                |
| Bounced | Undeliverable emails               |

### Editing Settings

On the campaign page you can modify:
- **Campaign name**
- **Sending hours** (start and end)
- **Days of the week** for sending
- **Daily limit** per campaign

An "Unsaved changes" indicator appears when you modify any field. Click **Save** to apply changes.

### Status Management

Available actions depend on the current campaign status:

| Action         | Description                                        |
|----------------|----------------------------------------------------|
| Start / Resume | Launch or resume email sending                     |
| Pause          | Temporarily stop sending                           |
| Reset stats    | Reset statistics (sent, opens, replies, bounced)   |
| Delete         | Delete the campaign (requires confirmation)        |

### Lead Management

The campaign page includes a leads section:

**CSV Import:**
1. Click **Import CSV**
2. Upload a CSV file with columns: `email`, `first_name`, `last_name`, `company`, `title`, `industry`
3. Map CSV columns to ColdMail fields
4. Review the import preview and confirm

**Manual Entry:**
- Click **Add Lead** and fill in the lead details individually

**CSV Format Example:**
```csv
email,first_name,last_name,company,title,industry
ivan@example.com,Ivan,Petrov,TechCorp,CTO,SaaS
maria@example.com,Maria,Sidorova,DigitalAgency,CEO,Marketing
```

### Email Sequence

Build a sequence of up to 5 steps:

1. **Step 1 (Initial Email)** -- subject line and body; delay: 0 days
2. **Step 2 (Follow-up)** -- different angle; delay: 3 days
3. **Step 3 (Value add)** -- case study or resource; delay: 5 days
4. **Step 4 (Final follow-up)** -- last chance; delay: 7 days

For each step, you can:
- Write the email manually
- Use the **AI Generator** (see below)
- Insert **variables**: `{{first_name}}`, `{{company}}`, `{{title}}`, `{{industry}}`
- Enable **AI personalization** per step

Sequences automatically stop for a lead when:
- The lead replies
- The lead's email bounces
- You manually pause or stop the campaign

---

## Settings

The **Settings** section is accessible from the sidebar and contains several tabs.

### Profile Tab

Basic user account information.

### System Tab

Manage all system variables through the web UI (no need to edit `.env` files):

**AI (OpenAI):**
- OpenAI API key
- Model selection (default: gpt-4o-mini)
- Maximum tokens per generation
- Generation temperature (0-1)

**Default Sending Schedule:**
- Timezone
- Sending window start and end hours
- Daily limit per account

**Email Provider:**
- Provider selection: **SMTP** or **Resend**
- For SMTP: default host and port, connection testing
- For Resend: API key, From Email address, API testing

**Tracking:**
- Tracking domain for open/click monitoring

**Compliance:**
- Automatic unsubscribe link toggle
- Sender company name
- Sender contact information

### Integrations Tab

Configuration for external service integrations (AmoCRM -- planned).

### Billing Tab

Plan management and payment (owner role only).

---

## AI Email Generation

### Using the AI Generator

1. Navigate to **AI Generator** from the sidebar
2. Describe your product or service in the prompt field
3. Select a tone: **Formal**, **Casual**, or **Creative**
4. Optionally provide lead context (industry, company size) for personalization
5. Click **Generate**

The AI will produce a personalized email draft in Russian. You can:
- **Edit** the generated text directly
- **Regenerate** for a different version
- **Copy to sequence** to use in a campaign step

### AI Personalization in Sequences

When creating a sequence step, toggle **AI Personalize**. The system will:
- Use your base template as a starting point
- Incorporate each lead's data (name, company, industry, title)
- Generate a unique version for every lead in the campaign
- Process in batches via the background AI worker

### Tips for Better AI Results

- Provide clear, specific product descriptions
- Include your unique value proposition
- Mention the target audience explicitly
- Keep the initial prompt under 500 words

---

## Unibox (Unified Inbox)

Unibox aggregates replies from all your email accounts into a single interface.

### Layout

The Unibox uses a three-column layout:

1. **Filters** (left) -- filter by status, campaign, account
2. **Message list** (center) -- list of conversations
3. **Reading pane** (right) -- full message thread

### Lead Status Management

Classify replies directly from Unibox:

| Status         | Meaning                              |
|----------------|--------------------------------------|
| New            | Unread reply                         |
| Interested     | Lead expressed interest              |
| Not Interested | Lead declined                        |
| Meeting Booked | Meeting scheduled                    |
| Won            | Deal closed                          |

Click the status dropdown on any message to update the lead's pipeline stage.

### Replying

Click **Reply** in the reading pane to respond directly from the email account that received the message. Your reply is sent via the original SMTP connection.

---

## Analytics

Navigate to **Analytics** in the sidebar.

### Campaign Metrics

| Metric   | Description                                  |
|----------|----------------------------------------------|
| Sent     | Total emails successfully delivered          |
| Opened   | Emails opened (tracked via pixel)            |
| Replied  | Leads who responded                          |
| Bounced  | Undeliverable emails (invalid addresses)     |

### Views

- **Overview** -- aggregate metrics across all campaigns
- **Per Campaign** -- select a specific campaign for detailed stats
- **Per Account** -- warmup health and sending metrics per email account
- **Time Period** -- filter by date range (7 days, 30 days, custom)

### Charts

The analytics dashboard displays an area chart showing daily send volume, open rate, and reply rate trends over time.

---

## Frequently Asked Questions

**Q: How many email accounts can I connect?**
A: Depends on your plan. Free allows 1 account; Agency allows unlimited.

**Q: How long does warmup take?**
A: Typically 14-21 days. The system will notify you when the account reaches Ready status.

**Q: What is the daily sending limit per account?**
A: Yandex and Mail.ru enforce approximately 500 emails/day per account. ColdMail defaults to 50/day and increases gradually.

**Q: What is the difference between SMTP and Resend?**
A: SMTP uses credentials from a specific mailbox (Yandex, Mail.ru, etc.) to send emails. Resend is a cloud-based email API service that does not require SMTP server configuration. Use SMTP when sending on behalf of individual team members; use Resend for centralized API-based sending.

**Q: How do I configure system variables?**
A: All system parameters (AI, schedule, email provider, tracking, compliance) are managed through the web UI at **Settings** -> **System** tab. Editing `.env` files is not required.

**Q: Does ColdMail support English-language emails?**
A: The AI generator is optimized for Russian B2B emails, but you can write and send emails in any language.

**Q: How do I avoid landing in spam?**
A: Complete the warmup period, use personalized content (AI helps), keep lists clean, and follow the compliance suggestions the platform provides.

**Q: Is my data safe?**
A: All data is stored on servers in the Russian Federation (152-FZ compliant). SMTP credentials are encrypted with AES-256. Connections use TLS 1.3.

**Q: Can I integrate with AmoCRM?**
A: AmoCRM integration is planned for v1.0. The database schema already supports it.
