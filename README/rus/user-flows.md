# Пользовательские сценарии ColdMail.ru

**Версия:** 0.1 | **Дата:** 2026-04-29

---

## Основной путь пользователя

```mermaid
graph LR
    A[Регистрация] --> B[Подключение<br/>email-аккаунта]
    B --> C[Warmup<br/>14-21 день]
    C --> D[Создание<br/>кампании]
    D --> E[Обработка<br/>ответов]
    E --> F[Анализ<br/>результатов]
```

---

## Сценарий 1: Регистрация и онбординг

```mermaid
sequenceDiagram
    actor U as Пользователь
    participant W as Web App
    participant API as API Server
    participant DB as PostgreSQL
    participant E as Email (подтверждение)

    U->>W: Открывает coldmail.ru
    U->>W: Нажимает "Создать аккаунт"
    U->>W: Заполняет форму (имя, email, пароль)
    W->>API: POST /auth/register
    API->>DB: Создаёт User (plan: free)
    API->>E: Отправляет письмо подтверждения
    API-->>W: 201 Created
    W-->>U: "Проверьте почту"

    U->>E: Переходит по ссылке подтверждения
    E->>API: GET /auth/verify?token=xxx
    API->>DB: Активирует аккаунт
    API-->>U: Redirect на /login

    U->>W: Вводит email и пароль
    W->>API: POST /auth/login
    API-->>W: Set-Cookie (JWT access + refresh)
    W-->>U: Dashboard (пустой, с подсказками)
```

**Время:** ~3 минуты

**Результат:** пользователь авторизован, видит пустой Dashboard с EmptyState-подсказками.

---

## Сценарий 2: Подключение email-аккаунта

```mermaid
sequenceDiagram
    actor U as Пользователь
    participant W as Web App
    participant API as API Server
    participant SMTP as SMTP-сервер
    participant IMAP as IMAP-сервер
    participant DB as PostgreSQL

    U->>W: Переходит в "Аккаунты"
    U->>W: Нажимает "Добавить аккаунт"
    U->>W: Выбирает провайдера (Yandex)
    U->>W: Вводит email и пароль приложения
    W->>API: POST /accounts

    API->>SMTP: Тестовое SMTP-подключение
    SMTP-->>API: OK
    API->>IMAP: Тестовое IMAP-подключение
    IMAP-->>API: OK

    API->>API: Шифрование пароля (AES-256-GCM)
    API->>DB: Сохранение EmailAccount (status: connected)
    API-->>W: 201 Created
    W-->>U: Аккаунт добавлен, health_score: 0
```

**Время:** ~2 минуты

**Результат:** email-аккаунт подключён, отображается в списке со статусом "Connected".

---

## Сценарий 3: Warmup (прогрев аккаунта)

```mermaid
sequenceDiagram
    actor U as Пользователь
    participant W as Web App
    participant API as API Server
    participant Q as BullMQ (Redis)
    participant WW as Warmup Worker
    participant SMTP as Yandex SMTP
    participant DB as PostgreSQL

    U->>W: Нажимает иконку warmup на аккаунте
    W->>API: POST /accounts/:id/warmup/start
    API->>DB: warmup_status = "in_progress"
    API-->>W: 200 OK
    W-->>U: Статус: "В процессе"

    loop Ежедневно в 08:00 MSK
        Q->>WW: Задача warmup:run
        WW->>DB: Получить аккаунты в warmup
        WW->>WW: Рассчитать объём (день 1: 5, день 7: 20...)
        WW->>Q: Поставить задачи warmup:send

        loop N писем
            WW->>SMTP: Отправить warmup-письмо
            SMTP-->>WW: OK
            WW->>DB: Записать WarmupJob (completed)
        end

        WW->>DB: Обновить health_score
    end

    Note over WW,DB: Через 14-21 день
    WW->>DB: warmup_status = "ready", health_score > 80
    WW-->>U: Уведомление: "Аккаунт прогрет"
```

**Время:** 14-21 день (автоматический фоновый процесс)

**Результат:** health_score > 80, inbox rate > 85%, аккаунт готов к рассылке.

---

## Сценарий 4: Создание и запуск кампании

