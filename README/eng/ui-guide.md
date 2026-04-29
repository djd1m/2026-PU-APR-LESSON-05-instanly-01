# ColdMail.ru -- UI Guide

## Layout Structure

The application uses a three-zone layout inspired by modern SaaS design patterns.

```
+------------------+------------------------+----------------------------+
| Icon Sidebar     | Secondary Sidebar      | Main Content Area          |
| (w-16 / 64px)    | (w-72 / 288px)         | (flex-1)                   |
|                  |                        |                            |
| [Logo]           | Context-dependent      | Page content               |
| Dashboard        | navigation and         | Tables, forms,             |
| Campaigns        | filters for the        | charts, wizards            |
| Accounts         | active module          |                            |
| Unibox           |                        |                            |
| Analytics        |                        |                            |
| AI Generator     |                        |                            |
| Settings         |                        |                            |
|                  |                        |                            |
| [Avatar]         |                        |                            |
+------------------+------------------------+----------------------------+
```

### Icon Sidebar (Global Navigation)

- Fixed to the left edge, always visible
- Width: 64px (`w-16`)
- Background: `#0f1014`
- Contains icon-only navigation items with tooltips
- Bottom: user avatar and profile menu

### Secondary Sidebar (Contextual Navigation)

- Width: 288px (`w-72`)
- Background: `#15171c`
- Content changes based on the active module:
  - **Campaigns:** list of campaigns with status badges
  - **Accounts:** list of email accounts with health indicators
  - **Unibox:** filters (status, campaign, account)
  - **Analytics:** campaign selector, date range
  - **Settings:** settings categories (Profile, Integrations, Billing)

### Main Content Area

- Fills remaining horizontal space
- Background: `#0f1014`
- Contains the primary interface for the selected module
- Top bar with breadcrumbs, plan badge, and workspace selector

## Dark Theme Design System

### Color Palette

| Token              | Value     | Usage                          |
|--------------------|-----------|--------------------------------|
| `--bg-primary`     | `#0f1014` | Page background, sidebar       |
| `--bg-secondary`   | `#15171c` | Cards, panels                  |
| `--bg-tertiary`    | `#17191f` | Elevated cards, hover states   |
| `--bg-input`       | `#111318` | Input field backgrounds        |
| `--border-default` | `#2a2d34` | Card borders, dividers         |
| `--border-hover`   | `#3a3d44` | Interactive element borders    |
| `--color-primary`  | `#2563eb` | Primary buttons, links         |
| `--color-gradient`  | `#2563eb to #7c3aed` | AI-related actions    |
| `--color-success`  | `#22c55e` | Active status, positive metrics|
| `--color-warning`  | `#facc15` | Paused status, warnings        |
| `--color-error`    | `#ef4444` | Error status, bounce alerts    |
| `--text-primary`   | `#e5e7eb` | Main text                      |
| `--text-secondary` | `#9ca3af` | Secondary labels               |
| `--text-muted`     | `#8b949e` | Placeholder text, table headers|

### Typography

| Level        | Size  | Weight   | Usage                     |
|--------------|:-----:|----------|---------------------------|
| Page title   | 28px  | Bold     | Screen headings            |
| Section title| 20px  | Semibold | Card headings, sections    |
| Body         | 14px  | Regular  | Standard text              |
| Small        | 13px  | Regular  | Table cells, descriptions  |
| Caption      | 11px  | Medium   | Labels, badges, metadata   |

Font: `Inter`, fallback to `system-ui, sans-serif`.

### Spacing and Borders

| Element   | Border Radius | Notes                        |
|-----------|:-------------:|------------------------------|
| Buttons   | `rounded-xl` (12px) | All interactive buttons |
| Cards     | `rounded-2xl` (16px)| Content containers      |
| Inputs    | `rounded-xl` (12px) | Text fields, selects    |
| Badges    | `rounded-md` (6px)  | Status indicators       |
| Avatars   | `rounded-full`      | User profile images     |

## Screen Reference

### Dashboard

The entry point after login. Provides a high-level overview.

| Zone             | Content                                         |
|------------------|--------------------------------------------------|
| Top KPI row      | 4 cards: Emails Sent, Open Rate, Reply Rate, Active Campaigns |
| Activity feed    | Recent campaign events (started, completed, replies received) |
| Warmup summary   | Mini cards per account showing warmup status and health score |
| Quick actions    | Buttons: New Campaign, Add Account, AI Generator |

### Email Accounts

| Zone             | Content                                          |
|------------------|--------------------------------------------------|
| Secondary sidebar| Account list with provider icons and status dots |
| Main content     | Selected account details: connection info, health score, warmup progress |
| Action bar       | Test Connection, Start/Pause Warmup, Edit, Delete|

