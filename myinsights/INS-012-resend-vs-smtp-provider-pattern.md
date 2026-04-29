# INS-012: Multi-provider email sending (SMTP + Resend) pattern

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Context
Users need choice between SMTP (self-hosted, Yandex/Mail.ru) and Resend (API-based, simpler setup). Provider selection stored in UserSettings, not hardcoded.

## Pattern
- Store `email_provider` enum in user settings ("smtp" | "resend")
- EmailService checks provider → delegates to SmtpTransport or ResendService
- API keys encrypted with AES-256-GCM in DB, masked in API responses
- Each provider has its own `test` endpoint for connection verification
- Resend API is simple REST (no npm package needed — just fetch)

## Reuse
This provider-selection pattern applies to any service with multiple backends:
SMS (Twilio vs SMS.ru), push notifications (FCM vs APNS), payment (Stripe vs YooKassa).

## Prevention
- Always validate API key before saving (test endpoint)
- Never expose full API key in GET response (mask with ****)
- Support fallback: if Resend fails → can user switch to SMTP without data loss