```mermaid
sequenceDiagram
    actor U as Пользователь
    participant W as Web App
    participant API as API Server
    participant AI as AI Worker
    participant DB as PostgreSQL
    participant Q as BullMQ

    rect rgb(30, 30, 50)
        Note over U,W: Шаг 1: Название и настройки
        U->>W: Нажимает "Создать кампанию"
        U->>W: Вводит название, расписание, дневной лимит
    end

    rect rgb(30, 50, 30)
        Note over U,W: Шаг 2: Импорт лидов
        U->>W: Загружает CSV-файл
        W->>API: POST /campaigns/:id/leads (multipart)
        API->>API: Парсинг CSV (UTF-8, BOM)
        API->>DB: Создание Lead записей
        API-->>W: Импортировано N лидов
    end

    rect rgb(50, 30, 30)
        Note over U,AI: Шаг 3: Sequence
        U->>W: Создаёт шаг 1 (тема + тело)
        U->>W: Включает AI-персонализацию
        U->>W: Добавляет follow-up (шаг 2, задержка 3 дня)
        W->>API: POST /sequences
        API->>DB: Создание Sequence + SequenceSteps
    end

    rect rgb(30, 30, 30)
        Note over U,W: Шаг 4: Аккаунты и запуск
        U->>W: Выбирает 3 прогретых аккаунта
        U->>W: Нажимает "Запустить"
        W->>API: POST /campaigns/:id/start
        API->>DB: status = "active"
        API->>Q: Поставить в очередь email:schedule
    end

    API-->>W: Кампания запущена
    W-->>U: StatusBadge: Active (зелёный)
```

**Время:** ~10-15 минут

**Результат:** кампания активна, планировщик начинает формировать очереди на отправку.

---

## Сценарий 5: Отправка писем (фоновый процесс)

```mermaid
sequenceDiagram
    participant SCH as Scheduler (cron 5 мин)
    participant Q as BullMQ
    participant WE as Email Worker
    participant DB as PostgreSQL
    participant SMTP as Yandex/Mail.ru SMTP
    participant RD as Redis

    SCH->>DB: Найти лидов (status=new, next_send_at <= now)
    DB-->>SCH: Список лидов для отправки
    SCH->>DB: Создать EmailMessage (status: queued)
    SCH->>Q: Поставить задачи email:send

    loop Для каждого письма
        Q->>WE: Задача email:send
        WE->>DB: Загрузить EmailMessage + Lead + Account
        WE->>WE: Расшифровать SMTP-пароль
        WE->>WE: Подставить переменные в шаблон
        WE->>SMTP: Отправить письмо (SPF/DKIM/DMARC)
        SMTP-->>WE: OK (Message-ID)
        WE->>DB: status = "sent", message_id, sent_at
        WE->>RD: Инкремент account:sent_today
        WE->>DB: Обновить Lead (current_step++, next_send_at)
    end
```

---

## Сценарий 6: Получение ответа и обработка

```mermaid
sequenceDiagram
    participant WI as IMAP Worker (каждые 2 мин)
    participant IMAP as Yandex/Mail.ru IMAP
    participant DB as PostgreSQL
    participant Q as BullMQ
    actor U as Пользователь
    participant W as Web App

    WI->>IMAP: Проверить новые письма
    IMAP-->>WI: Новое письмо (In-Reply-To: message-id)
    WI->>DB: Сопоставить по Message-ID/References
    WI->>DB: Найти Lead и Campaign
    WI->>DB: Создать UniboxMessage
    WI->>DB: Lead.status = "replied"
    WI->>DB: Остановить Sequence для этого лида

    U->>W: Открывает Unibox
    W->>API: GET /unibox/messages
    API->>DB: Загрузить непрочитанные
    DB-->>API: Список UniboxMessage
    API-->>W: Массив сообщений
    W-->>U: Отображает ответ лида

    U->>W: Читает ответ
    U->>W: Меняет статус на "Заинтересован"
    W->>API: PATCH /leads/:id {status: "interested"}
    API->>DB: Обновить Lead.status

    U->>W: Нажимает "Ответить"
    U->>W: Пишет ответ
    W->>API: POST /unibox/messages/:id/reply
    API->>SMTP: Отправить ответ
    SMTP-->>API: OK
    API-->>W: Ответ отправлен
```

