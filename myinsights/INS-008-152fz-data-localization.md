# INS-008: 152-FZ requires all PII on Russian servers since July 2025

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Context
Federal Law 152-FZ mandates all personal data of Russian citizens must be stored on servers physically located in Russia. Effective July 1, 2025. Fines up to 15M RUB.

## What counts as PII
- Email addresses, names, phone numbers
- Mailing lists, CRM records, campaign archives
- SMTP logs containing recipient addresses
- CSV uploads with lead data

## Solution
- All servers: AdminVPS (Moscow) / HOSTKEY (SPb) — physically in Russia
- No CDN for user data (only static assets)
- OpenAI API calls: only send anonymized context, never full lead PII
- Backups: same DC, different server (still in Russia)

## Prevention
- Never use cloud providers without Russian DCs (Hetzner, AWS eu-west, etc.)
- Audit all external API calls for PII leakage
- Include 152-FZ compliance check in /deploy pre-deploy checklist
