#!/bin/bash

# 🚀 Автоматический деплой на Beget VPS
# Используйте: ./deploy-to-beget.sh

set -e

echo "🚀 Деплой на Beget VPS"
echo "====================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка наличия .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден!${NC}"
    echo "Создайте файл .env по примеру .env.example"
    exit 1
fi

# Загрузка переменных из .env
export $(cat .env | grep -v '^#' | xargs)

# Проверка обязательных переменных
if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ]; then
    echo -e "${RED}❌ Не указаны SSH_HOST или SSH_USER в .env${NC}"
    echo ""
    echo "Добавьте в .env:"
    echo "SSH_HOST=123.45.67.89"
    echo "SSH_USER=nodejs"
    echo "SSH_PORT=22"
    exit 1
fi

SSH_PORT=${SSH_PORT:-22}
REMOTE_PATH=${REMOTE_PATH:-~/app}

echo "📋 Настройки деплоя:"
echo "   SSH Host: $SSH_HOST"
echo "   SSH User: $SSH_USER"
echo "   SSH Port: $SSH_PORT"
echo "   Remote Path: $REMOTE_PATH"
echo ""

# Проверка подключения
echo "🔍 Проверка SSH подключения..."
if ssh -p $SSH_PORT -o ConnectTimeout=5 $SSH_USER@$SSH_HOST "echo '✅ Подключение успешно'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH подключение работает${NC}"
else
    echo -e "${RED}❌ Не удалось подключиться по SSH${NC}"
    echo "Проверьте:"
    echo "  1. SSH_HOST и SSH_USER в .env"
    echo "  2. SSH ключи настроены"
    echo "  3. Сервер доступен"
    exit 1
fi

echo ""
echo "📦 Сборка проекта..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка сборки${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Сборка завершена${NC}"
echo ""

echo "📤 Загрузка файлов на сервер..."

# Создание директории на сервере
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "mkdir -p $REMOTE_PATH"

# Rsync для быстрой синхронизации
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'dist' \
    -e "ssh -p $SSH_PORT" \
    . $SSH_USER@$SSH_HOST:$REMOTE_PATH/

echo -e "${GREEN}✅ Файлы загружены${NC}"
echo ""

echo "📤 Загрузка билда frontend..."
rsync -avz --delete \
    -e "ssh -p $SSH_PORT" \
    dist/ $SSH_USER@$SSH_HOST:$REMOTE_PATH/dist/

echo -e "${GREEN}✅ Билд загружен${NC}"
echo ""

echo "📦 Установка зависимостей на сервере..."
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "cd $REMOTE_PATH && npm install --production"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка установки зависимостей${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Зависимости установлены${NC}"
echo ""

echo "🔄 Перезапуск приложения..."
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "pm2 restart crypto-api || pm2 start $REMOTE_PATH/server/index.js --name crypto-api"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка перезапуска${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Приложение перезапущено${NC}"
echo ""

echo "📊 Проверка статуса..."
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "pm2 status"

echo ""
echo -e "${GREEN}🎉 Деплой завершён успешно!${NC}"
echo ""
echo "🌐 Проверьте работу:"
echo "   Frontend: https://$FRONTEND_URL"
echo "   API: https://$FRONTEND_URL/api/health"
echo ""
echo "📊 Просмотр логов:"
echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs crypto-api'"
