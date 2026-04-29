# INS-015: Deterministic UUIDs must use hex chars only (0-9, a-f)

**Status:** Active
**Created:** 2026-04-29
**Hits:** 1

## Error Signature
- Prisma P2023: "Error creating UUID, invalid character"
- Characters like 's', 'u', 'g' used in hand-crafted UUID strings

## Root Cause
UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` where x is hex only (0-9, a-f).
Using mnemonic letters (s=sequence, u=unibox, c=campaign) in UUIDs breaks PostgreSQL.

## Solution
Use only hex chars: 0123456789abcdef. For mnemonics use hex-safe letters: a,b,c,d,e,f.
- Sequence → use 'a' prefix: `0000000000a1`
- UniboxMessage → use 'd' prefix: `000000000d01`
- Campaign → use 'c' prefix (valid hex): `000000000c01`

## Prevention
- Validate UUIDs with regex before inserting: `/^[0-9a-f]{8}-[0-9a-f]{4}-...$`/
- Or use `crypto.randomUUID()` instead of hand-crafted deterministic UUIDs
