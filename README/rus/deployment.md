# Развёртывание ColdMail.ru

**Версия:** 0.1 | **Дата:** 2026-04-29

---

## Системные требования

| Компонент | Минимальная версия | Назначение |
|-----------|-------------------|------------|
| Node.js | 20 LTS | Среда выполнения backend |
| Docker | 24.x | Контейнеризация сервисов |
| Docker Compose | 2.x | Оркестрация контейнеров |
| PostgreSQL | 16 | Основная база данных |
| Redis | 7.x | Очереди BullMQ + кеширование |
| Nginx | 1.25 | Обратный прокси, TLS |
| Git | 2.x | Управление исходным кодом |

### Аппаратные требования (MVP)

| Ресурс | Спецификация |
|--------|-------------|
| CPU | 4 vCPU |
| RAM | 8 GB |
| Диск | 100 GB SSD |
| ОС | Ubuntu 22.04 LTS |
| Сеть | Статический IP, порты 80/443 |

---

## Быстрый старт (локальная разработка)

### 1. Клонирование репозитория

```bash
git clone git@github.com:your-org/coldmail.git
cd coldmail
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
```

Отредактируйте `.env` -- укажите обязательные значения:

```bash
JWT_SECRET=<случайная-строка-64-символа>
ENCRYPTION_KEY=<случайные-32-байта-hex>
OPENAI_API_KEY=sk-ваш-ключ
POSTGRES_PASSWORD=<надёжный-пароль>
```

### 3. Запуск через Docker Compose

```bash
docker compose up -d
```

Будут запущены 11 сервисов: `nginx`, `app`, `worker-email`, `worker-warmup`, `worker-imap`, `worker-ai`, `postgres`, `redis`, `prometheus`, `grafana`, `loki`.

### 4. Применение миграций базы данных

```bash
docker compose exec app npx prisma migrate deploy
```

### 5. Проверка работоспособности

```bash
curl http://localhost:3000/api/health
```

Ожидаемый ответ: `{"status":"ok"}`.

---

## Production-развёртывание на VPS

### Выбор хостинга (152-ФЗ)

Все персональные данные должны храниться на серверах в Российской Федерации. Рекомендуемые провайдеры:

| Провайдер | Локация | Примечание |
|-----------|---------|------------|
| AdminVPS | Москва | Бюджетный, Docker-ready |
| HOSTKEY | Санкт-Петербург | Dedicated и VPS |
| Selectel | Москва / СПб | Облачная инфраструктура |

### Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy

# Установка Docker Compose
sudo apt install docker-compose-plugin -y

# Создание директории проекта
sudo mkdir -p /opt/coldmail
sudo chown deploy:deploy /opt/coldmail
```

### Процедура деплоя

```bash
ssh deploy@vps << 'EOF'
  cd /opt/coldmail
  git pull origin main
  docker compose pull
  docker compose up -d --build
  docker compose exec -T app npx prisma migrate deploy
  sleep 10
  curl -f http://localhost:3000/api/health || exit 1
EOF
```

---

## SSL через Let's Encrypt

### Установка Certbot

```bash
sudo apt install certbot -y
```

### Получение сертификата

```bash
sudo certbot certonly --standalone -d coldmail.ru -d www.coldmail.ru
```

### Автоматическое обновление

Certbot автоматически добавляет cron-задачу. Проверка:

```bash
sudo certbot renew --dry-run
```

### Конфигурация Nginx

Сертификаты монтируются в контейнер Nginx через volume `./nginx/certs`. Пути в `nginx.conf`:

```nginx
ssl_certificate     /etc/nginx/certs/fullchain.pem;
ssl_certificate_key /etc/nginx/certs/privkey.pem;
ssl_protocols       TLSv1.3;
```

---

## DNS-настройка

| Запись | Тип | Значение |
|--------|-----|----------|
| coldmail.ru | A | IP вашего VPS |
| www.coldmail.ru | CNAME | coldmail.ru |
| track.coldmail.ru | A | IP вашего VPS |

---

## Обновление системы

### Стандартное обновление

```bash
cd /opt/coldmail
git pull origin main
docker compose up -d --build
docker compose exec -T app npx prisma migrate deploy
```

### Проверка после обновления

1. Health check: `curl -f https://coldmail.ru/api/health`
2. Логи: `docker compose logs --tail=100 app`
3. Мониторинг: проверить Grafana-дашборды
4. Очереди: убедиться в обработке задач BullMQ

---

## Откат на предыдущую версию

```bash
ssh deploy@vps << 'EOF'
  cd /opt/coldmail
  docker compose down
  git checkout HEAD~1
  docker compose up -d --build
  # При необходимости откатить миграцию:
  docker compose exec -T app npx prisma migrate resolve \
    --rolled-back <имя_миграции>
EOF
```

### Верификация отката

```bash
curl -f https://coldmail.ru/api/health
docker compose logs --tail=50 app
```

---

## Частые проблемы при развёртывании

| Проблема | Причина | Решение |
|----------|---------|---------|
| Порт 5432 занят | Локальный PostgreSQL | `sudo systemctl stop postgresql` |
| Docker compose не находит `.env` | Файл не создан | `cp .env.example .env` |
| Миграции падают | БД не готова | Дождаться healthcheck PostgreSQL |
| Nginx не стартует | Нет сертификатов | Сначала получить SSL через Certbot |
| Redis OOM | Недостаточно памяти | Увеличить RAM или настроить `maxmemory` |
