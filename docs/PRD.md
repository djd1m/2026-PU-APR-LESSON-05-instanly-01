# Product Requirements Document

**Product:** ColdMail.ru — AI-платформа холодного B2B email-аутрича для РФ
**Version:** 0.1
**Author:** Claude AI (SPARC Generator)
**Last Updated:** 2026-04-29
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Purpose

ColdMail.ru — web-платформа для автоматизации холодного B2B email-аутрича на российском рынке. Продукт объединяет AI-генерацию персонализированных писем, warmup email-аккаунтов для Yandex/Mail.ru, автоматические email-sequences и аналитику — с полным соответствием 152-ФЗ.

### 1.2 Scope

**In Scope (MVP):**
- Подключение email-аккаунтов (Yandex, Mail.ru, custom SMTP)
- Warmup engine для российских email-провайдеров
- AI-генерация персонализированных писем на русском языке
- Email sequences (цепочки до 5 шагов)
- Unified inbox (Unibox) для ответов
- Базовая аналитика (sent, opened, replied, bounced)
- Compliance-подсказки (38-ФЗ)
- Управление лидами (импорт CSV, ручное добавление)

**Out of Scope (MVP):**
- Lead database / поиск контактов
- CRM-интеграции (AmoCRM, Bitrix24)
- AI Reply Agent
- Multichannel (WhatsApp, VK)
- A/B тестирование
- Automations / workflows
- White-label / agency multi-tenant
- Mobile app

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|------------|
| Cold email | Письмо потенциальному клиенту без предварительного согласия (деловое предложение) |
| Warmup | Постепенное увеличение объёма отправки для установления email-репутации |
| Sequence | Цепочка автоматических follow-up писем |
| Unibox | Единый интерфейс для чтения ответов со всех email-аккаунтов |
| Bounce | Недоставленное письмо (hard bounce = невалидный адрес) |
| Inbox rate | Процент писем, попавших во "Входящие" (не в спам) |
| 152-ФЗ | Федеральный закон о персональных данных |
| 38-ФЗ | Федеральный закон о рекламе |

---

## 2. Product Vision

### 2.1 Vision Statement

> Стать #1 платформой для B2B cold email в России, где AI пишет письма лучше менеджера, а deliverability гарантирована для Yandex/Mail.ru.

### 2.2 Problem Statement

**Problem:** Российские B2B-компании не могут масштабировать cold email outreach: западные инструменты недоступны (санкции), российские альтернативы ограничены, warmup для Yandex/Mail.ru не существует как ready-made решение.

**Impact:** Бизнес теряет 150-300К ₽/мес на ручной outreach (SDR-менеджеры) или вовсе отказывается от канала.

**Current Solutions:**
- Coldy.ai (2,900 ₽/мес) — молодой, ограниченный функционал
- Respondo (1,990 ₽/мес) — лимит 2,000 контактов
- Ручная рассылка через AmoCRM/Bitrix24 — не масштабируется
- Обходные пути для оплаты Instantly.ai — рискованно, ненадёжно

### 2.3 Success Metrics

| Metric | Current (market) | Target (6 мес) | Target (12 мес) |
|--------|-----------------|----------------|-----------------|
| Registered users | 0 | 1,000 | 5,000 |
| Paying customers | 0 | 100 | 500 |
| MRR | 0 | 400K ₽ | 2M ₽ |
| Avg inbox rate (Yandex) | — | >85% | >92% |
| AI-generated reply rate | — | >8% | >12% |
| Monthly churn | — | <8% | <6% |
| NPS | — | >40 | >50 |

---

## 3. Target Users

### 3.1 Primary Persona: "Андрей — B2B предприниматель"

| Attribute | Description |
|-----------|-------------|
| **Role** | Основатель B2B-стартапа / solo-предприниматель |
| **Demographics** | М, 28-45, Москва/СПб/remote, доход 200-500К ₽/мес |
| **Goals** | Найти клиентов без найма SDR-команды; автоматизировать outreach |
| **Pain Points** | Нет времени на ручные рассылки; страх спама; не знает email-инфраструктуру |
| **Technical Proficiency** | Medium (знает CRM, не знает SMTP/DKIM) |
| **Usage Frequency** | Daily (проверка ответов) + Weekly (запуск кампаний) |
| **Budget** | 3,000-10,000 ₽/мес на инструменты продаж |

### 3.2 Secondary Persona: "Мария — руководитель digital-агентства"

