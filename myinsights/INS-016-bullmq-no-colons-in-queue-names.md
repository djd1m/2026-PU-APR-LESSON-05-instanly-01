# INS-016: BullMQ queue names cannot contain colons

**Status:** Active
**Created:** 2026-04-29
**Hits:** 1

## Error Signature
- NestJS startup crash: "Queue name cannot contain :"
- BullMQ throws at QueueBase constructor

## Root Cause
BullMQ uses `:` internally as Redis key separator. Queue names with `:` (like `email:send`) conflict with BullMQ's internal key format.

## Solution
Use hyphens instead: `email-send`, `warmup-run`, `imap-check`.

## Prevention
- Never use `:` in BullMQ queue names
- Use kebab-case: `email-send`, `ai-generate`, `analytics-update`