**Время:** проверка каждые 2 минуты, обработка пользователем -- индивидуально.

---

## Сценарий 7: AI-генерация письма

```mermaid
sequenceDiagram
    actor U as Пользователь
    participant W as Web App
    participant API as API Server
    participant Q as BullMQ
    participant WA as AI Worker
    participant OAI as OpenAI API

    U->>W: Открывает AI Generator
    U->>W: Описывает продукт: "SaaS для автоматизации HR"
    U->>W: Выбирает тон: "Формальный"
    U->>W: Нажимает "Сгенерировать"

    W->>API: POST /ai/generate
    API->>API: Rate limit check (30/мин)
    API->>Q: Задача ai:generate

    Q->>WA: Обработка задачи
    WA->>WA: Составление промпта (контекст + тон + ограничения)
    WA->>OAI: API call (gpt-4o-mini, max_tokens: 500)
    OAI-->>WA: Сгенерированный текст
    WA->>WA: Проверка: спам-слова, длина, качество
    WA-->>API: Готовое письмо

    API-->>W: Текст письма
    W-->>U: Превью с возможностью редактирования

    U->>W: Редактирует текст
    U->>W: Нажимает "Использовать в кампании"
    W->>API: Сохранить как SequenceStep
```

**Время:** 5-10 секунд на генерацию.

---

## Сценарий 8: Полный цикл (Time to Value)

```mermaid
graph TB
    A["Регистрация<br/>3 мин"] --> B["Подключение аккаунта<br/>2 мин"]
    B --> C["Запуск warmup<br/>1 мин"]
    C --> D["Ожидание прогрева<br/>14-21 день"]
    D --> E["Создание кампании<br/>10 мин"]
    E --> F["AI-генерация писем<br/>5 мин"]
    F --> G["Запуск рассылки<br/>1 мин"]
    G --> H["Первые ответы<br/>1-3 дня"]
    H --> I["Обработка в Unibox<br/>ежедневно"]

    style A fill:#2563eb,color:#fff
    style D fill:#facc15,color:#000
    style H fill:#22c55e,color:#fff
```

### Ключевые метрики Time to Value

| Этап | Целевое время |
|------|--------------|
| Регистрация -> Dashboard | 3 минуты |
| Dashboard -> Аккаунт подключён | 5 минут |
| Аккаунт -> Warmup запущен | 6 минут |
| Warmup завершён -> Кампания запущена | 15 минут |
| Общий time-to-first-campaign | < 15 минут (без warmup) |

---

## Сценарий ошибки: SMTP-подключение не удалось

```mermaid
sequenceDiagram
    actor U as Пользователь
    participant W as Web App
    participant API as API Server
    participant SMTP as SMTP-сервер

    U->>W: Добавляет аккаунт с неверным паролем
    W->>API: POST /accounts
    API->>SMTP: Тестовое подключение
    SMTP-->>API: Ошибка авторизации (535)
    API-->>W: 400 Bad Request
    W-->>U: "Не удалось подключиться. Проверьте пароль приложения."

    Note over U,W: Пользователь исправляет данные
    U->>W: Вводит корректный пароль
    W->>API: POST /accounts
    API->>SMTP: Тестовое подключение
    SMTP-->>API: OK
    API-->>W: 201 Created
    W-->>U: "Аккаунт успешно подключён"
```

---

## Сценарий: Пауза и возобновление кампании

```mermaid
sequenceDiagram
    actor U as Пользователь
    participant W as Web App
    participant API as API Server
    participant DB as PostgreSQL
    participant Q as BullMQ

    U->>W: Нажимает "Приостановить" на кампании
    W->>API: POST /campaigns/:id/pause
    API->>DB: status = "paused"
    API->>Q: Удалить pending задачи email:send
    API-->>W: 200 OK
    W-->>U: StatusBadge: Paused (жёлтый)

    Note over U,W: Через некоторое время

    U->>W: Нажимает "Возобновить"
    W->>API: POST /campaigns/:id/resume
    API->>DB: status = "active"
    API->>Q: Пересчитать next_send_at для лидов
    API-->>W: 200 OK
    W-->>U: StatusBadge: Active (зелёный)
```
