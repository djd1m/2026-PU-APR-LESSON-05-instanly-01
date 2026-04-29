# INS-001: Yandex SMTP warmup requires graduated volume

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Error Signature
- Yandex blocks account after sudden spike in email volume
- Error: 550 "Message rejected under suspicion of SPAM"

## Symptoms
- New account sends 50+ emails on day 1 → blocked
- Warmup shows green but real campaign emails land in spam

## Root Cause
Yandex anti-spam tracks sending volume patterns. Sudden jumps from 0 to 50+ emails trigger automatic blocking. Volume must increase gradually over 14-21 days.

## Solution
Graduated warmup schedule:
- Day 1-3: 5 emails/day
- Day 4-7: 8-17 emails/day
- Day 8-14: 19-31 emails/day
- Day 15+: max 50 emails/day

Implemented in `src/warmup/warmup.service.ts` → `calculateWarmupVolume()` and `src/workers/warmup.processor.ts`.

## Prevention
- Never allow manual override of warmup volume above calculated limit
- Monitor inbox rate during warmup, auto-pause if drops below 60%
- Use random intervals between sends (not evenly spaced)