| Attribute | Description |
|-----------|-------------|
| **Role** | CEO/COO агентства лидогенерации, 5-15 сотрудников |
| **Demographics** | Ж/М, 30-45, РФ, доход агентства 1-5М ₽/мес |
| **Goals** | Управлять outreach для 5-10 клиентов одновременно |
| **Pain Points** | Per-seat pricing дорого; нужен мульти-клиент дашборд; отчёты для клиентов |
| **Technical Proficiency** | High (понимает deliverability, DKIM, warmup) |
| **Usage Frequency** | Daily (мониторинг всех клиентов) |
| **Budget** | 10,000-30,000 ₽/мес |

### 3.3 Anti-Personas (Who this is NOT for)

- Enterprise с >1000 сотрудников (им нужен Outreach.io / Salesloft уровень)
- B2C email-маркетологи (им нужен Unisender/Sendsay)
- Спамеры (массовые рассылки по купленным базам без таргетинга)
- Компании без B2B-продукта (нет ценностного предложения для cold email)

---

## 4. Requirements

### 4.1 Functional Requirements

#### 4.1.1 Feature: Email Account Management

**Description:** Подключение, управление и мониторинг email-аккаунтов для отправки.

| ID | As a... | I want to... | So that... | Priority | Effort |
|----|---------|--------------|------------|----------|--------|
| US-001 | User | Подключить Yandex email через IMAP/SMTP | Отправлять cold emails с этого аккаунта | Must | M |
| US-002 | User | Подключить Mail.ru email | Использовать для рассылки | Must | M |
| US-003 | User | Подключить custom SMTP | Использовать свой почтовый сервер | Must | S |
| US-004 | User | Видеть health score каждого аккаунта | Понимать готовность к рассылке | Must | M |
| US-005 | User | Подключить неограниченное число аккаунтов | Масштабировать отправку | Should | S |

#### 4.1.2 Feature: Warmup Engine

**Description:** Автоматический прогрев email-аккаунтов для достижения высокого inbox rate.

| ID | As a... | I want to... | So that... | Priority | Effort |
|----|---------|--------------|------------|----------|--------|
| US-010 | User | Запустить warmup одним кликом | Аккаунт прогрелся автоматически | Must | XL |
| US-011 | User | Видеть прогресс warmup (дни, объём, inbox rate) | Знать когда аккаунт готов | Must | M |
| US-012 | User | Получить уведомление когда warmup завершён | Начать кампанию вовремя | Should | S |
| US-013 | User | Warmup работал для Yandex.Mail | Письма доходили до Yandex-inbox | Must | XL |
| US-014 | User | Warmup работал для Mail.ru | Письма доходили до Mail.ru-inbox | Must | XL |

#### 4.1.3 Feature: AI Email Generation

**Description:** Генерация персонализированных B2B-писем с помощью AI.

| ID | As a... | I want to... | So that... | Priority | Effort |
|----|---------|--------------|------------|----------|--------|
| US-020 | User | Описать свой продукт и получить AI-шаблон | Быстро создать первое письмо | Must | L |
| US-021 | User | AI персонализировал письмо под каждого лида | Reply rate был выше шаблонов | Must | L |
| US-022 | User | Редактировать AI-сгенерированный текст | Контролировать messaging | Must | S |
| US-023 | User | Выбирать тон (formal/casual/creative) | Подстроить под аудиторию | Should | M |
| US-024 | User | AI учитывал данные о компании лида (industry, size) | Письмо было максимально релевантным | Should | L |

#### 4.1.4 Feature: Email Sequences

**Description:** Автоматические цепочки follow-up писем.

| ID | As a... | I want to... | So that... | Priority | Effort |
|----|---------|--------------|------------|----------|--------|
| US-030 | User | Создать sequence из 3-5 шагов | Автоматически follow-up | Must | L |
| US-031 | User | Установить задержку между шагами (1-14 дней) | Не спамить лида | Must | M |
| US-032 | User | Sequence останавливался при ответе | Не отправлять follow-up ответившим | Must | M |
| US-033 | User | Использовать переменные (имя, компания) | Персонализация без AI | Must | S |
| US-034 | User | Запланировать отправку на определённое время | Письма приходили в рабочие часы | Should | M |

#### 4.1.5 Feature: Campaign Management

**Description:** Создание, запуск и мониторинг кампаний.

| ID | As a... | I want to... | So that... | Priority | Effort |
|----|---------|--------------|------------|----------|--------|
| US-040 | User | Создать кампанию (wizard: название → аудитория → sequence → настройки) | Структурировать outreach | Must | L |
| US-041 | User | Загрузить список лидов из CSV | Импортировать контакты | Must | M |
| US-042 | User | Запустить/приостановить/остановить кампанию | Контролировать отправку | Must | S |
| US-043 | User | Видеть статус кампании (active, paused, completed) | Понимать текущее состояние | Must | S |
| US-044 | User | Назначить email-аккаунты для кампании | Распределить нагрузку | Must | M |

