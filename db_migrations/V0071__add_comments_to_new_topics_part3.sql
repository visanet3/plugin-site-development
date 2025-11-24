-- Комментарии к новым темам (часть 3 - финальная)

INSERT INTO forum_comments (topic_id, author_id, content, created_at) VALUES
-- Комментарии к "Hardware кошельки"
((SELECT id FROM forum_topics WHERE title LIKE 'Hardware кошельки: Ledger vs Trezor%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'sergey_btc'),
 'У меня оба устройства. Ledger для альткоинов, Trezor только для BTC.', 
 NOW() - INTERVAL '39 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Hardware кошельки: Ledger vs Trezor%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'boris_pro'),
 'После утечки данных Ledger я перешёл на Trezor. Open-source важнее удобства!', 
 NOW() - INTERVAL '38 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Hardware кошельки: Ledger vs Trezor%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'oleg_expert'),
 'Главное покупать напрямую у производителя! На eBay куча модифицированных устройств.', 
 NOW() - INTERVAL '37 days'),

-- Комментарии к "Индикаторы для трейдинга"
((SELECT id FROM forum_topics WHERE title LIKE 'Индикаторы для крипто-трейдинга%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'igor_trade'),
 'Использую только RSI и Volume. Остальное - шум. Результат: 60% прибыльных сделок.', 
 NOW() - INTERVAL '27 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Индикаторы для крипто-трейдинга%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'vadim_trader'),
 'Bollinger Bands отлично работают на крипте! Волатильность высокая - сигналы чёткие.', 
 NOW() - INTERVAL '26 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Индикаторы для крипто-трейдинга%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'trader_pro'),
 'Главное не переусложнять. 2-3 индикатора + price action достаточно.', 
 NOW() - INTERVAL '26 days'),

-- Комментарии к "Торговые боты"
((SELECT id FROM forum_topics WHERE title LIKE 'Торговые боты: мой опыт%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'dev_alex'),
 'Отличный результат! Какой таймфрейм используешь для grid trading?', 
 NOW() - INTERVAL '14 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Торговые боты: мой опыт%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'bronislav_dev'),
 'Работаю на 5-минутных свечах. Сетка ±2% от текущей цены, 10 уровней.', 
 NOW() - INTERVAL '13 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Торговые боты: мой опыт%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'nikita_dev'),
 'А как с API ограничениями Binance? У меня бот иногда получает rate limit errors.', 
 NOW() - INTERVAL '13 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Торговые боты: мой опыт%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'bronislav_dev'),
 'Добавил задержки между запросами и кеширование данных. Проблема ушла.', 
 NOW() - INTERVAL '12 days'),

-- Комментарии к "Где учиться блокчейн разработке"
((SELECT id FROM forum_topics WHERE title LIKE 'Где учиться блокчейн разработке%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'pavel_smart'),
 'CryptoZombies - лучшее начало! Прошёл все уроки за неделю и начал писать контракты.', 
 NOW() - INTERVAL '31 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Где учиться блокчейн разработке%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'elena_web3'),
 'Hackathons - супер практика! Участвовал в ETHGlobal, за 48 часов научился больше чем за месяц.', 
 NOW() - INTERVAL '30 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Где учиться блокчейн разработке%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'gleb_dev'),
 'Добавлю LearnWeb3DAO - бесплатный курс с NFT сертификатами после каждого трека.', 
 NOW() - INTERVAL '29 days'),

-- Комментарии к "Криптовалютные подкасты"
((SELECT id FROM forum_topics WHERE title LIKE 'Криптовалютные подкасты%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'ivan_hodl'),
 'Ещё рекомендую Pomp Podcast - интервью с инвесторами и предпринимателями.', 
 NOW() - INTERVAL '23 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Криптовалютные подкасты%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'maria_invest'),
 'Для новичков - Coin Bureau на YouTube. Объясняют сложные вещи простым языком.', 
 NOW() - INTERVAL '22 days'),

-- Комментарии к "Крипто в Telegram"
((SELECT id FROM forum_topics WHERE title LIKE 'Крипто в Telegram%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'trader_pro'),
 'Whale Alert незаменим! Когда видишь большие переводы на биржи - знаешь что будет дамп.', 
 NOW() - INTERVAL '12 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Крипто в Telegram%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'alexey_k'),
 'А есть боты для отслеживания новых листингов на DEX?', 
 NOW() - INTERVAL '11 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Крипто в Telegram%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'ruslan_crypto'),
 'Да, @UniswapNewPairs показывает новые пары на Uniswap в реальном времени!', 
 NOW() - INTERVAL '11 days'),

-- Комментарии к "SEC против крипты"
((SELECT id FROM forum_topics WHERE title LIKE 'SEC против крипты%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'sergey_btc'),
 'Пока SEC воюет, остальной мир принимает крипту. Европа, Азия уже впереди США.', 
 NOW() - INTERVAL '29 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'SEC против крипты%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'maria_invest'),
 'Bitcoin ETF одобрят рано или поздно. Слишком большое давление от институционалов.', 
 NOW() - INTERVAL '28 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'SEC против крипты%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'serafima_k'),
 'Краткосрочно это FUD, долгосрочно - положительно. Регуляция = легитимность.', 
 NOW() - INTERVAL '27 days'),

-- Комментарии к "Налоги на крипту"
((SELECT id FROM forum_topics WHERE title LIKE 'Налоги на крипту: мой опыт%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'boris_pro'),
 'Koinly действительно удобный! Автоматически всё считает, экспортирует отчёт.', 
 NOW() - INTERVAL '35 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Налоги на крипту: мой опыт%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'ivan_hodl'),
 'А если просто HODL и не продаю - нужно декларировать?', 
 NOW() - INTERVAL '34 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Налоги на крипту: мой опыт%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'lyuba_k'),
 'Нет, налог только при продаже или обмене. HODL налогами не облагается!', 
 NOW() - INTERVAL '34 days'),

-- Дополнительные вложенные комментарии (ответы на ответы)
((SELECT id FROM forum_topics WHERE title LIKE 'Торговые боты: мой опыт%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'igor_trade'),
 'Хочу тоже попробовать grid trading. Можешь рекомендации по настройке дать?',
 NOW() - INTERVAL '12 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Где учиться блокчейн разработке%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'zakhar_dev'),
 'Участвовал в Buildspace - отличная практика! Проект за проектом строишь.',
 NOW() - INTERVAL '28 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Hardware кошельки: Ledger vs Trezor%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'anfisa_crypto'),
 'Заказала Trezor Model T после вашего обзора. Спасибо за детали!',
 NOW() - INTERVAL '36 days');