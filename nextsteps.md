# Next Steps: ColdMail.ru

Все 15 запланированных фич реализованы (v1.0.0). Ниже — следующие шаги для развития продукта.

---

## Приоритет 1: Production Readiness (v1.1)

### Инфраструктура
- [ ] **CI/CD pipeline** — GitHub Actions: lint → test → build → deploy to VPS
- [ ] **Automated backups** — PostgreSQL daily + WAL streaming, Redis RDB hourly
- [ ] **SSL/TLS** — Let's Encrypt сертификат через Nginx + certbot auto-renew
- [ ] **Nginx reverse proxy** — proxy_pass к app:3000 и frontend:3000, gzip, rate limiting
- [ ] **Health monitoring** — Prometheus alerting rules → email/SMS on downtime
- [ ] **Log aggregation** — Loki + Grafana dashboards для structured Pino logs

### Качество кода
- [ ] **TypeScript strict mode** — включить `strict: true`, исправить все type errors
- [ ] **Unit tests** — написать 102+ юнит-теста по плану из Refinement.md
- [ ] **Integration tests** — 8 тестов (IT-001 to IT-008) из test-scenarios.md
- [ ] **E2E tests** — Playwright: 5 критических user journeys
- [ ] **API documentation** — Swagger/OpenAPI через @nestjs/swagger

### Безопасность
- [ ] **Rate limiting** — внедрить по таблице из .claude/rules/security.md
- [ ] **CSRF protection** — double-submit cookie pattern для POST/PATCH/DELETE
- [ ] **Input sanitization** — DOMPurify для HTML email content
- [ ] **Audit log** — таблица AuditLog для login/campaign/settings events
- [ ] **Dependency scanning** — `npm audit` в CI, Snyk или Socket

---

## Приоритет 2: Product Enhancement (v1.2)

### Email Deliverability
- [ ] **Warmup pool** — создать пул аккаунтов для warmup interactions
- [ ] **Inbox placement testing** — seed list для проверки inbox vs spam
- [ ] **Domain reputation monitor** — отслеживание health по доменам
- [ ] **DKIM/SPF wizard** — помощник настройки DNS-записей в UI
- [ ] **Bounce management** — automatic suppression list, re-verify after 30 days

### AI Improvements
- [ ] **Prompt A/B testing** — тестирование разных промптов для лучшего reply rate
- [ ] **AI Reply Agent** — автоматическая классификация и ответ на входящие
- [ ] **Fine-tuned prompts** — база лучших промптов для разных индустрий
- [ ] **YandexGPT fallback** — альтернативный LLM если OpenAI недоступен

### UX Improvements
- [ ] **Campaign wizard** — добавить шаг "Sequence" и "Preview" в wizard
- [ ] **Email template library** — предустановленные шаблоны по индустриям
- [ ] **Real-time notifications** — WebSocket для новых ответов в Unibox
- [ ] **Dark/Light theme toggle** — переключение темы в профиле
- [ ] **Mobile responsive** — адаптивная верстка для планшетов

---

## Приоритет 3: Growth Features (v2.0)

### Lead Database
- [ ] **База контактов РФ** — парсинг открытых источников (ЕГРЮЛ, сайты компаний)
- [ ] **Email verification** — интеграция ZeroBounce/Mailgun для валидации email
- [ ] **Lead scoring** — AI-оценка вероятности ответа на основе данных

### Multichannel
- [ ] **WhatsApp Business API** — холодный outreach через WhatsApp
- [ ] **VK Business** — интеграция с VK для B2B

### Enterprise
- [ ] **White-label** — кастомизация под агентский бренд
- [ ] **SSO** — SAML/OIDC для корпоративных клиентов
- [ ] **Audit trail** — полная история действий для compliance
- [ ] **SLA monitoring** — гарантии uptime для enterprise клиентов

### Monetization
- [ ] **Billing integration** — ЮKassa / CloudPayments для рублёвых платежей
- [ ] **Usage metering** — точный подсчёт использования по плану
- [ ] **Invoice generation** — автоматические счета для юрлиц

---

## Приоритет 4: Scale (v3.0)

### Infrastructure
- [ ] **Kubernetes migration** — переход на Yandex Cloud / Selectel k8s
- [ ] **Horizontal scaling** — autoscaling workers по нагрузке
- [ ] **Multi-region** — серверы в МСК + СПб для DR
- [ ] **CDN** — статика через Yandex CDN

### Data
- [ ] **Analytics v2** — cohort analysis, funnel visualization
- [ ] **ML deliverability** — машинное обучение для оптимизации warmup
- [ ] **Data export** — GDPR/152-ФЗ compliant data export/delete

### Expansion
- [ ] **CНГ market** — Казахстан, Беларусь, Узбекистан
- [ ] **Localization** — UI на казахском, узбекском
- [ ] **Partner API** — white-label API для интеграторов

---

## Текущий статус

| Метрика | Значение |
|---------|----------|
| Features done | 15/15 + 3 extra (Resend, Campaign Wizard, System Settings) |
| Source files | 85+ |
| Source lines | 6,500+ |
| Commits | 49 |
| Tags | v0.1.0-mvp, v1.0.0 |
| Insights | 12 |
| Documentation | 14 bilingual files (RU/EN) |

## Рекомендуемый следующий шаг

```bash
# 1. Написать тесты
/go unit-tests

# 2. Настроить CI/CD
/go ci-cd-pipeline

# 3. Запустить на production VPS с SSL
/deploy prod
```
