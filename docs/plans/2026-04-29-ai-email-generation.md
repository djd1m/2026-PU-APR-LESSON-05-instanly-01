# Plan: F005 AI Email Generation

## Goal
Интеграция OpenAI GPT-4o-mini для генерации и персонализации B2B cold emails на русском.

## Tasks
- [x] ai.module.ts — overwrite stub
- [x] ai.controller.ts — generate-email, personalize endpoints
- [x] ai.service.ts — prompt building, timeout, validation, quality scoring
- [x] ai.constants.ts — spam words, model config
- [x] dto/index.ts — GenerateEmailDto, PersonalizeEmailDto

## Files
- src/ai/ai.module.ts
- src/ai/ai.controller.ts
- src/ai/ai.service.ts
- src/ai/ai.constants.ts
- src/ai/dto/index.ts

## Dependencies
- F004 lead-management (done) — leads provide personalization data

## Status: DONE
