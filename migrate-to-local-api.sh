#!/bin/bash

# Скрипт для автоматической миграции на локальное API

echo "🚀 Начинаем миграцию на локальное API..."

# Замена URL в ExchangePage
echo "📝 Обновляем ExchangePage.tsx..."
sed -i.bak "s|const AUTH_URL = 'https://functions.poehali.dev/.*';|import API_ENDPOINTS from '@/config/api';\nconst AUTH_URL = API_ENDPOINTS.AUTH.GET_USER;|g" src/components/ExchangePage.tsx
sed -i.bak "s|const CRYPTO_PRICES_URL = 'https://functions.poehali.dev/.*';|const CRYPTO_PRICES_URL = API_ENDPOINTS.CRYPTO.PRICES;|g" src/components/ExchangePage.tsx

# Поиск всех файлов с URL functions.poehali.dev
echo "🔍 Ищем другие файлы с poehali.dev URLs..."
grep -r "functions.poehali.dev" src/ --include="*.tsx" --include="*.ts" -l | while read -r file; do
  echo "   Найден: $file"
done

echo ""
echo "✅ Миграция завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте все файлы с поиском: grep -r 'functions.poehali.dev' src/"
echo "2. Замените их на API_ENDPOINTS из src/config/api.ts"
echo "3. Создайте .env файл по примеру .env.example"
echo "4. Запустите: bun run dev (frontend) и node server/index.js (backend)"
echo ""
echo "📚 Подробная инструкция: DEPLOYMENT_GUIDE.md"
