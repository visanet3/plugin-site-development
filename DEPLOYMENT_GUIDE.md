# 🚀 Руководство по развёртыванию независимого проекта

Ваш проект теперь **полностью независим от poehali.dev** и может работать на любом хостинге!

## 📦 Что было сделано

1. ✅ Создан Express API сервер (`server/index.js`) со всеми функциями
2. ✅ Установлены необходимые пакеты: express, cors, pg, dotenv
3. ✅ Все backend-функции перенесены из Cloud Functions в локальный API
4. ✅ Добавлена поддержка PostgreSQL через переменные окружения

## 🔧 Настройка проекта

### 1. Создайте файл `.env` в корне проекта:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database_name

# Server Configuration
PORT=3001

# Frontend URL
FRONTEND_URL=http://localhost:5173

# API URL (для фронтенда)
VITE_API_URL=http://localhost:3001/api
```

### 2. Настройте базу данных

Используйте любой PostgreSQL хостинг:
- **Supabase** (бесплатно, рекомендую): https://supabase.com
- **Railway** (бесплатно): https://railway.app
- **Neon** (бесплатно): https://neon.tech
- **ElephantSQL** (бесплатно): https://www.elephantsql.com
- Или свой VPS с PostgreSQL

Скопируйте `DATABASE_URL` из выбранного сервиса и вставьте в `.env`

### 3. Примените миграции БД

Если база данных пустая, примените все миграции из папки `db_migrations/`:

```sql
-- Выполните все файлы по порядку:
-- V0001__*.sql
-- V0002__*.sql
-- ...
-- V0125__fill_crypto_transactions_from_existing.sql
```

## 🚀 Локальный запуск

### Вариант 1: Запуск в двух терминалах

**Терминал 1 - Frontend:**
```bash
bun run dev
```

**Терминал 2 - Backend API:**
```bash
node server/index.js
```

### Вариант 2: Одновременный запуск (нужен concurrently)

```bash
bun add -D concurrently
```

Добавьте в `package.json`:
```json
"scripts": {
  "dev:all": "concurrently \"bun run dev\" \"node server/index.js\""
}
```

Запустите:
```bash
bun run dev:all
```

## 🌐 Обновление фронтенда

Вам нужно обновить URL API в проекте. Замените все вызовы к:

**Старо:**
```typescript
const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const CRYPTO_PRICES_URL = 'https://functions.poehali.dev/f969550a-2586-4760-bff9-57823dd0a0d0';
```

**Ново:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTH_URL = `${API_URL}/auth`;
const CRYPTO_URL = `${API_URL}/crypto`;
```

### Примеры вызовов API:

```typescript
// Регистрация
fetch(`${API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, password })
})

// Получение балансов
fetch(`${API_URL}/crypto/balances`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': user.id.toString()
  }
})

// Обмен USDT на крипту
fetch(`${API_URL}/crypto/exchange-usdt-to-crypto`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': user.id.toString()
  },
  body: JSON.stringify({ usdt_amount, crypto_symbol, crypto_price })
})

// Получение курсов криптовалют
fetch(`${API_URL}/crypto/prices`)
```

## 🚢 Деплой на хостинг

### Вариант 1: Vercel (рекомендую для frontend + serverless)

1. Подключите GitHub к Vercel
2. Настройте переменные окружения в Vercel Dashboard
3. Добавьте `vercel.json`:

```json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/server/index.js" }
  ]
}
```

### Вариант 2: Railway (для fullstack приложения)

1. Подключите GitHub к Railway
2. Создайте два сервиса:
   - PostgreSQL (автоматически создаёт DATABASE_URL)
   - Node.js App (подключите репозиторий)
3. Настройте переменные окружения
4. Railway автоматически запустит проект

### Вариант 3: Render (бесплатный хостинг)

1. Подключите GitHub к Render
2. Создайте Web Service из репозитория
3. Настройте:
   - Build Command: `bun install && bun run build`
   - Start Command: `node server/index.js && bun run preview`
4. Добавьте PostgreSQL базу данных
5. Укажите переменные окружения

### Вариант 4: VPS (полный контроль)

```bash
# На сервере
git clone your-repo
cd your-repo
bun install
bun run build

# Настройте PM2 для автозапуска
pm2 start server/index.js --name api
pm2 startup
pm2 save

# Настройте Nginx для проксирования
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/user` - Получить данные пользователя

### Crypto Operations
- `POST /api/crypto/balances` - Получить балансы криптовалют
- `POST /api/crypto/exchange-usdt-to-crypto` - Обменять USDT на крипту
- `POST /api/crypto/exchange-crypto-to-usdt` - Обменять крипту на USDT
- `POST /api/crypto/withdraw` - Вывести криптовалюту
- `POST /api/crypto/transactions` - История транзакций
- `GET /api/crypto/prices` - Текущие курсы (из Binance)

### Health Check
- `GET /api/health` - Проверка работы API

## 🔒 Безопасность

1. **Никогда не коммитьте `.env` файл** - он в `.gitignore`
2. Используйте HTTPS на продакшене
3. Настройте CORS правильно для вашего домена
4. Используйте сильные пароли для БД
5. Регулярно обновляйте зависимости: `bun update`

## 🆘 Troubleshooting

### Ошибка подключения к БД
```
Error: connect ECONNREFUSED
```
Решение: Проверьте `DATABASE_URL` в `.env`

### CORS ошибки
```
Access-Control-Allow-Origin
```
Решение: Обновите `FRONTEND_URL` в `.env` на правильный домен

### Порт занят
```
EADDRINUSE :::3001
```
Решение: Измените `PORT` в `.env` или остановите процесс на порту 3001

## ✅ Что дальше?

1. Обновите все fetch вызовы во фронтенде на новые API endpoints
2. Настройте базу данных на выбранном хостинге
3. Задеплойте проект на Vercel/Railway/Render
4. Настройте свой домен

**Ваш проект теперь полностью независим! 🎉**
