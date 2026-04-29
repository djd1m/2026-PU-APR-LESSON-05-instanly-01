# Validation Report: ColdMail.ru

**Date:** 2026-04-29
**Iteration:** 1/3
**Verdict:** 🟡 CAVEATS

---

## Summary

| Metric | Value |
|--------|-------|
| Stories analyzed | 33 |
| Average INVEST score | 83.5/100 |
| READY (≥75) | 27 |
| FAIR (50-74) | 6 |
| BLOCKED (<50) | 0 |
| Cross-doc coherence | 87/100 |
| Contradictions found | 3 (all LOW-MEDIUM) |
| Missing items | 9 |

---

## Verdict: 🟡 CAVEATS

**All scores ≥50, average 83.5/100, no blocked items.** Warnings exist — 6 FAIR stories need refinement and 9 gaps in cross-document coherence. Limitations documented below. Safe to proceed to Phase 3 with notes.

---

## INVEST Analysis Results

| Story | Title | Score | Status | Issue |
|-------|-------|:-----:|:------:|-------|
| US-001 | Connect Yandex email | 92 | ✅ READY | — |
| US-002 | Connect Mail.ru email | 86 | ✅ READY | Shared infra with US-001 |
| US-003 | Connect custom SMTP | 92 | ✅ READY | — |
| US-004 | View health score | 80 | ✅ READY | Health formula undefined |
| US-005 | Unlimited accounts | 68 | ⚠️ FAIR | No testable criteria; rewrite needed |
| US-010 | Start warmup | 77 | ✅ READY | XL effort |
| US-011 | View warmup progress | 89 | ✅ READY | — |
| US-012 | Warmup notification | 90 | ✅ READY | — |
| US-013 | Warmup for Yandex | 53 | ⚠️ FAIR | XL, unresolved Q-002/Q-004 |
| US-014 | Warmup for Mail.ru | 53 | ⚠️ FAIR | Same as US-013 |
| US-020 | AI template from description | 86 | ✅ READY | — |
| US-021 | AI personalize per lead | 75 | ✅ READY | Depends on lead data |
| US-022 | Edit AI text | 96 | ✅ READY | — |
| US-023 | Select tone | 87 | ✅ READY | — |
| US-024 | AI uses company data | 68 | ⚠️ FAIR | Data source undefined |
| US-030 | Create sequence | 83 | ✅ READY | — |
| US-031 | Set delay | 93 | ✅ READY | — |
| US-032 | Sequence stops on reply | 87 | ✅ READY | — |
| US-033 | Use variables | 92 | ✅ READY | — |
| US-034 | Schedule sending | 89 | ✅ READY | — |
| US-040 | Campaign wizard | 71 | ⚠️ FAIR | Too large; decompose |
| US-041 | Upload CSV | 90 | ✅ READY | — |
| US-042 | Start/pause/stop | 90 | ✅ READY | — |
| US-043 | View status | 95 | ✅ READY | — |
| US-044 | Assign accounts | 85 | ✅ READY | — |
| US-050 | Unibox view all | 79 | ✅ READY | L effort |
| US-051 | Filter by status | 90 | ✅ READY | — |
| US-052 | Reply from Unibox | 84 | ✅ READY | — |
| US-053 | Change lead status | 91 | ✅ READY | — |
| US-060 | View metrics | 81 | ✅ READY | Open tracking undefined |
| US-061 | Analytics per campaign | 89 | ✅ READY | — |
| US-062 | Warmup health | 85 | ✅ READY | Overlaps US-004/US-011 |
| US-063 | Filter by period | 94 | ✅ READY | — |

---

## Cross-Document Coherence: 87/100

### Consistent (no issues)

- Data structures match ER diagram
- All 8 ADR decisions reflected in Architecture.md
- 152-ФЗ/Docker/VPS constraints fully respected
- Redis key patterns match algorithmic usage
- Database indexes match query patterns

### Contradictions Found

| # | Severity | Issue | Resolution |
|---|:--------:|-------|------------|
| 1 | LOW | Tone: PRD says "creative", Pseudocode says "friendly" | Standardize to "formal/casual/friendly" |
| 2 | MEDIUM | Alert threshold: NFR says p99<500ms, Prometheus alerts at >2s | Tighten alert to >500ms |
| 3 | LOW | Daily limit: PRD says Yandex max 500/day, default is 50 | Document: default=50 (safe), max=500 (provider limit) |

### Missing Items (Gap Register)

| # | Gap | Severity | Fix |
|---|-----|:--------:|-----|
| 1 | UniboxMessage type not defined in Pseudocode | LOW | Add type definition |
| 2 | IMAP credentials missing from EmailAccount type | LOW | Add imap_username, imap_password (encrypted) |
| 3 | `completed_no_reply` status missing from Lead enum | LOW | Add to Lead status |
| 4 | No compliance API endpoint | MEDIUM | Add POST /compliance/check |
| 5 | No user profile/settings API | MEDIUM | Add GET/PATCH /users/me |
| 6 | No billing/plan API | LOW | Add for v1.0 |
| 7 | Audit log mechanism missing | MEDIUM | Add AuditLog entity |
| 8 | Data retention/deletion not described | MEDIUM | Add 30-day deletion policy |
| 9 | Sender identification fields missing | LOW | Add company_name, contact_info to User |

---

## Recommendations (Top 5)

### 1. Decompose warmup stories (US-013, US-014)

Split each into sub-stories: warmup pool setup, provider-specific patterns, inbox-rate measurement, adaptive throttling. Resolve open questions Q-002 (max safe volume) and Q-004 (minimum warmup period) via spike before sprint commitment.

### 2. Split campaign wizard (US-040)

Decompose into: US-040a (wizard shell + naming), US-040b (lead selection), US-040c (sequence selection), US-040d (settings + launch).

### 3. Add testable criteria to US-005

Rewrite from "unlimited accounts" to "Support up to 100 accounts per workspace in MVP" with performance benchmark.

### 4. Fix 3 contradictions

- Tone: standardize to "formal/casual/friendly"
- Alert threshold: 500ms (match NFR)
- Daily limit: document the default vs max relationship

### 5. Fill 9 gaps in Pseudocode/Architecture

Add missing type definitions, API endpoints, and mechanisms (audit log, data retention, compliance API).

---

## Overall Assessment

| Area | Score | Status |
|------|:-----:|:------:|
| User Stories (INVEST) | 83.5/100 | ✅ Good |
| Acceptance Criteria (SMART) | 85/100 | ✅ Good |
| Architecture Coherence | 87/100 | ✅ Good |
| Cross-doc Consistency | 82/100 | ⚠️ Caveats (9 gaps) |
| Constraint Compliance | 100/100 | ✅ Full |
| **WEIGHTED AVERAGE** | **85/100** | **🟡 CAVEATS** |

---

## Exit Criteria Check

| Criterion | Met? |
|-----------|:----:|
| All scores ≥50 | ✅ Yes |
| Average ≥70 | ✅ Yes (85) |
| No contradictions (critical) | ✅ Yes (0 critical) |
| BLOCKED items | ✅ 0 |

**Verdict: 🟡 CAVEATS — safe to proceed to Phase 3 with documented warnings.**
