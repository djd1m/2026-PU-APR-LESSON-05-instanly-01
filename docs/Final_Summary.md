# ColdMail.ru — Executive Summary

## Overview

ColdMail.ru — AI-платформа для автоматизации B2B cold email outreach в России. Продукт решает проблему недоступности западных инструментов (Instantly.ai, Lemlist) из-за санкций, предоставляя российским бизнесам полный стек: AI-генерацию персонализированных писем, warmup для Yandex/Mail.ru, email sequences и аналитику — с полным соответствием 152-ФЗ и хранением данных в РФ.

## Problem & Solution

**Problem:** Российские B2B-компании не могут масштабировать cold email: западные SaaS заблокированы (санкции + невозможность оплаты), российские альтернативы ограничены (2 конкурента), warmup для Yandex/Mail.ru не существует как ready-made решение. Ручной outreach стоит 150-300К ₽/мес (SDR-менеджер).

**Solution:** AI-first cold email платформа с:
- Собственным warmup engine для Yandex/Mail.ru (ключевой дифференциатор)
- AI-генерацией персонализированных писем на русском (GPT-4o-mini)
- Безлимитными email-аккаунтами за flat rate
- Compliance 152-ФЗ (серверы в РФ) и 38-ФЗ (подсказки)
- Рублёвой оплатой, российским юрлицом

## Target Users

| Persona | Доля | Avg Revenue |
|---------|:----:|:-----------:|
| B2B-предприниматели и стартапы | 40% | 3,900 ₽/мес |
| Digital-агентства лидогенерации | 35% | 14,900 ₽/мес |
| SMB-отделы продаж | 25% | 7,900 ₽/мес |

## Key Features (MVP — 3 months)

1. **Email Account Management** — подключение Yandex/Mail.ru/SMTP, health monitoring
2. **Warmup Engine** — автоматический прогрев для российских провайдеров (85%+ inbox rate)
3. **AI Email Generation** — персонализация каждого письма нейросетью (8-15% reply rate)
4. **Email Sequences** — автоматические follow-up цепочки (3-5 шагов)
5. **Campaign Management** — wizard создания, scheduling, sending limits
6. **Unibox** — единый inbox для всех ответов
7. **Analytics** — sent/opened/replied/bounced метрики

## Technical Approach

- **Architecture:** Distributed Monolith (Monorepo), Docker Compose
- **Tech Stack:** React/Next.js + NestJS + PostgreSQL + Redis + BullMQ
- **Infrastructure:** VPS в России (AdminVPS/HOSTKEY), 152-ФЗ compliant
- **AI:** OpenAI GPT-4o-mini для генерации, с fallback на шаблоны
- **Key Differentiators:** Warmup для Yandex/Mail.ru (нет аналогов), AI-first подход, compliance by design

## Research Highlights

1. **Рынок пуст:** всего 2 прямых конкурента (Coldy.ai, Respondo) vs 20+ на Западе
2. **Принудительный спрос:** санкции + 152-ФЗ заставляют искать отечественные решения
3. **SAM:** 1-1.5 млрд ₽ (cold email сегмент РФ), рост ~10% + импортозамещение ~25%
4. **#1 боль клиентов Instantly:** deliverability не соответствует обещаниям → наш фокус на warmup
5. **AI-тренд:** 60% организаций внедрят AI sales engagement к 2026; ROI lift 20-25%

## Success Metrics

| Metric | Target (6 мес) | Target (12 мес) |
|--------|:--------------:|:---------------:|
| Paying customers | 100 | 500 |
| MRR | 400K ₽ | 2M ₽ |
| Avg inbox rate (Yandex) | >85% | >92% |
| AI reply rate | >8% | >12% |
| Monthly churn | <8% | <6% |

## Timeline & Phases

| Phase | Features | Timeline |
|-------|----------|----------|
| **MVP** | Core platform (7 features above) | Month 1-3 |
| **v1.0** | Agency mode, AmoCRM, A/B testing, API | Month 4-6 |
| **v1.1** | Bitrix24, email verification, lead scoring | Month 7-9 |
| **v2.0** | Lead database, AI Reply Agent, automations | Month 10-12 |
| **v3.0** | Multichannel, white-label, enterprise | Year 2 |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Warmup не достигает 85%+ inbox rate | Итеративная разработка; manual warmup как fallback |
| Yandex ужесточает anti-spam | Адаптивные алгоритмы; мониторинг; multi-provider |
| AI-генерация низкого качества | Fine-tuning промптов; A/B тест; шаблоны как fallback |
| Coldy.ai копирует фичи | Скорость итераций; data moat; brand building |
| Рынок мал | Расширение на СНГ; additional revenue streams |

## Immediate Next Steps

1. **Setup проекта:** Docker Compose scaffold, CI/CD, dev environment
2. **Backend foundation:** Auth, accounts, basic CRUD
3. **Warmup MVP:** Minimum viable warmup engine (Yandex-first)
4. **AI integration:** OpenAI connection, prompt engineering for Russian B2B
5. **Frontend shell:** Dark UI, navigation, first screens

## Documentation Package

| Document | Purpose |
|----------|---------|
| `PRD.md` | Product requirements, personas, features |
| `Solution_Strategy.md` | Problem analysis, TRIZ, game theory |
| `Specification.md` | User stories, acceptance criteria (Gherkin) |
| `Pseudocode.md` | Algorithms, data structures, API contracts |
| `Architecture.md` | System design, tech stack, infrastructure |
| `Refinement.md` | Edge cases, testing, optimization |
| `Completion.md` | Deployment, CI/CD, monitoring |
| `Research_Findings.md` | Market research, competitive analysis |
| `Product_Discovery_Brief.md` | Original discovery (Phase 0) |
| `CJM_Prototype.html` | Interactive CJM with 3 variants |
