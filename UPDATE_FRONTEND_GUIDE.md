# 📱 Обновление Frontend для локального API

## Шаг 1: Импортируйте API конфигурацию

В начале каждого файла, где используются API вызовы, добавьте:

```typescript
import API_ENDPOINTS, { createHeaders, apiRequest } from '@/config/api';
```

## Шаг 2: Обновите URL в ExchangePage.tsx

### ❌ СТАРЫЙ КОД (строки 30-31):
```typescript
const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const CRYPTO_PRICES_URL = 'https://functions.poehali.dev/f969550a-2586-4760-bff9-57823dd0a0d0';
```

### ✅ НОВЫЙ КОД:
```typescript
import API_ENDPOINTS, { createHeaders } from '@/config/api';

// Удалите старые константы AUTH_URL и CRYPTO_PRICES_URL
```

## Шаг 3: Обновите все fetch вызовы

### Пример 1: loadPrices() (строка 172)

❌ **Старо:**
```typescript
const loadPrices = async () => {
  try {
    const response = await fetch(CRYPTO_PRICES_URL);
    const data = await response.json();
    // ...
  }
}
```

✅ **Ново:**
```typescript
const loadPrices = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.CRYPTO.PRICES);
    const data = await response.json();
    // ...
  }
}
```

### Пример 2: loadBalances() (строка 190)

❌ **Старо:**
```typescript
const loadBalances = async () => {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString()
      },
      body: JSON.stringify({
        action: 'get_crypto_balances'
      })
    });
    // ...
  }
}
```

✅ **Ново:**
```typescript
const loadBalances = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.CRYPTO.BALANCES, {
      method: 'POST',
      headers: createHeaders(user.id)
    });
    // ...
  }
}
```

### Пример 3: loadTransactions() (строка 212)

❌ **Старо:**
```typescript
const loadTransactions = async () => {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString()
      },
      body: JSON.stringify({
        action: 'get_crypto_transactions'
      })
    });
    // ...
  }
}
```

✅ **Ново:**
```typescript
const loadTransactions = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.CRYPTO.TRANSACTIONS, {
      method: 'POST',
      headers: createHeaders(user.id)
    });
    // ...
  }
}
```

### Пример 4: confirmBuyCrypto() (строка 320)

❌ **Старо:**
```typescript
const response = await fetch(AUTH_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': user.id.toString()
  },
  body: JSON.stringify({
    action: 'exchange_usdt_to_crypto',
    usdt_amount: usdt,
    crypto_symbol: selectedCrypto,
    crypto_price: buyPrices[selectedCrypto]
  })
});
```

✅ **Ново:**
```typescript
const response = await fetch(API_ENDPOINTS.CRYPTO.EXCHANGE_USDT_TO_CRYPTO, {
  method: 'POST',
  headers: createHeaders(user.id),
  body: JSON.stringify({
    usdt_amount: usdt,
    crypto_symbol: selectedCrypto,
    crypto_price: buyPrices[selectedCrypto]
  })
});
```

### Пример 5: confirmSellCrypto() (строка 413)

❌ **Старо:**
```typescript
const response = await fetch(AUTH_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': user.id.toString()
  },
  body: JSON.stringify({
    action: 'exchange_crypto_to_usdt',
    crypto_amount: crypto,
    crypto_symbol: selectedCrypto,
    crypto_price: sellPrices[selectedCrypto]
  })
});
```

✅ **Ново:**
```typescript
const response = await fetch(API_ENDPOINTS.CRYPTO.EXCHANGE_CRYPTO_TO_USDT, {
  method: 'POST',
  headers: createHeaders(user.id),
  body: JSON.stringify({
    crypto_amount: crypto,
    crypto_symbol: selectedCrypto,
    crypto_price: sellPrices[selectedCrypto]
  })
});
```

### Пример 6: handleWithdraw() (строка 482)

❌ **Старо:**
```typescript
const response = await fetch(AUTH_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': user.id.toString()
  },
  body: JSON.stringify({
    action: 'withdraw_crypto',
    crypto_symbol: withdrawCrypto,
    amount: amount,
    address: withdrawAddress
  })
});
```

✅ **Ново:**
```typescript
const response = await fetch(API_ENDPOINTS.CRYPTO.WITHDRAW, {
  method: 'POST',
  headers: createHeaders(user.id),
  body: JSON.stringify({
    crypto_symbol: withdrawCrypto,
    amount: amount,
    address: withdrawAddress
  })
});
```

## Шаг 4: Найдите все остальные файлы

Выполните поиск всех файлов с poehali.dev URLs:

```bash
grep -r "functions.poehali.dev" src/ --include="*.tsx" --include="*.ts"
```

Обновите каждый найденный файл по аналогии с примерами выше.

## Шаг 5: Обновите authentication файлы

Если у вас есть файлы авторизации (Login, Register), обновите их:

```typescript
// Login
const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// Register
const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, password, referral_code })
});

// Get User
const response = await fetch(API_ENDPOINTS.AUTH.GET_USER, {
  method: 'GET',
  headers: createHeaders(userId)
});
```

## Шаг 6: Создайте .env файл

Создайте `.env` в корне проекта:

```env
# API URL для development
VITE_API_URL=http://localhost:3001/api

# Database (для сервера)
DATABASE_URL=postgresql://user:password@host:5432/database

# Server Port
PORT=3001
```

## Шаг 7: Запустите проект

**Терминал 1 - Backend:**
```bash
node server/index.js
```

**Терминал 2 - Frontend:**
```bash
bun run dev
```

## ✅ Проверка

1. Откройте http://localhost:5173
2. Откройте DevTools Console (F12)
3. Проверьте Network tab - все запросы должны идти на `localhost:3001/api`
4. Если видите ошибки CORS - проверьте настройки в `server/index.js`

## 🔧 Troubleshooting

### Ошибка: Cannot find module '@/config/api'

Проверьте, что файл `src/config/api.ts` существует.

### Ошибка: Failed to fetch

1. Убедитесь, что backend запущен: `node server/index.js`
2. Проверьте порт в `.env` файле
3. Откройте http://localhost:3001/api/health - должен вернуть `{"status":"ok"}`

### CORS ошибка

Обновите `server/index.js`, добавьте ваш frontend URL в CORS настройки:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## 🎯 Итоговый чек-лист

- [ ] Создан файл `src/config/api.ts`
- [ ] Создан файл `.env` с DATABASE_URL и VITE_API_URL
- [ ] Обновлён `ExchangePage.tsx`
- [ ] Найдены и обновлены все остальные файлы с `functions.poehali.dev`
- [ ] Backend запускается без ошибок
- [ ] Frontend подключается к локальному API
- [ ] Все функции работают (регистрация, обмен, транзакции)

**Готово! Ваш проект полностью независим от poehali.dev! 🎉**
