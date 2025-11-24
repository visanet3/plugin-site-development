-- Комментарии к новым темам (часть 1)

-- Комментарии к "Стейкинг vs Lending"
INSERT INTO forum_comments (topic_id, author_id, content, created_at) VALUES
((SELECT id FROM forum_topics WHERE title LIKE 'Стейкинг vs Lending%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'ivan_hodl'),
 'Я за стейкинг! Меньше рисков смарт-контрактов и более стабильная доходность.', 
 NOW() - INTERVAL '36 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Стейкинг vs Lending%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'julia_dex'),
 'А я комбинирую: 60% стейкинг, 40% lending для диверсификации рисков.', 
 NOW() - INTERVAL '35 days'),
 
((SELECT id FROM users WHERE username = 'andrey_stake'), 
 (SELECT id FROM forum_comments WHERE content LIKE '%комбинирую: 60% стейкинг%' LIMIT 1),
 'Отличный подход! Главное не держать всё на одной платформе.',
 NOW() - INTERVAL '35 days' + INTERVAL '3 hours'),

-- Комментарии к "Крипто-портфель для пенсионера"
((SELECT id FROM forum_topics WHERE title LIKE 'Крипто-портфель для пенсионера%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'maria_invest'),
 'Для людей в возрасте я бы вообще 80% держала в стейблах. Безопасность важнее доходности.', 
 NOW() - INTERVAL '18 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Крипто-портфель для пенсионера%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'sergey_btc'),
 'Согласен. Плюс обязательно научите их базовой безопасности - 2FA, hardware wallet.', 
 NOW() - INTERVAL '17 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Крипто-портфель для пенсионера%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'oleg_expert'),
 'Ledger + инструкция большими буквами = идеальное решение для родителей 😊', 
 NOW() - INTERVAL '17 days'),

-- Комментарии к "Топ-5 ошибок начинающих"
((SELECT id FROM forum_topics WHERE title LIKE 'Топ-5 ошибок начинающих%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'alexey_k'),
 'Добавлю 6-ю ошибку: инвестировать деньги которые нужны в ближайшее время. Крипта - это долгосрок!', 
 NOW() - INTERVAL '33 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Топ-5 ошибок начинающих%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'trader_pro'),
 'И 7-я: слушать "экспертов" в твиттере которые обещают x100. Всегда DYOR!', 
 NOW() - INTERVAL '32 days'),

-- Комментарии к "WebAssembly для блокчейна"
((SELECT id FROM forum_topics WHERE title LIKE 'WebAssembly для блокчейна%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'nikita_dev'),
 'Пишу на Rust для NEAR Protocol. WASM действительно быстрее и эффективнее Solidity.', 
 NOW() - INTERVAL '22 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'WebAssembly для блокчейна%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'gleb_dev'),
 'Но экосистема пока сырая. Для простых контрактов Solidity всё ещё проще.', 
 NOW() - INTERVAL '21 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'WebAssembly для блокчейна%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'dev_alex'),
 'Согласен. WASM - для сложных dApps, Solidity - для токенов и простой логики.', 
 NOW() - INTERVAL '21 days'),

-- Комментарии к "Создаю DAO для комьюнити"
((SELECT id FROM forum_topics WHERE title LIKE 'Создаю DAO для комьюнити%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'pavel_smart'),
 'Отличная идея! Готов присоединиться. Опыт в аудите смарт-контрактов есть.', 
 NOW() - INTERVAL '13 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Создаю DAO для комьюнити%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'maksim_eth'),
 'А как планируете распределять токены за вклад? По часам работы или по результатам?', 
 NOW() - INTERVAL '12 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Создаю DAO для комьюнити%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'elena_web3'),
 'По результатам через bounty систему. Комьюнити будет голосовать за качество работы.', 
 NOW() - INTERVAL '12 days'),

-- Комментарии к "Zero-Knowledge Proofs"
((SELECT id FROM forum_topics WHERE title LIKE 'Zero-Knowledge Proofs%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'dev_alex'),
 'Использую zkSync для своих проектов. Газ копеечный, скорость отличная!', 
 NOW() - INTERVAL '30 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Zero-Knowledge Proofs%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'dasha_crypto'),
 'А как с безопасностью? Слышала что в ZK-proof могут быть уязвимости.', 
 NOW() - INTERVAL '29 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Zero-Knowledge Proofs%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'pavel_smart'),
 'Математика проверена. Риск в реализации кода, поэтому важен аудит.', 
 NOW() - INTERVAL '29 days'),

-- Комментарии к "Bitcoin Ordinals"
((SELECT id FROM forum_topics WHERE title LIKE 'Bitcoin Ordinals%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'ivan_hodl'),
 'Как биткойн максималист я против этого. BTC - это деньги, а не платформа для NFT.', 
 NOW() - INTERVAL '26 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Bitcoin Ordinals%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'olga_nft'),
 'Но это показывает гибкость Bitcoin! Инновации - это хорошо.', 
 NOW() - INTERVAL '25 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Bitcoin Ordinals%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'sergey_btc'),
 'Главное чтобы не забивали mempool. Если комиссии вырастут - будет проблема.', 
 NOW() - INTERVAL '25 days'),

-- Комментарии к "Litecoin в 2024"
((SELECT id FROM forum_topics WHERE title LIKE 'Litecoin в 2024%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'boris_trader'),
 'LTC - это надёжность и стабильность. Не каждая монета должна быть хайповой.', 
 NOW() - INTERVAL '15 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Litecoin в 2024%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'trader_pro'),
 'Держу 5% портфеля в LTC как hedge. Если BTC растёт - LTC тоже подрастает.', 
 NOW() - INTERVAL '14 days'),

-- Комментарии к "Стейблкоины: USDC vs USDT vs DAI"
((SELECT id FROM forum_topics WHERE title LIKE 'Стейблкоины: USDC vs USDT vs DAI%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'andrey_stake'),
 'DAI самый безопасный для long-term холдинга. Децентрализация решает!', 
 NOW() - INTERVAL '38 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Стейблкоины: USDC vs USDT vs DAI%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'julia_dex'),
 'Но ликвидность USDT самая большая. На DEX лучшие пулы именно с Tether.', 
 NOW() - INTERVAL '37 days'),
 
((SELECT id FROM forum_topics WHERE title LIKE 'Стейблкоины: USDC vs USDT vs DAI%' ORDER BY id DESC LIMIT 1),
 (SELECT id FROM users WHERE username = 'maria_invest'),
 'Я использую все три в разных пропорциях. Диверсификация важна даже среди стейблов!', 
 NOW() - INTERVAL '36 days');