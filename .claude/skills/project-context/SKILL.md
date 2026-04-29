---
name: project-context
description: >
  Domain knowledge for ColdMail.ru — the Russian cold email outreach platform.
  Provides market context, competitor intelligence, regulatory landscape (152-FZ, 38-FZ),
  target personas, pricing benchmarks, and email deliverability specifics for Yandex/Mail.ru.
  Use this skill when you need business context for feature decisions, copy, pricing,
  or compliance checks.
version: "1.0"
maturity: production
---

# Project Context: ColdMail.ru

## Product Identity

**ColdMail.ru** — AI-first cold email outreach platform for the Russian B2B market.

- **Positioning:** "AI-платформа для B2B cold email в России"
- **Core differentiators:** AI generation in Russian + Yandex/Mail.ru warmup + 152-FZ compliance
- **UI reference:** Instantly.ai dark theme design language
- **Target launch:** MVP in 3 months

## Russian Cold Email Market

### Market Size

| Parameter | Value | Source |
|---|---|---|
| Email marketing RF (2026) | 5.1-5.4 billion RUB | Sostav, DashaMail |
| Cold email sub-segment (est.) | 1-1.5 billion RUB | ~25% of TAM |
| CAGR email marketing RF | ~10% | DashaMail research |
| CAGR SaaS import substitution | ~25%+ | TAdviser |
| Email volume growth | +39% YoY | DashaMail (9.3 -> 12.9 billion emails) |

### Market Drivers

1. **Sanctions barrier:** Visa/Mastercard blocked -- western SaaS inaccessible for direct payment
2. **152-FZ localization:** Since 01.07.2025 all personal data must be stored in RF; fines up to 15M RUB
3. **Domestic software registry:** 27,000+ products, 43% market share; government procurement = RF software only
4. **AI trend:** 60% of organizations plan to adopt AI sales engagement by 2026

## Competitor Landscape

### Direct Russian Competitors

| Company | Pricing | Strengths | Weaknesses |
|---|---|---|---|
| **Coldy.ai** | from 2,900 RUB/mo | AI agent, warmup for Mail.ru/Yandex, sequences | Young product, small team |
| **Respondo** | from 1,990 RUB/mo | Auto-sequences, gradual sending | 2,000 contact limit, few features |

### Global Competitors (blocked in RF)

| Company | Revenue | Pricing | RF Status |
|---|---|---|---|
| Instantly.ai | ~$20M ARR | $37-358/mo | Cannot accept RF cards |
| Lemlist | $40M ARR | $55-69/user | Blocked |
| Smartlead | $14M ARR | $39/mo | Blocked |
| Apollo.io | $150M ARR | Free/$49/mo | Blocked |

### Russian ESPs (not cold outreach)

Unisender (from 1,600 RUB), DashaMail (from 770 RUB), Sendsay (from 736 RUB) -- none offer warmup or cold email sequences.

**Conclusion:** Market is nearly empty. 2 direct competitors vs 20+ in the West.

## Target Personas

### Segment A: Digital Agencies (Phase 2)
- 10+ clients, need multi-workspace
- Price sensitivity: low (pass cost to clients)
- Key need: scale, white-label, API

### Segment B: B2B Startups & Entrepreneurs (MVP target)
- Solo founder or small sales team
- Price sensitivity: medium
- Key need: fast setup, AI generation, deliverability
- Aha moment: first AI-generated campaign in 15 minutes

### Segment C: SMB Sales Teams (Phase 3)
- 5-20 person sales department
- Price sensitivity: medium-high
- Key need: CRM integration (AmoCRM/Bitrix24), analytics, team collaboration

## Pricing Strategy

| Plan | Price (RUB/mo) | Limits |
|---|---|---|
| Free | 0 | 500 emails/mo, 3 accounts, AI generation |
| Growth | 3,900 | Unlimited accounts, warmup, analytics |
| Pro | 7,900 | + API, advanced analytics, priority support |
| Agency | 14,900 | + multi-workspace, white-label |

**Strategy:** Feature-led differentiation (AI-first) + compliance positioning. Not price leader (avoid race to bottom), not premium (market is immature).

**Nash Equilibrium analysis:** Mid pricing (3,500-5,000 RUB/mo) + AI differentiation is optimal. Coldy.ai likely to ignore rather than engage in price war.

## Regulatory Framework

### 152-FZ (Personal Data)
- All personal data must be stored on servers located in the Russian Federation
- Fines up to 15M RUB for violations
- **Our compliance:** VPS in AdminVPS Moscow / HOSTKEY SPb

### 38-FZ (Advertising Law)
- Email advertising requires prior consent
- **B2B exception:** Business proposals to corporate email addresses (info@, sales@) are NOT classified as advertising
- Requirements: sender identification, opt-out link, company details in every email

### Key Legal Position
Cold B2B email in RF is **legal** when properly structured:
- Framed as business proposal, not advertisement
- Sent to corporate addresses only
- Includes sender identification and opt-out
- Complies with 152-FZ data storage requirements

## Email Deliverability: Yandex / Mail.ru Specifics

### Provider Landscape
- Yandex.Mail and Mail.ru handle 70%+ of Russian business email
- No existing warmup infrastructure for these providers (unlike Gmail/Outlook)
- Different anti-spam algorithms than Western providers

### Yandex Limits
- ~50 emails/day per account (sending limit)
- SPF/DKIM/DMARC mandatory for inbox placement
- Reputation system based on engagement metrics

### Warmup Strategy
- Gradual volume increase: 5/day (week 1) -> 50/day (week 3)
- Peer-to-peer warmup network using platform accounts
- Reply and mark-not-spam actions to build sender reputation
- Target: 85%+ inbox rate before marking account as "ready"

### Technical Requirements
- Custom SMTP pool with Nodemailer
- IP rotation for high-volume sending
- Real-time bounce rate monitoring with auto-pause at 5% threshold
- Provider-specific handling for Yandex 550 errors

## Competitive Moats (Second-Order Effects)

```
Positive feedback loop 1: More clients -> more warmup data -> better deliverability -> more clients
Positive feedback loop 2: More emails -> more AI training data -> better personalization -> higher reply rate
Negative feedback loop:   Volume growth -> spam reputation risk -> blocks -> client loss
```

**Tipping point:** Positive loops dominate negative at >500 active clients.

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Warmup engine fails to reach 90%+ inbox rate | High | Critical | Iterative development, start with manual warmup |
| Yandex tightens anti-spam | High | Critical | Adaptive algorithms, provider diversification |
| Coldy.ai copies AI features in 3 months | High | Medium | Faster iteration, data moat, brand |
| 152-FZ additional requirements | Medium | Medium | Compliance-first architecture, legal audit |
| AI Russian text quality insufficient | Medium | Medium | Prompt fine-tuning, A/B testing, template fallback |
| Market too small for sustainable business | Low | Medium | Expand to CIS, additional revenue streams |