#### 4.1.6 Feature: Unibox (Unified Inbox)

**Description:** Единый интерфейс для чтения и ответа на все входящие reply.

| ID | As a... | I want to... | So that... | Priority | Effort |
|----|---------|--------------|------------|----------|--------|
| US-050 | User | Видеть все ответы лидов в одном месте | Не проверять 20 ящиков | Must | L |
| US-051 | User | Фильтровать по статусу (interested, not interested, meeting) | Приоритизировать ответы | Must | M |
| US-052 | User | Ответить лиду прямо из Unibox | Не переключаться в почтовый клиент | Should | M |
| US-053 | User | Менять статус лида (interested → meeting booked → won) | Трекать pipeline | Should | M |

#### 4.1.7 Feature: Analytics

**Description:** Отслеживание метрик кампаний.

| ID | As a... | I want to... | So that... | Priority | Effort |
|----|---------|--------------|------------|----------|--------|
| US-060 | User | Видеть отправлено / открыто / отвечено / bounce | Оценить эффективность | Must | M |
| US-061 | User | Видеть analytics per campaign | Сравнить кампании | Must | M |
| US-062 | User | Видеть warmup health per account | Мониторить deliverability | Must | S |
| US-063 | User | Фильтровать analytics по периоду | Отслеживать динамику | Should | S |

### 4.2 Non-Functional Requirements

#### 4.2.1 Performance

| Metric | Requirement | Rationale |
|--------|-------------|-----------|
| Page load (p50) | < 1.5s | UX для dark SPA |
| API response (p99) | < 500ms | Smooth interactions |
| Email sending throughput | 10,000 emails/hour (system) | 100 users × 100 emails/hour peak |
| Warmup job processing | < 5 min per batch | Background, не critical |
| AI generation | < 10s per email | Batch pre-generation |

#### 4.2.2 Availability & Reliability

| Metric | Requirement |
|--------|-------------|
| Uptime SLA | 99.5% (MVP) → 99.9% (v1.0) |
| RTO | 4 hours |
| RPO | 1 hour |
| Email delivery guarantee | At-least-once (с dedup) |

#### 4.2.3 Security

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Email + password, bcrypt hashing |
| Authorization | Role-based (owner, member) |
| Data Encryption (at rest) | AES-256 for credentials, PG encryption |
| Data Encryption (in transit) | TLS 1.3 everywhere |
| Compliance | 152-ФЗ: all data on RF servers |
| Email credentials | Encrypted storage, never logged |
| API access | JWT tokens, refresh rotation |

#### 4.2.4 Scalability

| Dimension | MVP | Target (12 мес) | Target (3 года) |
|-----------|-----|-----------------|-----------------|
| Users | 100 | 5,000 | 50,000 |
| Email accounts | 500 | 25,000 | 250,000 |
| Emails/day | 50,000 | 500,000 | 5,000,000 |
| Data volume | 10 GB | 500 GB | 5 TB |

### 4.3 Technical Requirements

#### 4.3.1 Platform Support

| Platform | Minimum Version | Notes |
|----------|----------------|-------|
| Chrome | 90+ | Primary |
| Firefox | 90+ | Secondary |
| Safari | 15+ | Secondary |
| Yandex Browser | Latest | РФ-специфичный |
| Mobile (responsive) | — | Read-only dashboard |

#### 4.3.2 Integration Requirements

| System | Type | Data Flow | Priority |
|--------|------|-----------|----------|
| Yandex.Mail (IMAP/SMTP) | Protocol | Bidirectional | Must (MVP) |
| Mail.ru (IMAP/SMTP) | Protocol | Bidirectional | Must (MVP) |
| OpenAI API (GPT) | API | Out (prompts) / In (text) | Must (MVP) |
| AmoCRM | API + Webhook | Bidirectional | Should (v1.0) |
| Bitrix24 | API | Bidirectional | Could (v1.1) |
| CSV Import/Export | File | In/Out | Must (MVP) |

#### 4.3.3 Constraints

| Constraint | Description | Impact |
|------------|-------------|--------|
| Technical | Серверы только в РФ (152-ФЗ) | Ограничивает выбор hosting-провайдеров |
| Technical | Yandex rate limits (SMTP) | Max 500 писем/день per account |
| Business | Bootstrap (без инвестиций) | Минимальная команда, MVP-first |
| Regulatory | 152-ФЗ, 38-ФЗ | Compliance by design |
| Timeline | MVP за 3 месяца | Scope ограничен Must features |

---

## 5. UI/UX Requirements

### 5.1 Design Principles

