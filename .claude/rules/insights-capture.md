# Insights Capture: ColdMail.ru

## Error-First Lookup Protocol

Before debugging any issue, ALWAYS follow this sequence:

1. **Search the insights index FIRST**: `grep -i "<keyword>" docs/insights/INDEX.md`
2. If a matching insight exists, read the linked insight file and apply the documented solution
3. Only if no matching insight is found, proceed with standard debugging
4. After resolving a novel issue, evaluate whether to capture it as an insight

This prevents re-discovering solutions to problems that have already been solved.

## Insight File Format

```markdown
# Insight: {descriptive-title}

**Date:** {YYYY-MM-DD}
**Category:** {bug|gotcha|pattern|performance|provider|integration}
**Module:** {auth|accounts|campaigns|sequences|leads|warmup|email|ai|unibox|analytics|compliance|infra}

## Problem
{What went wrong or what was discovered}

## Root Cause
{Why it happened}

## Solution
{What fixed it, with code snippets if applicable}

## Prevention
{How to avoid this in the future}
```

Insights are stored in `docs/insights/` with filenames like `{YYYY-MM-DD}-{slug}.md`.
The index file `docs/insights/INDEX.md` contains a searchable table of all insights.

## When to Suggest Capturing an Insight

Suggest capturing an insight when ANY of these 5 conditions are met:

1. **Provider-specific behavior**: A Yandex, Mail.ru, or other email provider behaves unexpectedly (e.g., rate limits differ from documentation, specific error codes require special handling, SMTP/IMAP quirks)

2. **Debugging took more than 30 minutes**: If a bug required significant investigation, the resolution is worth documenting so the next person (or AI) finds it in seconds

3. **Workaround for a library limitation**: When Prisma, BullMQ, Nodemailer, imapflow, or any dependency requires a non-obvious workaround (e.g., BigInt serialization, stalled job handling, connection pool tuning)

4. **Configuration that differs from defaults**: When a production configuration deviates from library/framework defaults and the reason is not obvious (e.g., PgBouncer pool size, BullMQ stalledInterval, Redis maxmemory policy)

5. **Pattern that should be replicated**: When a solution introduces a pattern that other modules should follow (e.g., a retry strategy, an error handling approach, a testing technique for external APIs)

## When NOT to Suggest Capturing an Insight

Do NOT suggest an insight when ANY of these 4 conditions apply:

1. **Typo or simple syntax error**: If the fix was correcting a typo, missing import, or syntax mistake -- these are not insights, they are routine corrections

2. **Well-documented behavior**: If the issue and solution are clearly covered in the official documentation of the library/framework (link to the docs instead)

3. **One-off data fix**: If the issue was caused by corrupted data in a specific environment and required a manual database fix that will never recur

4. **Already captured**: If `grep` on the insights index already returns a matching entry -- do not create duplicates. Update the existing insight if new information was found

## Index Maintenance

When creating a new insight:

1. Create the insight file in `docs/insights/`
2. Add a row to `docs/insights/INDEX.md`:

```markdown
| {date} | {category} | {module} | [{title}](./{filename}.md) | {one-line summary} |
```

3. Keep the index sorted by date (newest first)

## Search Keywords

When searching the index, try multiple keyword strategies:
- Error message text (e.g., "550", "ECONNREFUSED", "stalled")
- Provider name (e.g., "yandex", "mailru")
- Library name (e.g., "prisma", "bullmq", "nodemailer")
- Module name (e.g., "warmup", "email", "ai")
- Symptom description (e.g., "timeout", "duplicate", "memory")
