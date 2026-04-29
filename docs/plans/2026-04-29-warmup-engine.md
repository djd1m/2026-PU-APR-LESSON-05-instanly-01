# Plan: F003 Warmup Engine

## Goal
Реализовать сервисный слой и REST API для warmup engine (processor уже существует).

## Tasks
- [x] warmup.module.ts — overwrite stub
- [x] warmup.controller.ts — start/stop/status/pool-stats
- [x] warmup.service.ts — volume calculation, inbox rate, health color
- [x] dto/index.ts — response types

## Files
- src/warmup/warmup.module.ts
- src/warmup/warmup.controller.ts
- src/warmup/warmup.service.ts
- src/warmup/dto/index.ts

## Dependencies
- F002 email-accounts (done)
- src/workers/warmup.processor.ts (exists)

## Status: DONE