1. **Dark-first** — профессиональная тёмная тема (как Instantly.ai), опционально светлая
2. **AI-forward** — AI-фичи на первом плане, не спрятаны
3. **Speed-to-value** — от регистрации до первой кампании за 15 мин
4. **Progressive disclosure** — простой старт, сложность по мере освоения
5. **Compliance-friendly** — подсказки о 38-ФЗ, предупреждения о рисках

### 5.2 Key Screens (from UI Reference)

| Screen | Purpose | Key Elements |
|--------|---------|--------------|
| Dashboard | Overview всех кампаний | KPI cards, recent activity, warmup status |
| Email Accounts | Управление ящиками | Account list, health score, warmup flame icon |
| Campaigns | Список кампаний | Status badges, metrics per campaign |
| Campaign Wizard | Создание кампании | 4-step wizard (Name → Leads → Sequence → Settings) |
| AI Generator | Создание писем | Prompt input, preview, tone selector |
| Unibox | Ответы лидов | 3-column: filters | messages | reading pane |
| Analytics | Метрики | KPI cards + area chart |
| Settings | Настройки | Profile, Integrations, Billing |

### 5.3 Design System (from Instantly.ai reference)

| Element | Value |
|---------|-------|
| Background | #0f1014 |
| Panel/Card | #15171c / #17191f |
| Border | #2a2d34 |
| Primary | #2563eb (blue-600) |
| Success | #22c55e |
| Warning/Accent | #facc15 |
| Error | #ef4444 |
| Text | #e5e7eb |
| Muted | #8b949e |
| Font | System sans-serif (Inter) |
| Border Radius | rounded-xl (buttons), rounded-2xl (cards) |
| Navigation | Narrow icon sidebar (w-16) + Secondary sidebar (w-72) |

---

## 6. Release Strategy

### 6.1 MVP (Month 1-3)

**Features:**
| Feature | Priority | Status |
|---------|----------|--------|
| Email Account Management | Must | Planned |
| Warmup Engine (Yandex/Mail.ru) | Must | Planned |
| AI Email Generation | Must | Planned |
| Email Sequences | Must | Planned |
| Campaign Management | Must | Planned |
| Unibox | Must | Planned |
| Analytics (basic) | Must | Planned |
| Compliance checker | Should | Planned |

**Success Criteria:**
- [ ] 100+ registered users
- [ ] 85%+ inbox rate for warmed accounts
- [ ] >5% reply rate on AI-generated emails
- [ ] <15 min time-to-first-campaign

### 6.2 v1.0 (Month 4-6)

| Feature | Priority |
|---------|----------|
| Multi-account agency dashboard | Should |
| AmoCRM integration | Should |
| A/B testing | Should |
| Advanced analytics | Should |
| API access | Should |
| Team/workspace management | Should |
| Custom domains (tracking) | Should |

### 6.3 Future Phases

| Phase | Features | Timeline |
|-------|----------|----------|
| v1.1 | Bitrix24 integration, lead scoring, email verification | Month 7-9 |
| v2.0 | Lead database (РФ-компании), AI Reply Agent, automations | Month 10-12 |
| v3.0 | Multichannel (WhatsApp/VK), white-label, enterprise features | Year 2 |

---

## 7. Risks & Mitigations

| Risk ID | Description | Probability | Impact | Mitigation |
|---------|-------------|:-----------:|:------:|------------|
| R-001 | Warmup engine не достигает 85%+ inbox rate | High | High | Итеративная разработка; ручной warmup как fallback |
| R-002 | Yandex ужесточает rate limits | High | Medium | Адаптивные лимиты; больше аккаунтов |
| R-003 | AI-генерация низкого качества на русском | Medium | High | Тестирование промптов; шаблоны как fallback |
| R-004 | Coldy.ai копирует AI-фичи быстро | High | Low | Скорость итераций; data moat |
| R-005 | 152-ФЗ новые требования | Medium | Medium | Compliance-first; юр. мониторинг |
| R-006 | Рынок меньше ожиданий | Low | Medium | СНГ-расширение; pivot на email marketing |

---

## 8. Open Questions

| ID | Question | Due Date | Resolution |
|----|----------|----------|------------|
| Q-001 | Какой GPT-модель оптимальна для русского B2B-текста? | Week 2 | Testing needed |
| Q-002 | Максимальный safe volume per account (Yandex)? | Week 3 | Empirical testing |
| Q-003 | Нужна ли email verification в MVP? | Week 1 | Likely "Could" |
| Q-004 | Какой minimum warmup period для Yandex? | Week 4 | Empirical testing |
| Q-005 | Pricing: freemium или trial-only? | Week 2 | A/B test after launch |
