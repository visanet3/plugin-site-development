-- Добавление 27 новых тем форума с разнообразным контентом

INSERT INTO forum_topics (title, content, author_id, category_id, views, is_pinned, created_at, updated_at) VALUES
-- Темы про инвестиции и стратегии
('Стейкинг vs Lending: что выгоднее?', 'Сравниваю доходность разных стратегий пассивного дохода:

**Стейкинг:**
- ETH 2.0: 4-5% годовых
- Cosmos: 7-9% 
- Polkadot: 12-14%

**Lending (Aave):**
- USDC: 3-5%
- DAI: 4-6%
- ETH: 2-3%

Какой способ предпочитаете вы?',
(SELECT id FROM users WHERE username = 'andrey_stake'), 28, 567, FALSE, NOW() - INTERVAL '37 days', NOW() - INTERVAL '4 days'),

('Крипто-портфель для пенсионера: есть ли смысл?', 'Родители просят помочь инвестировать в крипту. Им по 60 лет.

Думаю составить ультра-консервативный портфель:
- 70% стейблкоины (USDC, USDT) на Aave
- 20% Bitcoin
- 10% Ethereum

Срок: 5-7 лет. Что думаете, безопасно ли это?',
(SELECT id FROM users WHERE username = 'marina_s'), 26, 445, FALSE, NOW() - INTERVAL '19 days', NOW() - INTERVAL '1 day'),

('Топ-5 ошибок начинающих инвесторов', 'Сам прошел через все эти грабли, делюсь опытом:

1. **FOMO** - покупка на хаях из-за страха упустить
2. **Отсутствие стоп-лоссов** - надежда что "отскочит"
3. **Все яйца в одной корзине** - ставка на одну монету
4. **Торговля на эмоциях** - паника при просадке
5. **Игнорирование fundamentals** - покупка только по hype

Что бы вы добавили в этот список?',
(SELECT id FROM users WHERE username = 'ivan_hodl'), 25, 892, TRUE, NOW() - INTERVAL '34 days', NOW() - INTERVAL '3 days'),

-- Темы про технологии и разработку
('WebAssembly для блокчейна: будущее смарт-контрактов?', 'Изучаю WebAssembly (WASM) как альтернативу Solidity.

**Преимущества:**
- Быстрее выполнение
- Можно писать на разных языках (Rust, C++, AssemblyScript)
- Лучше для вычислительно сложных задач

**Минусы:**
- Меньше инструментов
- Сложнее отладка

Кто уже пробовал NEAR или Polkadot с WASM?',
(SELECT id FROM users WHERE username = 'dev_alex'), 37, 345, FALSE, NOW() - INTERVAL '23 days', NOW() - INTERVAL '2 days'),

