# Инфраструктура ColdMail.ru

**Версия:** 0.1 | **Дата:** 2026-04-29

---

## Этапы масштабирования

### MVP: 1 VPS (до 100 пользователей)

```mermaid
graph TB
    subgraph VPS["VPS — 4 vCPU, 8 GB RAM, 100 GB SSD"]
        N[Nginx :80/:443]
        A[App :3000]
        W1[Worker Email]
        W2[Worker Warmup]
        W3[Worker IMAP]
        W4[Worker AI]
        PG[(PostgreSQL :5432)]
        RD[(Redis :6379)]
        PR[Prometheus :9090]
        GR[Grafana :3001]
    end

    U[Пользователи] --> N --> A
    A --> PG
    A --> RD
    W1 & W2 & W3 & W4 --> RD
    W1 & W2 & W3 --> PG
    PR --> GR
```

| Параметр | Значение |
|----------|---------|
| Сервер | 1 VPS (AdminVPS / HOSTKEY) |
| CPU | 4 vCPU |
| RAM | 8 GB |
| Диск | 100 GB SSD |
| ОС | Ubuntu 22.04 LTS |
| Ёмкость | ~100 пользователей, 50 000 писем/день |
| Локация | Москва / Санкт-Петербург (152-ФЗ) |

### Growth: 2-3 VPS (до 1 000 пользователей)

```mermaid
graph TB
    subgraph VPS1["VPS 1 — App (4 vCPU, 8 GB)"]
        N[Nginx]
        A1[App x2]
        W1[Worker Email x3]
        W2[Worker Warmup x2]
        W3[Worker IMAP x2]
        W4[Worker AI x2]
    end

    subgraph VPS2["VPS 2 — Data (4 vCPU, 8 GB, 200 GB SSD)"]
        PG[(PostgreSQL)]
        RD[(Redis)]
        PR[Prometheus]
        GR[Grafana]
    end

    U[Пользователи] --> N --> A1
    A1 --> PG
    A1 --> RD
    W1 & W2 & W3 & W4 --> RD
    W1 & W2 & W3 --> PG
```

| Параметр | Значение |
|----------|---------|
| Серверы | 2-3 VPS |
| App-сервер | 4 vCPU, 8 GB RAM |
| Data-сервер | 4 vCPU, 8 GB RAM, 200 GB SSD |
| Ёмкость | ~1 000 пользователей, 500 000 писем/день |
| Изменения | Вынос БД на отдельный сервер, реплики воркеров |

### Scale: Kubernetes (10 000+ пользователей)

| Параметр | Значение |
|----------|---------|
| Платформа | Yandex Cloud / Selectel Kubernetes |
| База данных | Managed PostgreSQL (Yandex MDB) |
| Кеш | Managed Redis |
| Автоскейлинг | HPA для воркеров по глубине очередей |
| Ёмкость | 10 000+ пользователей, 5 000 000 писем/день |

---

## Сетевые порты

| Порт | Сервис | Протокол | Доступ |
|------|--------|----------|--------|
| 80 | Nginx (HTTP -> HTTPS redirect) | TCP | Публичный |
| 443 | Nginx (HTTPS) | TCP | Публичный |
| 3000 | NestJS API | TCP | Внутренний (за Nginx) |
| 3001 | Grafana | TCP | Внутренний / VPN |
| 5432 | PostgreSQL | TCP | Внутренний |
| 6379 | Redis | TCP | Внутренний |
| 9090 | Prometheus | TCP | Внутренний |

### Рекомендации по firewall

```bash
# Разрешить только HTTP/HTTPS извне
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp    # SSH
sudo ufw deny 5432/tcp   # PostgreSQL — только внутренний
sudo ufw deny 6379/tcp   # Redis — только внутренний
sudo ufw deny 9090/tcp   # Prometheus — только внутренний
sudo ufw enable
```

---

## Docker Compose: 11 сервисов

