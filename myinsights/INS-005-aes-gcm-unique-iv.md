# INS-005: AES-256-GCM needs unique IV per encryption operation

**Status:** Active
**Created:** 2026-04-29
**Hits:** 0

## Error Signature
- Reusing IV with same key → same ciphertext for same plaintext
- Enables known-plaintext attacks on SMTP credentials

## Root Cause
AES-GCM is a stream cipher mode. Reusing (key, IV) pair breaks confidentiality guarantees. IV must be unique for every encryption call.

## Solution
In `src/common/encryption.service.ts`:
- Generate random 16-byte IV via `crypto.randomBytes(16)` for EVERY encrypt call
- Prepend IV to ciphertext: `[IV:16 bytes][authTag:16 bytes][ciphertext]`
- On decrypt: extract IV from first 16 bytes, authTag from next 16

## Prevention
- Never hardcode or reuse IV
- Store IV alongside ciphertext (not separately)
- Test: encrypt same value twice → ciphertexts must differ
