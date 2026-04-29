# INS-002: OpenAI Russian B2B prompt needs spam word filtering

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Error Signature
- AI-generated email contains "БЕСПЛАТНО", "ГАРАНТИЯ 100%", "СРОЧНО"
- Emails with these words have 3x higher spam filter rate

## Root Cause
GPT-4o-mini sometimes generates marketing-style text with spam trigger words even when prompted for professional B2B tone. Russian spam filters are especially sensitive to capitalized trigger words.

## Solution
Post-generation validation in `src/ai/ai.service.ts` → `validateOutput()`:
- Check against 20-word Russian spam word list in `ai.constants.ts`
- Reject and regenerate if spam words detected (1 retry)
- Fallback to template with variable substitution if both attempts fail

## Prevention
- Always validate AI output before sending
- Quality score (1-10) penalizes emails with near-spam patterns
- Prompt explicitly states "НЕ используй: спам-слова, обещания гарантий, caps lock"
