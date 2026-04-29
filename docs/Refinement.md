# Refinement: ColdMail.ru

**Date:** 2026-04-29
**Purpose:** Edge cases, testing strategy, performance optimizations, security hardening

---

## Edge Cases Matrix

| # | Scenario | Input | Expected Behavior | Handling |
|---|----------|-------|-------------------|----------|
| 1 | Empty CSV upload | 0 rows or headers only | Show error "Файл пуст или содержит только заголовки" | Validate before import |
| 2 | CSV with 100K+ rows | Large file | Queue processing, show progress bar, max 50K per campaign | Chunked processing |
| 3 | Duplicate leads in campaign | Same email twice | Skip duplicate, show count of skipped | Dedup by email |
| 4 | Lead email bounces on first send | Invalid address | Mark as "bounced", remove from sequence, never retry | Hard bounce handling |
| 5 | All accounts hit daily limit | 0 remaining capacity | Pause campaign, resume next day | Capacity check |
| 6 | Warmup peer pool exhausted | No available warmup partners | Reduce warmup volume, alert admin | Graceful degradation |
| 7 | SMTP connection drops mid-send | Network error | Retry 3x with exponential backoff, then fail job | Retry strategy |
| 8 | AI API timeout | >10s response | Use template fallback, log warning | Fallback chain |
| 9 | User deletes account with active campaigns | Delete request | Pause all campaigns, show confirmation, 30-day grace | Soft delete |
| 10 | Concurrent campaign edits | Two tabs editing same campaign | Last write wins, no conflict resolution (MVP) | Accept simplicity |
| 11 | Yandex blocks SMTP for suspected spam | 550 error | Auto-pause account, increase warmup, notify user | Provider-specific handling |
| 12 | Lead replies with out-of-office | Auto-reply detected | Don't count as reply, reschedule +3 days | OOO detection |
| 13 | Email with broken UTF-8 | Corrupted CSV data | Sanitize on import, replace invalid chars | Input sanitization |
| 14 | User changes timezone mid-campaign | Schedule shift | Apply to future sends only, don't resend | Immutable past |
| 15 | Free plan user hits 500 email limit | Attempt to send #501 | Block send, show upgrade CTA | Quota enforcement |

---

## Testing Strategy

### Unit Tests (target: 80% coverage for core modules)

| Module | Critical Functions | Test Count |
|--------|-------------------|:----------:|
| auth | register, login, refresh, password hash | 12 |
| accounts | connect, disconnect, encrypt/decrypt credentials | 10 |
| campaigns | create, start, pause, resume, complete | 15 |
| sequences | render template, variable substitution, fallback | 10 |
| warmup | calculate volume, peer selection, health check | 12 |
| email | build message, add tracking, handle bounce | 15 |
| ai | build prompt, validate output, quality score | 8 |
| leads | import CSV, dedup, status transitions | 12 |
| analytics | aggregate metrics, calculate rates | 8 |
| **Total** | | **~102** |

### Integration Tests

| Test ID | Scenario | Steps | Expected |
|---------|----------|-------|----------|
| IT-001 | Full campaign lifecycle | Create → Add leads → Start → Send → Reply → Complete | All states transition correctly |
| IT-002 | Account connection (Yandex) | Enter credentials → Test → Save | Account created with "connected" status |
| IT-003 | CSV import with 1000 leads | Upload CSV → Process | 1000 leads imported, correct fields |
| IT-004 | Warmup cycle execution | Start warmup → Run 1 cycle | Warmup jobs created, emails sent |
| IT-005 | AI generation + personalization | Request → Generate → Validate | Email generated with quality score |
| IT-006 | Bounce detection | Receive bounce email → Process | Lead marked bounced, sequence stopped |
| IT-007 | Reply detection | Receive reply → Process | Unibox message created, sequence stopped |
| IT-008 | Rate limiting | Send 101 requests in 1 min | 101st request gets 429 |

### E2E Tests (Playwright)

| Test ID | Journey | Steps |
|---------|---------|-------|
| E2E-001 | New user onboarding | Register → Connect account → Start warmup → Wait → Create campaign |
| E2E-002 | Campaign creation wizard | New campaign → Upload CSV → Configure sequence → Set schedule → Launch |
| E2E-003 | Unibox reply workflow | Open Unibox → Read reply → Change status → Reply to lead |
| E2E-004 | AI email generation | Open AI generator → Enter product → Select tone → Generate → Edit → Save |
| E2E-005 | Analytics dashboard | Open Analytics → Filter by campaign → Check metrics → Export |