```mermaid
graph TB
    subgraph frontend["Frontend Layer"]
        nginx["nginx<br/>nginx:1.25-alpine<br/>:80, :443"]
    end

    subgraph application["Application Layer"]
        app["app<br/>NestJS API<br/>:3000"]
    end

    subgraph workers["Worker Layer"]
        we["worker-email<br/>Отправка писем"]
        ww["worker-warmup<br/>Прогрев аккаунтов"]
        wi["worker-imap<br/>Проверка входящих"]
        wa["worker-ai<br/>AI-генерация"]
    end

    subgraph data["Data Layer"]
        pg["postgres<br/>PostgreSQL 16<br/>:5432"]
        rd["redis<br/>Redis 7<br/>:6379"]
    end

    subgraph monitoring["Monitoring Layer"]
        prom["prometheus<br/>:9090"]
        graf["grafana<br/>:3001"]
    end

    nginx --> app
    app --> pg & rd
    we & ww & wi --> pg & rd
    wa --> rd
    prom --> graf
```

### Описание сервисов

| Сервис | Образ | Назначение | Зависимости |
|--------|-------|------------|-------------|
| nginx | nginx:1.25-alpine | Reverse proxy, TLS, статика | app |
| app | Dockerfile (NestJS) | REST API, бизнес-логика | postgres, redis |
| worker-email | Dockerfile | Отправка писем через SMTP | postgres, redis |
| worker-warmup | Dockerfile | Warmup-взаимодействия | postgres, redis |
| worker-imap | Dockerfile | Проверка IMAP (ответы, bounce) | postgres, redis |
| worker-ai | Dockerfile | AI-генерация через OpenAI | redis |
| postgres | postgres:16-alpine | Основная БД (16 моделей) | -- |
| redis | redis:7-alpine | Очереди BullMQ + кеш | -- |
| prometheus | prom/prometheus:v2.51.0 | Сбор метрик | -- |
| grafana | grafana/grafana:10.4.0 | Визуализация метрик | prometheus |
| loki | grafana/loki | Агрегация логов | -- |

### Volumes (постоянное хранилище)

| Volume | Сервис | Содержимое |
|--------|--------|-----------|
| postgres_data | postgres | Данные БД |
| redis_data | redis | RDB-снапшоты и AOF |
| prometheus_data | prometheus | Метрики (TSDB) |
| grafana_data | grafana | Дашборды и настройки |

---

## Внешние API и сервисы

| Сервис | Протокол | Направление | Назначение |
|--------|----------|-------------|------------|
| Yandex.Mail | SMTP (465) / IMAP (993) | Двунаправленный | Отправка и получение писем |
| Mail.ru | SMTP (465) / IMAP (993) | Двунаправленный | Отправка и получение писем |
| Custom SMTP | SMTP / IMAP | Двунаправленный | Пользовательские почтовые серверы |
| OpenAI API | HTTPS | Исходящий | AI-генерация писем (GPT-4o-mini) |
| Let's Encrypt | HTTPS | Исходящий | Выпуск TLS-сертификатов |
| GitHub | HTTPS / SSH | Исходящий | CI/CD, управление кодом |

### Расход трафика (оценка MVP)

| Направление | Объём/мес | Примечание |
|-------------|----------|------------|
| SMTP исходящий | ~5 GB | 50 000 писем/день * 30 дней |
| IMAP входящий | ~2 GB | Проверка ответов каждые 2 мин |
| OpenAI API | ~500 MB | AI-генерация 10 000 писем/мес |
| HTTP пользователи | ~10 GB | SPA + API-запросы |

---

## Резервирование и отказоустойчивость

### MVP (1 VPS)

| Компонент | Стратегия |
|-----------|----------|
| PostgreSQL | Ежедневный pg_dump + WAL-архивация |
| Redis | RDB каждый час + AOF |
| Приложение | Docker restart policy: `unless-stopped` |
| Health check | app: каждые 30с, postgres: каждые 10с, redis: каждые 10с |

### Целевые показатели

| Метрика | MVP | Production |
|---------|-----|------------|
| SLA Uptime | 99.5% | 99.9% |
| RTO (время восстановления) | 4 часа | 1 час |
| RPO (допустимая потеря данных) | 1 час | 15 минут |

---

## Требования к серверу по этапам

| Этап | Серверы | CPU | RAM | Диск | Писем/день |
|------|---------|-----|-----|------|-----------|
| MVP | 1 VPS | 4 vCPU | 8 GB | 100 GB | 50 000 |
| Growth | 2-3 VPS | 8-12 vCPU | 16-24 GB | 300 GB | 500 000 |
| Scale | Kubernetes | Auto | Auto | Managed | 5 000 000 |
