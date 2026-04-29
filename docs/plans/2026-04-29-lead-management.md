# Plan: F004 Lead Management

## Goal
Полный CRUD для лидов + импорт из CSV с дедупликацией и валидацией email.

## Tasks
- [x] leads.module.ts — overwrite stub
- [x] leads.controller.ts — CRUD + CSV import endpoint
- [x] leads.service.ts — findAll, create, importCsv, update, delete
- [x] csv-import.service.ts — parsing, email validation, dedup, column mapping
- [x] dto/index.ts — CreateLeadDto, UpdateLeadDto, ImportLeadsDto, LeadFilterDto

## Files
- src/leads/leads.module.ts
- src/leads/leads.controller.ts
- src/leads/leads.service.ts
- src/leads/csv-import.service.ts
- src/leads/dto/index.ts

## Dependencies
- F001 auth-system (done)

## Status: DONE