### Performance Tests

| Test | Tool | Target | Scenario |
|------|------|--------|----------|
| API load | k6 | 100 RPS, p99 < 500ms | Mixed GET/POST requests |
| Email throughput | Custom | 10K emails/hour | BullMQ worker stress test |
| CSV import | Custom | 50K rows < 30s | Large file processing |
| Concurrent users | k6 | 50 concurrent, no errors | Simulated real usage |
| Database | pgbench | 500 TPS | Transaction throughput |

---

## Performance Optimizations

### Database

| Optimization | Impact | Implementation |
|-------------|--------|----------------|
| Connection pooling | Prevent exhaustion | PgBouncer (max 100 connections) |
| Query indexing | Fast reads | Composite indexes on hot queries |
| Pagination | Memory control | Cursor-based for large lists (leads, messages) |
| Partial indexes | Fast filtered queries | `WHERE status = 'queued'` on email_messages |
| VACUUM scheduling | Prevent bloat | Weekly VACUUM ANALYZE on large tables |

### Application

| Optimization | Impact | Implementation |
|-------------|--------|----------------|
| Response caching | Reduce DB load | Redis cache for analytics (TTL 10min) |
| Batch processing | Throughput | Process leads in batches of 100 for sending |
| Lazy loading | Page speed | Code-split routes, lazy load components |
| Queue prioritization | UX | High priority for user-initiated actions |
| Connection reuse | SMTP efficiency | Pool SMTP connections per account |

### Frontend

| Optimization | Impact | Implementation |
|-------------|--------|----------------|
| Bundle splitting | Initial load | Route-based code splitting |
| Image optimization | Load time | WebP, lazy loading |
| Virtual scrolling | Large lists | react-virtual for 1000+ lead tables |
| Optimistic updates | Perceived speed | Update UI before API confirms |
| Service worker | Offline resilience | Cache static assets |

---

## Security Hardening

### Input Validation

| Input | Validation | Sanitization |
|-------|-----------|--------------|
| Email addresses | RFC 5322 regex + MX lookup | Trim, lowercase |
| Passwords | Min 8 chars, complexity | — |
| Campaign names | Max 200 chars | HTML escape |
| Email body (HTML) | Allowlist tags | DOMPurify sanitize |
| CSV files | Max 10MB, UTF-8 | Strip BOM, normalize encoding |
| API parameters | Zod schema validation | Type coercion |
| URLs (tracking) | Valid URL format | Encode |

### Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Audit Log Events

| Event | Data Logged | Retention |
|-------|-------------|-----------|
| user.login | user_id, IP, user_agent, success/fail | 90 days |
| user.password_change | user_id, IP | 1 year |
| account.connected | user_id, account_email, provider | 1 year |
| campaign.started | user_id, campaign_id, lead_count | 1 year |
| campaign.paused | user_id, campaign_id, reason | 1 year |
| data.exported | user_id, data_type, record_count | 1 year |
| data.deleted | user_id, data_type, record_count | 1 year |

---

## Accessibility (a11y)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All interactive elements focusable, tab order logical |
| Color contrast | WCAG AA: 4.5:1 for text (dark theme verified) |
| Screen reader | ARIA labels on icons, status announcements |
| Focus indicators | Visible focus ring on all controls |
| Motion | Respect prefers-reduced-motion |

---

## Technical Debt Items (Known Shortcuts in MVP)

| # | Shortcut | Proper Solution | Priority |
|---|----------|-----------------|----------|
| 1 | No WebSocket (polling for Unibox) | WebSocket for real-time replies | v1.0 |
| 2 | Single VPS (no HA) | Multi-AZ deployment | v1.1 |
| 3 | No email verification service | Integrate ZeroBounce/similar | v1.0 |
| 4 | Basic warmup (no ML) | ML-based warmup optimization | v2.0 |
| 5 | No A/B testing | Built-in split testing | v1.0 |
| 6 | Manual backup restoration | Automated point-in-time recovery | v1.0 |
| 7 | No multi-tenant (agency) | Workspace isolation | v1.0 |
| 8 | OpenAI only (no fallback LLM) | Multi-LLM with fallback | v1.1 |
