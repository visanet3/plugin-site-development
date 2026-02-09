-- Восстанавливаем реальные данные старых транзакций из таблицы transactions
-- ID 2184: Обмен 0.00100000 BTC на 96.0562254 USDT (продажа BTC)
UPDATE crypto_transactions SET 
  amount = 0.00100000,
  price = 96056.2254,
  is_test = FALSE
WHERE id = 1 AND user_id = 7;

-- ID 2183: Обмен 0.01000000 BTC на 960.469719 USDT (продажа BTC)  
UPDATE crypto_transactions SET
  amount = 0.01000000,
  price = 96046.9719,
  is_test = FALSE
WHERE id = 2 AND user_id = 7;

-- ID 2181: Обмен 1000 USDT на 0.01047874 BTC (покупка BTC)
UPDATE crypto_transactions SET
  amount = 0.01047874,
  price = 95432.89,
  total = 1000.00,
  is_test = FALSE
WHERE id = 3 AND user_id = 7;

-- ID 2149: Обмен 100.00000000 SOL на 12686.25 USDT (продажа SOL)
UPDATE crypto_transactions SET
  amount = 100.00000000,
  price = 126.8625,
  is_test = FALSE
WHERE id = 16 AND user_id = 7;

-- ID 2144: Обмен 541.92156000 SOL на 67886.78478198 USDT (продажа SOL)
UPDATE crypto_transactions SET
  amount = 541.92156000,
  price = 125.27,
  is_test = FALSE
WHERE id = 19 AND user_id = 7;

-- ID 2143: Обмен 10000 USDT на 0.11561507 BTC (покупка BTC)
UPDATE crypto_transactions SET
  amount = 0.11561507,
  price = 86490.00,
  is_test = FALSE
WHERE id = 20 AND user_id = 7;

-- ID 2125: Обмен 11.23634115 BTC на 1001792.596922299 USDT (продажа BTC)
UPDATE crypto_transactions SET
  amount = 11.23634115,
  price = 89159.76,
  is_test = FALSE
WHERE id = 24 AND user_id = 7;

-- ID 2106: Обмен 880000 USDT на 9.88295147 BTC (покупка BTC)
UPDATE crypto_transactions SET
  amount = 9.88295147,
  price = 89034.00,
  is_test = FALSE
WHERE id = 25 AND user_id = 7;

-- ID 2105: Обмен 10.00000000 BTC на 881097.2755 USDT (продажа BTC)
UPDATE crypto_transactions SET
  amount = 10.00000000,
  price = 88109.73,
  is_test = FALSE
WHERE id = 26 AND user_id = 7;

-- ID 2104: Обмен 990000 USDT на 11.11462219 BTC (покупка BTC)
UPDATE crypto_transactions SET
  amount = 11.11462219,
  price = 89077.00,
  is_test = FALSE
WHERE id = 27 AND user_id = 7;

-- ID 2103: Обмен 10000 USDT на 0.11217625 BTC (покупка BTC)
UPDATE crypto_transactions SET
  amount = 0.11217625,
  price = 89143.00,
  is_test = FALSE
WHERE id = 28 AND user_id = 7;

-- ID 2102: Обмен 7777 USDT на 59.37928528 SOL (покупка SOL)
UPDATE crypto_transactions SET
  amount = 59.37928528,
  price = 130.96,
  is_test = FALSE
WHERE id = 29 AND user_id = 7;

-- ID 2099: Обмен 1.00000000 BTC на 88258.51985 USDT (продажа BTC)
UPDATE crypto_transactions SET
  amount = 1.00000000,
  price = 88258.52,
  is_test = FALSE
WHERE id = 31 AND user_id = 7;

-- ID 2098: Обмен 10000 USDT на 5010.95268984 XRP (покупка XRP)
UPDATE crypto_transactions SET
  amount = 5010.95268984,
  price = 1.996,
  is_test = FALSE
WHERE id = 32 AND user_id = 7;

-- ID 2097: Обмен 100000 USDT на 764.99183180 SOL (покупка SOL)
UPDATE crypto_transactions SET
  amount = 764.99183180,
  price = 130.72,
  is_test = FALSE
WHERE id = 33 AND user_id = 7;

-- ID 2096: Обмен 10000 USDT на 11.26868489 BNB (покупка BNB)
UPDATE crypto_transactions SET
  amount = 11.26868489,
  price = 887.50,
  is_test = FALSE
WHERE id = 34 AND user_id = 7;

-- ID 2095: Обмен 10000 USDT на 3.21885352 ETH (покупка ETH)
UPDATE crypto_transactions SET
  amount = 3.21885352,
  price = 3107.00,
  is_test = FALSE
WHERE id = 35 AND user_id = 7;

-- ID 2094: Обмен 100000 USDT на 1.12115769 BTC (покупка BTC)
UPDATE crypto_transactions SET
  amount = 1.12115769,
  price = 89192.00,
  is_test = FALSE
WHERE id = 36 AND user_id = 7;