('Создаю DAO для комьюнити разработчиков', 'Запускаю децентрализованную организацию для крипто-девелоперов.

**Что планирую:**
- Общая казна для финансирования проектов
- Голосование по направлениям развития
- Совместные open-source разработки
- Образовательные программы

**Токеномика:**
- 40% - участникам за вклад
- 30% - на развитие проектов
- 20% - команде основателей
- 10% - резервный фонд

Интересно? Пишите!',
(SELECT id FROM users WHERE username = 'elena_web3'), 37, 678, TRUE, NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 day'),

('Zero-Knowledge Proofs: как они работают?', 'Объясняю простыми словами что такое ZK-proofs.

**Пример:**
Вы хотите доказать что знаете пароль, не раскрывая его.

**Как это работает в блокчейне:**
1. Генерируется математическое доказательство
2. Проверяется валидность без раскрытия данных
3. Подтверждается транзакция

**Применение:**
- Privacy coins (Zcash)
- Scalability (zkRollups)
- Identity verification

Кто использовал zkSync или StarkNet?',
(SELECT id FROM users WHERE username = 'pavel_smart'), 37, 789, TRUE, NOW() - INTERVAL '31 days', NOW() - INTERVAL '5 days'),

-- Темы про монеты и токены
('Bitcoin Ordinals: NFT на биткоине?', 'Недавно узнал про Ordinals - способ создавать NFT прямо в блокчейне Bitcoin!

**Как работает:**
- Inscriptions записываются в свидетеля транзакции
- Каждый satoshi получает уникальный номер
- Можно прикреплять изображения, текст, код

**Споры в комьюнити:**
За: инновация, новые use cases для BTC
Против: спам в блокчейне, рост комиссий

Что думаете?',
(SELECT id FROM users WHERE username = 'sergey_btc'), 11, 456, FALSE, NOW() - INTERVAL '27 days', NOW() - INTERVAL '3 days'),

('Litecoin в 2024: есть ли будущее?', 'LTC был одним из первых альткоинов, но сейчас о нём мало говорят.

**Плюсы:**
- Быстрые транзакции (2.5 мин блок)
- Низкие комиссии
- Проверенная временем сеть
- MimbleWimble для privacy

**Минусы:**
- Нет уникального value proposition
- Низкая активность разработки
- Конкуренция с более новыми проектами

Кто-нибудь ещё держит LTC?',
(SELECT id FROM users WHERE username = 'alexey_k'), 11, 234, FALSE, NOW() - INTERVAL '16 days', NOW() - INTERVAL '2 days'),

('Стейблкоины: USDC vs USDT vs DAI', 'Разбираюсь какой стейблкоин самый безопасный.

**USDT (Tether):**
✅ Самая большая ликвидность
❌ Сомнения в резервах

**USDC (Circle):**
✅ Прозрачные аудиты
✅ Регулируется в США
❌ Риск заморозки счетов

**DAI (MakerDAO):**
✅ Децентрализованный
✅ Прозрачные коллатералы
❌ Сложный механизм

Мой выбор: 50% USDC, 30% DAI, 20% USDT для диверсификации.',
(SELECT id FROM users WHERE username = 'maria_invest'), 4, 567, TRUE, NOW() - INTERVAL '39 days', NOW() - INTERVAL '6 days'),

-- Темы про блокчейны и сети
('Cosmos IBC: интернет блокчейнов уже здесь', 'Inter-Blockchain Communication - революция в кросс-чейн переводах!

**Что даёт IBC:**
- Прямой обмен между блокчейнами
- Без wrapped токенов
- Без мостов-посредников
- Быстро и дешево

**Работает между:**
- Cosmos Hub, Osmosis, Juno
- Terra (до краха), Kujira
- Celestia, Stride, Injective

Кто пробовал? Впечатления?',
(SELECT id FROM users WHERE username = 'nikita_dev'), 49, 445, FALSE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days'),

('Avalanche Subnets: создай свой блокчейн', 'Avalanche позволяет запускать кастомные подсети (subnets).

**Преимущества:**
- Собственные правила консенсуса
- Кастомная экономика газа
- Контроль над валидаторами
- Совместимость с основной сетью

**Кейсы:**
- DeFi Kingdoms (игровой subnet)
- Swimmer Network (canary сеть)
- Корпоративные приложения

Думаю запустить subnet для своего проекта. Опыт есть у кого?',
(SELECT id FROM users WHERE username = 'gleb_dev'), 49, 334, FALSE, NOW() - INTERVAL '21 days', NOW() - INTERVAL '1 day'),

('Polygon zkEVM: Ethereum становится дешевым', 'Тестирую новый zkEVM от Polygon - это невероятно!

**Результаты:**
- Свап на DEX: $0.08 вместо $15 на L1
- NFT минт: $0.05 вместо $50
- Скорость: 1-2 секунды

**Совместимость:**
Все инструменты Ethereum работают без изменений!
- MetaMask
- Hardhat
- Ethers.js

Это именно то масштабирование которое нужно Ethereum!',
(SELECT id FROM users WHERE username = 'maksim_eth'), 20, 892, TRUE, NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 hours'),

-- Темы про DeFi
('Impermanent Loss: мой опыт за год', 'Год назад вложил $10k в пул ETH/USDC на Uniswap v3.

**Результаты:**
- Заработал на комиссиях: $1,200
- Потерял на IL: $800
- Чистая прибыль: $400 (4%)

**Выводы:**
- IL реален, но не страшен в стабильных парах
- Комиссии компенсируют потери
- v3 эффективнее v2 при правильном диапазоне

Кто еще занимается LP? Поделитесь цифрами!',
(SELECT id FROM users WHERE username = 'julia_dex'), 25, 567, FALSE, NOW() - INTERVAL '29 days', NOW() - INTERVAL '4 days'),

('Yield Aggregators: автопилот для фарминга', 'Использую Yearn Finance для автоматизации yield farming.

**Как работает:**
1. Депозит в vault
2. Стратегия автоматически ищет лучшую доходность
3. Авто-компаундинг профита
4. Диверсификация рисков

**Мои результаты (6 месяцев):**
- Вложено: $5,000
- Средний APY: 12%
- Заработано: $310
- Комиссии: $40

Альтернативы: Beefy, Convex, Badger',
(SELECT id FROM users WHERE username = 'victoria_yield'), 28, 678, FALSE, NOW() - INTERVAL '33 days', NOW() - INTERVAL '5 days'),

('Флеш-кредиты: заработок без капитала', 'Разобрался как работают flash loans в DeFi.

**Концепция:**
Берёшь кредит и возвращаешь в одной транзакции!

**Применение:**
- Арбитраж между DEX
- Ликвидация позиций
- Коллатерал свап

**Мой первый опыт:**
Взял 50 ETH из Aave, обменял на 3 DEX, вернул + заработал $47 за секунды!

Риски: газ может съесть профит. Нужны навыки кодинга.',
(SELECT id FROM users WHERE username = 'bronislav_dev'), 25, 445, TRUE, NOW() - INTERVAL '12 days', NOW() - INTERVAL '8 hours'),

-- Темы про NFT и метавселенные
('NFT без картинок: utility tokens', 'NFT - это не только jpeg обезьянки!

**Реальное применение:**
1. Доступ к закрытым комьюнити
2. Билеты на события
3. Членство в DAO
4. Скидки и бонусы
5. Доказательство владения активом

**Примеры:**
- ENS домены
- Unlock Protocol (подписки)
- POAP (proof of attendance)
- Real estate NFTs

Какие utility NFT вы используете?',
(SELECT id FROM users WHERE username = 'olga_nft'), 43, 789, FALSE, NOW() - INTERVAL '26 days', NOW() - INTERVAL '3 days'),

('Метавселенные: хайп или будущее?', 'Потратил месяц на изучение Decentraland и The Sandbox.

**Плюсы:**
- Реальная экономика (покупка земли, аренда)
- Социальное взаимодействие
- Концерты и события
- Галереи NFT

**Минусы:**
- Графика устарела
- Мало пользователей онлайн
- Дорогой вход (земля от $1000)

Думаю это long-term игра. Кто уже купил землю?',
(SELECT id FROM users WHERE username = 'fedor_k'), 47, 456, FALSE, NOW() - INTERVAL '22 days', NOW() - INTERVAL '2 days'),

-- Темы про безопасность
('Мультисиг кошельки: зачем они нужны?', 'Настроил multisig через Gnosis Safe для семейных накоплений.

**Схема:**
3 подписи из 5 для транзакции
- Я
- Жена
- Брат
- Родители (2)

**Преимущества:**
✅ Защита от кражи (нужно скомпрометить несколько человек)
✅ Защита от потери (любой может потерять ключ)
✅ Прозрачность операций

**Стоимость:**
Setup: $50 газа
Транзакции: обычные + 20%

Рекомендую для сумм >$10k',
(SELECT id FROM users WHERE username = 'boris_pro'), 48, 567, TRUE, NOW() - INTERVAL '35 days', NOW() - INTERVAL '4 days'),

('Фишинг атаки: как меня чуть не обманули', 'История как я чуть не потерял весь портфель.

**Что случилось:**
1. Письмо от "MetaMask Support"
2. Просили подключиться к сайту для "верификации"
3. Сайт выглядел идентично настоящему
4. В последний момент заметил неправильный домен

**Red flags:**
❌ metamask-support.com вместо metamask.io
❌ Просят seed phrase
❌ Срочность ("аккаунт заблокируют через 24ч")
❌ Странная грамматика

Будьте бдительны! Поделитесь своими историями.',
(SELECT id FROM users WHERE username = 'anfisa_crypto'), 48, 1234, FALSE, NOW() - INTERVAL '11 days', NOW() - INTERVAL '5 hours'),

('Hardware кошельки: Ledger vs Trezor 2024', 'Купил оба устройства, делаю сравнение.

**Ledger Nano X:**
✅ Bluetooth (удобно с телефоном)
✅ Больше памяти для приложений
✅ Поддержка 5500+ монет
❌ Дороже ($150)
❌ История с утечкой данных клиентов

**Trezor Model T:**
✅ Полностью open-source
✅ Сенсорный экран
✅ Shamir Backup
❌ Дороже ($200)
❌ Меньше поддерживаемых монет

Мой выбор: Ledger для основного портфеля, Trezor для BTC/ETH',
(SELECT id FROM users WHERE username = 'oleg_expert'), 48, 678, TRUE, NOW() - INTERVAL '40 days', NOW() - INTERVAL '7 days'),

-- Темы про трейдинг
('Индикаторы для крипто-трейдинга: что работает?', 'Тестирую технический анализ последние 3 месяца.

**Что реально помогает:**
✅ RSI - показывает перекупленность/перепроданность
✅ MACD - тренд и моментум
✅ Volume - подтверждение движений

**Что не работает:**
❌ Фигуры (голова-плечи и тд) - слишком субъективно
❌ Fibonacci - работает 50/50

**Результаты:**
35 сделок: 22 прибыльных, 13 убыточных
ROI: +18%

Какие индикаторы используете вы?',
(SELECT id FROM users WHERE username = 'trader_pro'), 25, 567, FALSE, NOW() - INTERVAL '28 days', NOW() - INTERVAL '3 days'),

('Торговые боты: мой опыт автоматизации', 'Написал торгового бота на Python для Binance.

**Стратегия:**
Grid trading на волатильных парах

**Код:**
- API Binance через python-binance
- Стратегия: сетка ордеров ±2% от цены
- Рабочие пары: ETH/USDT, BNB/USDT

**Результаты (2 месяца):**
Капитал: $2,000
Профит: $340 (+17%)
Просадка: -8% макс

Код выложу на GitHub если интересно!',
(SELECT id FROM users WHERE username = 'bronislav_dev'), 48, 789, FALSE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),

-- Темы про обучение и комьюнити
('Где учиться блокчейн разработке в 2024?', 'Составил список лучших ресурсов для обучения:

**Бесплатные:**
1. CryptoZombies - Solidity в игровой форме
2. Ethereum.org tutorials
3. YouTube: Patrick Collins, Dapp University
4. Buildspace проекты

**Платные:**
1. Alchemy University ($0, но сертификаты платные)
2. Udemy курсы по Solidity ($10-30)
3. Consensys Academy

**Практика:**
- Hackathons (ETHGlobal)
- Bounties на Gitcoin
- Open source вклад

С чего вы начинали?',
(SELECT id FROM users WHERE username = 'dev_alex'), 37, 891, TRUE, NOW() - INTERVAL '32 days', NOW() - INTERVAL '4 days'),

('Криптовалютные подкасты: что слушать?', 'Мои любимые подкасты про крипту:

**На английском:**
1. Bankless - DeFi и Ethereum
2. Unchained - интервью с основателями
3. The Defiant - DeFi новости
4. Epicenter - технические детали

**На русском:**
1. Крипта - обзоры и новости
2. Биткойн & - философия и экономика
3. DeFi Daily - короткие дейли обзоры

Время в пути теперь проходит с пользой! Что слушаете вы?',
(SELECT id FROM users WHERE username = 'katerina_crypto'), 47, 456, FALSE, NOW() - INTERVAL '24 days', NOW() - INTERVAL '2 days'),

('Крипто в Telegram: лучшие каналы и боты', 'Собрал полезные Telegram ресурсы:

**Новости:**
- @cryptonews
- @bitcoinmagazine
- @coindesk

**Аналитика:**
- @glassnode
- @santimentfeed

**Боты:**
- @DexScreenerBot - цены токенов
- @GasPriceTracker - газ Ethereum
- @TrendingScanner - trending монеты

**Сигналы:**
- @whale_alert - крупные транзакции

Какие каналы читаете вы?',
(SELECT id FROM users WHERE username = 'ruslan_crypto'), 47, 567, FALSE, NOW() - INTERVAL '13 days', NOW() - INTERVAL '18 hours'),

-- Темы про регуляцию и налоги
('SEC против крипты: что происходит?', 'Слежу за регуляцией в США. Основные события:

**Против:**
- Иски против Coinbase, Binance
- Ripple (XRP) - затяжной суд
- Объявление большинства токенов securities

**За:**
- Решение суда по Grayscale (победа)
- Обсуждение spot Bitcoin ETF
- Лоббирование от крипто-индустрии

**Моё мнение:**
Краткосрочно - негатив
Долгосрочно - ясность в регулировании пойдёт на пользу

Как это влияет на ваши инвестиции?',
(SELECT id FROM users WHERE username = 'serafima_k'), 47, 678, FALSE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),

('Налоги на крипту: мой опыт декларирования', 'Подал декларацию по крипто-доходам за 2023.

**Что декларировал:**
- Продажа BTC с профитом
- Доход от стейкинга
- P2P транзакции

**Сколько заплатил:**
13% от прибыли = $2,340

**Как считал:**
1. Экспортировал историю из бирж
2. Использовал Koinly для подсчёта
3. Подготовил отчёт для налоговой

**Совет:**
Декларируйте легально! Штрафы за сокрытие намного больше.',
(SELECT id FROM users WHERE username = 'lyuba_k'), 47, 445, TRUE, NOW() - INTERVAL '36 days', NOW() - INTERVAL '6 days');