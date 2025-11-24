-- Комментарии к новым темам (часть 2)

INSERT INTO forum_comments (topic_id, author_id, content, created_at) VALUES
-- Комментарии к "Cosmos IBC"
((SELECT id FROM forum_topics WHERE title LIKE 'Cosmos IBC%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'dev_alex'),
 'IBC - это то что нужно было индустрии! Никаких wrapped токенов и мостов.', 
 NOW() - INTERVAL '24 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Cosmos IBC%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'julia_dex'),
 'Osmosis DEX работает через IBC - обмен между разными сетями без посредников!', 
 NOW() - INTERVAL '23 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Cosmos IBC%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'nikita_dev'),
 'Главное что это работает надёжно. За год использования ни одной проблемы.', 
 NOW() - INTERVAL '23 days'),

-- Комментарии к "Avalanche Subnets"
((SELECT id FROM forum_topics WHERE title LIKE 'Avalanche Subnets%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'maksim_eth'),
 'DeFi Kingdoms показал что subnets работают. Своя экономика, свои правила!', 
 NOW() - INTERVAL '20 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Avalanche Subnets%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'gleb_dev'),
 'Стоимость запуска subnet не маленькая - нужны валидаторы. Но для серьёзного проекта оно того стоит.', 
 NOW() - INTERVAL '19 days'),

-- Комментарии к "Polygon zkEVM"
((SELECT id FROM forum_topics WHERE title LIKE 'Polygon zkEVM%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'dev_alex'),
 'Это именно то решение которое нужно Ethereum! Совместимость + масштабирование.', 
 NOW() - INTERVAL '17 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Polygon zkEVM%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'pavel_smart'),
 'Перевёл свой dApp на zkEVM. Пользователи в восторге от низких комиссий!', 
 NOW() - INTERVAL '16 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Polygon zkEVM%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'maksim_eth'),
 'Конкуренция между zkSync, Polygon zkEVM, StarkNet идёт на пользу всем. Выбор огромный!', 
 NOW() - INTERVAL '16 days'),

-- Комментарии к "Impermanent Loss"
((SELECT id FROM forum_topics WHERE title LIKE 'Impermanent Loss%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'andrey_stake'),
 'Спасибо за честные цифры! Многие умалчивают про IL и показывают только комиссии.', 
 NOW() - INTERVAL '28 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Impermanent Loss%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'trader_pro'),
 'А в волатильных парах типа ETH/ALT IL может съесть всю прибыль. Осторожнее!', 
 NOW() - INTERVAL '27 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Impermanent Loss%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'julia_dex'),
 'Поэтому я предпочитаю стейбл-пары. IL минимальный, комиссии стабильные.', 
 NOW() - INTERVAL '27 days'),

-- Комментарии к "Yield Aggregators"
((SELECT id FROM forum_topics WHERE title LIKE 'Yield Aggregators%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'victoria_yield'),
 'Beefy Finance тоже отличный агрегатор! Работает на многих сетях.', 
 NOW() - INTERVAL '32 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Yield Aggregators%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'ivan_hodl'),
 'А риски смарт-контрактов вас не пугают? Один эксплойт - и всё потеряно.', 
 NOW() - INTERVAL '31 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Yield Aggregators%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'andrey_stake'),
 'Yearn существует с 2020 и ни разу не взламывали. Плюс страховка через Nexus Mutual.', 
 NOW() - INTERVAL '31 days'),

-- Комментарии к "Флеш-кредиты"
((SELECT id FROM forum_topics WHERE title LIKE 'Флеш-кредиты%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'dev_alex'),
 'Круто! Можешь поделиться кодом? Хочу попробовать сам.', 
 NOW() - INTERVAL '11 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Флеш-кредиты%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'pavel_smart'),
 'Главное помнить что если транзакция не успешна - теряешь газ. Надо тестировать на форках.', 
 NOW() - INTERVAL '10 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Флеш-кредиты%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'bronislav_dev'),
 'Код выложу! Но имейте в виду - конкуренция большая, профитные возможности находят секунды.', 
 NOW() - INTERVAL '10 days'),

-- Комментарии к "NFT без картинок"
((SELECT id FROM forum_topics WHERE title LIKE 'NFT без картинок%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'elena_web3'),
 'ENS домены - лучший пример utility NFT! Использую вместо длинного адреса.', 
 NOW() - INTERVAL '25 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'NFT без картинок%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'fedor_k'),
 'POAP токены для мероприятий тоже крутая идея. Доказательство участия навсегда.', 
 NOW() - INTERVAL '24 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'NFT без картинок%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'olga_nft'),
 'Билеты на концерты как NFT - будущее event индустрии. Перепродажа, authenticity, royalty!', 
 NOW() - INTERVAL '24 days'),

-- Комментарии к "Метавселенные"
((SELECT id FROM forum_topics WHERE title LIKE 'Метавселенные: хайп%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'olga_nft'),
 'Купила землю в Decentraland за $800. Пока не окупилось, но верю в long-term.', 
 NOW() - INTERVAL '21 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Метавселенные: хайп%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'alexey_k'),
 'Проблема что людей онлайн мало. Пока это больше спекуляция землёй чем реальное использование.', 
 NOW() - INTERVAL '20 days'),

-- Комментарии к "Мультисиг кошельки"
((SELECT id FROM forum_topics WHERE title LIKE 'Мультисиг кошельки%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'pavel_smart'),
 'Gnosis Safe - золотой стандарт для multisig! Использую для корпоративных средств.', 
 NOW() - INTERVAL '34 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Мультисиг кошельки%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'sergey_btc'),
 'А для Bitcoin рекомендую Electrum multisig. Проще и дешевле в использовании.', 
 NOW() - INTERVAL '33 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Мультисиг кошельки%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'boris_pro'),
 'Главное записать кто какой ключ держит и где он хранится. Организация важна!', 
 NOW() - INTERVAL '32 days'),

-- Комментарии к "Фишинг атаки"
((SELECT id FROM forum_topics WHERE title LIKE 'Фишинг атаки%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'oleg_expert'),
 'Главное правило: НИКОГДА не вводить seed phrase нигде кроме кошелька!', 
 NOW() - INTERVAL '10 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Фишинг атаки%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'ruslan_crypto'),
 'Я потерял $300 на фейковом airdrop. Подписал транзакцию и всё - USDT украли.', 
 NOW() - INTERVAL '9 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Фишинг атаки%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'anfisa_crypto'),
 'Используйте hardware wallet для больших сумм! Там подписание безопасное.', 
 NOW() - INTERVAL '9 days');