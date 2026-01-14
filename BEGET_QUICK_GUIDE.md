# ⚡ Beget - Быстрый старт (20 минут)

## 🎯 Что нужно

1. Аккаунт на Beget.com
2. VPS тариф от 300 руб/мес (Node.js marketplace)
3. Ваш домен или используйте `*.beget.app`

---

## 🚀 Пошаговая инструкция

### 1️⃣ Заказ VPS (5 минут)

1. https://beget.com/ru/vps → **Заказать VPS**
2. Выберите:
   - Тариф: **Базовый** (300 руб/мес)
   - ОС: **Ubuntu 22.04**
   - Marketplace: **Node.js** ⭐
   - Домен: ваш или бесплатный `*.beget.app`
3. Оплатите → Дождитесь создания (5-10 мин)

### 2️⃣ Подключение по SSH (1 минута)

Получите данные из панели Beget:
- IP: `123.45.67.89`
- Логин: `nodejs`
- Пароль: `ваш_пароль`

Подключитесь:
```bash
ssh nodejs@123.45.67.89
```

### 3️⃣ Загрузка проекта (2 минуты)

**Если у вас GitHub:**
```bash
cd ~
git clone https://github.com/username/repo.git app
cd app
```

**Если нет GitHub:**
Загрузите через FileZilla/WinSCP в `/home/nodejs/app/`

### 4️⃣ Установка и сборка (3 минуты)

```bash
cd ~/app

# Установка
npm install

# Сборка
npm run build
```

### 5️⃣ База данных (3 минуты)

**Через панель Beget:**
1. **MySQL/PostgreSQL** → **Создать PostgreSQL БД**
2. Сохраните:
   - Database: `crypto_db`
   - User: `crypto_user`
   - Password: `your_password`

**Или через SSH:**
```bash
sudo -u postgres psql

CREATE DATABASE crypto_db;
CREATE USER crypto_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crypto_db TO crypto_user;
\q
```

### 6️⃣ Настройка .env (2 минуты)

```bash
cd ~/app
nano .env
```

Вставьте:
```env
DATABASE_URL=postgresql://crypto_user:your_password@localhost:5432/crypto_db
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://ваш-домен.beget.app
VITE_API_URL=https://ваш-домен.beget.app/api
```

Сохранить: `Ctrl+O`, `Enter`, `Ctrl+X`

### 7️⃣ Миграции БД (2 минуты)

```bash
cd ~/app/db_migrations

# Применить все миграции
for file in *.sql; do
  psql postgresql://crypto_user:your_password@localhost:5432/crypto_db < "$file"
done
```

### 8️⃣ Запуск через PM2 (1 минута)

PM2 уже установлен! Просто запустите:

```bash
cd ~/app

# Запуск
pm2 start server/index.js --name crypto-api

# Автозапуск
pm2 startup
pm2 save

# Проверка
pm2 status
```

### 9️⃣ Настройка Nginx (2 минуты)

```bash
sudo nano /etc/nginx/sites-available/nodejs.conf
```

Замените на:
```nginx
server {
    listen 80;
    server_name ваш-домен.beget.app;
    
    location / {
        root /home/nodejs/app/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Перезагрузка:
```bash
sudo nginx -t
sudo nginx -s reload
```

### 🔟 SSL сертификат (автоматически)

SSL уже настроен при создании VPS с доменом!

---

## ✅ Проверка

Откройте в браузере:
- **Frontend**: `https://ваш-домен.beget.app`
- **API Health**: `https://ваш-домен.beget.app/api/health`

Должен вернуться JSON:
```json
{"status":"ok","message":"API is running"}
```

---

## 📊 Команды управления

### PM2

```bash
# Статус
pm2 status

# Логи
pm2 logs crypto-api

# Рестарт
pm2 restart crypto-api

# Остановка
pm2 stop crypto-api
```

### Nginx

```bash
# Проверка конфига
sudo nginx -t

# Перезагрузка
sudo nginx -s reload

# Логи
tail -f /var/log/nginx/access.log
```

### PostgreSQL

```bash
# Подключение
psql postgresql://crypto_user:password@localhost:5432/crypto_db

# Бэкап
pg_dump postgresql://crypto_user:password@localhost:5432/crypto_db > backup.sql

# Восстановление
psql postgresql://crypto_user:password@localhost:5432/crypto_db < backup.sql
```

---

## 🔄 Обновление проекта

```bash
cd ~/app
git pull origin main
npm install
npm run build
pm2 restart crypto-api
```

---

## 🆘 Проблемы?

### API не работает
```bash
pm2 logs crypto-api
# Смотрите ошибки
```

### База данных не подключается
```bash
# Проверьте DATABASE_URL в .env
cat ~/app/.env
```

### 502 Bad Gateway
```bash
# Проверьте что backend запущен
pm2 status

# Перезапустите
pm2 restart crypto-api
```

---

## 💰 Стоимость

- **VPS Базовый**: 300 руб/мес
- **PostgreSQL**: Включено
- **SSL**: Бесплатно (Let's Encrypt)
- **Домен .beget.app**: Бесплатно

**Итого: 300 руб/мес = 10 руб/день**

---

## 🎉 Готово за 20 минут!

Ваш проект работает на Beget:
- ✅ Frontend на Nginx
- ✅ Backend на Node.js + PM2
- ✅ PostgreSQL база данных
- ✅ SSL сертификат
- ✅ Автозапуск после перезагрузки

**Следующий шаг:** Обновите frontend согласно [UPDATE_FRONTEND_GUIDE.md](UPDATE_FRONTEND_GUIDE.md)