**Warmup Health Indicator:** A flame icon with a circular progress bar. Color transitions from red (0-40%) through yellow (40-70%) to green (70-100%).

### Campaigns

| Zone             | Content                                          |
|------------------|--------------------------------------------------|
| Secondary sidebar| Campaign list with status badges (Active/Paused/Draft/Completed) |
| Main content     | Campaign detail: metrics row, lead table, sequence preview |
| Action bar       | Start, Pause, Stop, Edit, Duplicate, Delete      |

### Campaign Wizard (4 Steps)

| Step | Title    | Content                                         |
|:----:|----------|--------------------------------------------------|
| 1    | Name     | Campaign name input, optional description        |
| 2    | Audience | Lead import (CSV upload or manual add), lead preview table |
| 3    | Sequence | Step editor with subject/body fields, delay picker, AI toggle |
| 4    | Settings | Account assignment, daily limit, schedule picker  |

Progress indicator at the top shows current step. Each step validates before allowing progression.

### AI Generator

| Zone             | Content                                          |
|------------------|--------------------------------------------------|
| Center stage     | Large prompt input (multi-line textarea)         |
| Tone selector    | Three buttons: Formal, Casual, Creative         |
| Preview panel    | Generated email preview with formatting          |
| Action buttons   | Regenerate, Edit, Copy to Sequence               |

The AI Generator uses a gradient accent (`blue-600 to violet-600`) to visually distinguish AI-powered features.

### Unibox

Three-column layout optimized for email triage.

| Column | Width  | Content                                     |
|--------|--------|----------------------------------------------|
| Left   | 240px  | Filters: status, campaign, account, search   |
| Center | 360px  | Message list: sender, subject, preview, time |
| Right  | flex-1 | Reading pane: full thread, reply button      |

Unread messages are highlighted with a brighter background. Status can be changed inline via a dropdown.

### Analytics

| Zone             | Content                                          |
|------------------|--------------------------------------------------|
| Top KPI row      | 4 metric cards: Sent, Opened, Replied, Bounced   |
| Main chart       | Area chart showing daily trends (7/30/custom range)|
| Campaign table   | Per-campaign breakdown with sparklines           |
| Filters          | Date range picker, campaign selector             |

### Settings

| Section       | Content                                          |
|---------------|--------------------------------------------------|
| Profile       | Name, email, password change                     |
| Workspace     | Workspace name, invite members (owner only)      |
| Integrations  | AmoCRM connection status (future)                |
| Billing       | Current plan, usage meters, upgrade button       |
| Security      | Active sessions, two-factor auth (future)        |

## Component Library

### Buttons

| Variant    | Tailwind Classes                                                    | Usage          |
|------------|---------------------------------------------------------------------|----------------|
| Primary    | `rounded-xl px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white` | Main actions |
| Secondary  | `rounded-xl px-4 py-2 font-semibold bg-white/10 hover:bg-white/15 text-gray-200` | Cancel, back |
| Gradient   | `rounded-xl px-4 py-2 font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white` | AI actions |
| Danger     | `rounded-xl px-4 py-2 font-semibold bg-red-600 hover:bg-red-500 text-white` | Destructive |
| Ghost      | `rounded-xl px-4 py-2 font-semibold text-gray-400 hover:text-white hover:bg-white/5` | Tertiary |

### Status Badges

| Status     | Classes                                                    |
|------------|-------------------------------------------------------------|
| Active     | `bg-emerald-500/20 text-emerald-300 rounded-md px-2 py-1 text-xs font-semibold` |
| Paused     | `bg-yellow-500/20 text-yellow-300`                         |
| Draft      | `bg-gray-500/20 text-gray-300`                             |
| Completed  | `bg-blue-500/20 text-blue-300`                             |
| Error      | `bg-red-500/20 text-red-300`                               |

### Data Tables

- Header: `uppercase text-xs text-[#8b949e] tracking-wider`
- Rows: alternating `bg-transparent` / `bg-white/[0.02]`
- Hover: `hover:bg-white/[0.04]`
- Supports sorting, filtering, and pagination

### Empty States

Centered vertically and horizontally within the content area:
- Icon or illustration (48px)
- Title text (16px semibold)
- Description (14px muted)
- Primary CTA button

### Form Inputs

- Background: `#111318`
- Border: `1px solid #2a2d34`
- Focus: `border-blue-600 ring-1 ring-blue-600`
- Height: `h-12` (48px)
- Text: `text-sm text-[#e5e7eb]`
- Placeholder: `text-[#8b949e]`
